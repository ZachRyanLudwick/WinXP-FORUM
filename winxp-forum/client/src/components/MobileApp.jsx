import React, { useState, useEffect, useRef } from 'react';
import { Home, Plus, User, Search, MessageCircle, Heart, Calendar } from 'lucide-react';
import { apiCall, API_URL } from '../utils/api';
import XPPopup from './XPPopup';

// Strip markdown for clean preview text
const stripMarkdown = (content) => {
  if (!content || typeof content !== 'string') return '';
  
  return String(content)
    .replace(/```[\s\S]*?```/g, '[code]')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '[image]')
    .replace(/^## (.*$)/gm, '$1')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^- (.*$)/gm, '$1')
    .replace(/\n/g, ' ')
    .trim();
};

// Simple markdown-style renderer for mobile
const renderContent = (content) => {
  if (!content || typeof content !== 'string') return '';
  
  let rendered = String(content)
    // Code blocks first (before inline code)
    .replace(/```([\s\S]*?)```/g, '<pre style="background:#f5f5f5;padding:8px;border-radius:4px;overflow-x:auto;border:1px solid #ddd;margin:6px 0;font-family:monospace;font-size:10px;white-space:pre-wrap;"><code>$1</code></pre>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;margin:6px 0;border:1px solid #ddd;border-radius:4px;" />')
    // File links - render as download boxes
    .replace(/\[📎 ([^\]]+)\]\(([^)]+)\)/g, '<div class="file-download-box" data-url="$2" data-name="$1" style="display:block;background:#f8f9fa;border:1px solid #dee2e6;border-radius:6px;padding:8px;margin:8px 0;cursor:pointer;font-size:10px;"><div style="display:flex;align-items:center;gap:8px;"><div style="font-size:16px;">📄</div><div style="flex:1;"><div style="font-weight:bold;font-size:10px;margin-bottom:2px;">$1</div><div style="font-size:9px;color:#666;">Tap to download</div></div><div style="background:#007bff;color:white;padding:4px 8px;border-radius:3px;font-size:9px;">💾</div></div></div>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:1px 4px;border-radius:2px;font-family:monospace;font-size:10px;color:#d63384;">$1</code>')
    // Headers
    .replace(/^## (.*$)/gm, '<h3 style="font-size:13px;font-weight:bold;margin:12px 0 6px 0;color:#333;">$1</h3>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:bold;">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em style="font-style:italic;">$1</em>')
    // Lists
    .replace(/^- (.*$)/gm, '<div style="margin-left:15px;margin-bottom:3px;">• $1</div>')
    // Line breaks
    .replace(/\n/g, '<br>');
    
  return rendered;
};

// Isolated input components to prevent re-rendering issues
const CommentInput = React.memo(({ onSubmit, disabled = false }) => {
  const [text, setText] = useState('');
  
  const handleSubmit = React.useCallback(() => {
    if (text.trim()) {
      onSubmit(text);
      setText('');
    }
  }, [text, onSubmit]);

  return (
    <div style={{ marginTop: '15px' }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a comment..."
        style={{
          width: '100%',
          height: '60px',
          padding: '8px',
          border: '1px inset #c0c0c0',
          fontFamily: 'Tahoma, sans-serif',
          fontSize: '11px',
          resize: 'none'
        }}
      />
      <button
        onClick={handleSubmit}
        disabled={!text.trim() || disabled}
        style={{
          marginTop: '8px',
          padding: '6px 12px',
          background: '#ece9d8',
          border: '2px solid',
          borderColor: '#ffffff #404040 #404040 #ffffff',
          fontFamily: 'Tahoma, sans-serif',
          fontSize: '11px',
          cursor: text.trim() && !disabled ? 'pointer' : 'not-allowed'
        }}
      >
        Post Comment
      </button>
    </div>
  );
});

const ReplyInput = React.memo(({ onSubmit, onCancel, disabled = false }) => {
  const [text, setText] = useState('');
  
  const handleSubmit = React.useCallback(() => {
    if (text.trim()) {
      onSubmit(text);
      setText('');
    }
  }, [text, onSubmit]);

  return (
    <div style={{
      marginLeft: '20px',
      marginBottom: '10px',
      padding: '8px',
      background: '#f8f8f8',
      border: '1px solid #ddd'
    }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write a reply..."
        style={{
          width: '100%',
          height: '50px',
          padding: '6px',
          border: '1px inset #c0c0c0',
          fontFamily: 'Tahoma, sans-serif',
          fontSize: '10px',
          resize: 'none'
        }}
      />
      <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || disabled}
          style={{
            padding: '4px 8px',
            background: '#ece9d8',
            border: '2px solid',
            borderColor: '#ffffff #404040 #404040 #ffffff',
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '9px',
            cursor: text.trim() && !disabled ? 'pointer' : 'not-allowed'
          }}
        >
          Reply
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '4px 8px',
            background: '#ece9d8',
            border: '2px solid',
            borderColor: '#ffffff #404040 #404040 #ffffff',
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '9px'
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
});

const MobileApp = () => {
  // Add error handling
  try {
  const [currentView, setCurrentView] = useState('home');
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [profileTab, setProfileTab] = useState('overview');
  const [friendshipStatus, setFriendshipStatus] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [viewingProfile, setViewingProfile] = useState(null);
  const [postFilter, setPostFilter] = useState('official');
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [currentExtrasView, setCurrentExtrasView] = useState('menu');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTexts, setReplyTexts] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupType, setPopupType] = useState('info');
  const [popupTitle, setPopupTitle] = useState('');

  // Define fetch functions with loading flags to prevent multiple calls
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [requestsLoading, setRequestsLoading] = useState(false);
  
  // Track if initial data has been fetched
  const [initialDataFetched, setInitialDataFetched] = useState(false);
  
  const fetchFriendRequests = async () => {
    if (requestsLoading) return;
    setRequestsLoading(true);
    try {
      const response = await apiCall('/api/friends/requests');
      if (response.ok) {
        const data = await response.json();
        setFriendRequests(data);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchFriends = async () => {
    if (friendsLoading) return;
    setFriendsLoading(true);
    try {
      const response = await apiCall('/api/friends');
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setFriendsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: payload.userId });
      } catch (e) {
        localStorage.removeItem('token');
      }
    }
    // Only fetch posts once on mount
    fetchPosts();
    
    // Check for post URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post');
    if (postId) {
      // Fetch and open specific post
      fetchSpecificPost(postId);
    }
  }, []);
  
  const fetchSpecificPost = async (postId) => {
    try {
      const response = await apiCall(`/api/posts/${postId}`);
      if (response.ok) {
        const post = await response.json();
        setSelectedPost(post);
        // Clear URL parameter
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (error) {
      console.error('Error fetching specific post:', error);
    }
  };
  


  // Fetch friends when user logs in - NO POLLING
  useEffect(() => {
    if (!user || initialDataFetched) return;
    
    // Fetch initial data only once
    fetchFriends();
    fetchFriendRequests();
    
    setInitialDataFetched(true);
  }, [user, initialDataFetched]);

  const fetchPosts = async (filter = 'official') => {
    try {
      const endpoint = filter === 'community' ? '/api/posts/community' : '/api/posts';
      const response = await apiCall(endpoint);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId = null) => {
    try {
      const endpoint = userId ? `/api/profile/user/${userId}` : '/api/profile';
      const response = await apiCall(endpoint);
      if (response.ok) {
        const data = await response.json();
        if (userId) {
          setViewingProfile(data);
        } else {
          setUserProfile(data);
        }
      } else {
        console.error('Profile not found');
        setViewingProfile(null);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setViewingProfile(null);
    }
  };

  const sendFriendRequest = async (userId) => {
    try {
      const response = await apiCall('/api/friends/request', {
        method: 'POST',
        body: JSON.stringify({ recipientId: userId })
      });
      
      if (response.ok) {
        setPopupTitle('Friend Request Sent');
        setPopupMessage('Your friend request has been sent successfully!');
        setPopupType('success');
        setShowPopup(true);
      } else {
        const errorData = await response.json();
        setPopupTitle('Request Failed');
        setPopupMessage(errorData.message || 'Failed to send friend request');
        setPopupType('error');
        setShowPopup(true);
      }
    } catch (error) {
      setPopupTitle('Network Error');
      setPopupMessage('Unable to send friend request. Please try again.');
      setPopupType('error');
      setShowPopup(true);
    }
  };

  const handleLike = async (postId) => {
    try {
      const response = await apiCall(`/api/posts/${postId}/like`, {
        method: 'POST'
      });
      if (response.ok) {
        const updatedPost = await response.json();
        // Preserve the original author data
        updatedPost.author = selectedPost.author;
        setLiked(!liked);
        setLikeCount(prev => liked ? prev - 1 : prev + 1);
        setSelectedPost(updatedPost);
      }
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleComment = async (postId, content) => {
    try {
      const response = await apiCall(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
      if (response.ok) {
        const updatedPost = await response.json();
        // Preserve the original author data
        updatedPost.author = selectedPost.author;
        setSelectedPost(updatedPost);
        setCommentText('');
      }
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleReply = async (postId, commentId, content) => {
    try {
      const response = await apiCall(`/api/posts/${postId}/comments/${commentId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ content })
      });
      if (response.ok) {
        const updatedPost = await response.json();
        // Preserve the original author data
        updatedPost.author = selectedPost.author;
        setSelectedPost(updatedPost);
        setReplyTexts(prev => ({ ...prev, [commentId]: '' }));
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const downloadFile = async (filename, originalName) => {
    try {
      const response = await fetch(`${API_URL}/api/download/${filename}`);
      if (!response.ok) {
        setPopupTitle('Download Failed');
        setPopupMessage('File not found or has been deleted');
        setPopupType('error');
        setShowPopup(true);
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setPopupTitle('Download Error');
      setPopupMessage('Failed to download file');
      setPopupType('error');
      setShowPopup(true);
    }
  };

  const fetchBookmarkedPosts = async () => {
    try {
      const response = await apiCall('/api/posts/bookmarks');
      if (response.ok) {
        const data = await response.json();
        setBookmarkedPosts(data);
      }
    } catch (error) {
      console.error('Failed to fetch bookmarked posts:', error);
    }
  };

  const getFilteredPosts = () => {
    let filteredPosts;
    if (postFilter === 'bookmarked') {
      filteredPosts = bookmarkedPosts;
    } else {
      filteredPosts = posts;
    }
    
    // Sort pinned posts to the top, then by creation date
    return filteredPosts.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  };

  const PostList = () => {
    const filteredPosts = getFilteredPosts();

    return (
      <div style={{ padding: '10px' }}>
        {/* Post Filter Tabs */}
        <div style={{
          background: '#ece9d8',
          border: '2px solid',
          borderColor: '#ffffff #c0c0c0 #c0c0c0 #ffffff',
          marginBottom: '15px',
          display: 'flex'
        }}>
          {[
            { key: 'official', label: 'Official' },
            { key: 'community', label: 'Community' },
            ...(user ? [{ key: 'bookmarked', label: `Bookmarks (${bookmarkedPosts.length})` }] : [])
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => {
                setPostFilter(tab.key);
                if (tab.key === 'bookmarked' && user) {
                  fetchBookmarkedPosts();
                } else if (tab.key !== 'bookmarked') {
                  fetchPosts(tab.key);
                }
              }}
              style={{
                flex: 1,
                padding: '8px',
                background: postFilter === tab.key ? '#d4d0c8' : 'transparent',
                border: 'none',
                borderRight: tab.key !== 'bookmarked' ? '1px solid #c0c0c0' : 'none',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <h2 style={{ margin: '0 0 15px 0', color: '#fff' }}>
          {postFilter === 'official' && 'Official Posts'}
          {postFilter === 'community' && 'Community Posts'}
          {postFilter === 'bookmarked' && 'Bookmarked Posts'}
        </h2>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
        ) : filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            {postFilter === 'bookmarked' ? 'No bookmarked posts yet' : 'No posts found'}
          </div>
        ) : (
          filteredPosts.map(post => (
            <div 
              key={post._id}
              onClick={() => setSelectedPost(post)}
              style={{
                background: '#ece9d8',
                border: '2px solid',
                borderColor: '#ffffff #c0c0c0 #c0c0c0 #ffffff',
                padding: '15px',
                marginBottom: '10px',
                boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
                borderRadius: '0'
              }}
            >
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#333', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {post.pinned && <span style={{ fontSize: '12px', color: '#e74c3c' }}>📌</span>}
                {post.title}
              </h3>
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                By {post.author.username} • {formatDate(post.createdAt)}
              </div>
              <div style={{ fontSize: '14px', color: '#555', marginBottom: '10px' }}>
                {stripMarkdown(post.content).substring(0, 150)}...
              </div>
              <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#888' }}>
                <span><Heart size={12} /> {post.likes?.length || 0}</span>
                <span><MessageCircle size={12} /> {post.comments?.length || 0}</span>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const PostView = React.memo(({ post }) => {
    React.useEffect(() => {
      if (post) {
        setLiked(post.likes?.includes(user?.id) || false);
        setLikeCount(post.likes?.length || 0);
        if (user && !bookmarked) {
          apiCall('/api/posts/bookmarks').then(response => {
            if (response.ok) {
              response.json().then(bookmarks => {
                setBookmarked(bookmarks.some(b => b._id === post._id));
              });
            }
          }).catch(() => {});
        }
      }
    }, [post._id, user?.id]);
    
    return (
      <div style={{ padding: '10px' }}>
        <button 
          onClick={() => setSelectedPost(null)}
          style={{
            background: '#ece9d8',
            color: 'black',
            border: '2px solid',
            borderColor: '#ffffff #404040 #404040 #ffffff',
            padding: '8px 15px',
            marginBottom: '15px',
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '11px'
          }}
        >
          ← Back
        </button>
        <div style={{ 
          background: '#ece9d8', 
          border: '2px solid',
          borderColor: '#ffffff #c0c0c0 #c0c0c0 #ffffff',
          padding: '15px',
          boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
          marginBottom: '15px'
        }}>
          <h2 style={{ margin: '0 0 10px 0', color: '#333' }}>{post.title}</h2>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
            By <span 
              style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}
              onClick={(e) => {
                e.stopPropagation();
                if (post.author._id) {
                  setSelectedPost(null);
                  setViewingProfile(null);
                  fetchUserProfile(post.author._id);
                  setCurrentView('userProfile');
                }
              }}
            >
              {post.author.username}
            </span> • {formatDate(post.createdAt)}
          </div>
          <div style={{ fontSize: '12px', lineHeight: '1.4', color: '#333', marginBottom: '15px' }}>
            {(() => {
              try {
                const content = post.content || '';
                if (typeof content !== 'string') {
                  console.log('Post content is not string:', typeof content, content);
                  return String(content);
                }
                // Full markdown processing
                let processed = content
                  // Code blocks first (before inline code)
                  .replace(/```([\s\S]*?)```/g, '<pre style="background:#f5f5f5;padding:8px;border-radius:4px;overflow-x:auto;border:1px solid #ddd;margin:6px 0;font-family:monospace;font-size:10px;white-space:pre-wrap;"><code>$1</code></pre>')
                  // Images
                  .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;margin:6px 0;border:1px solid #ddd;border-radius:4px;" />')
                  // Headers
                  .replace(/^## (.*$)/gm, '<h3 style="font-size:13px;font-weight:bold;margin:12px 0 6px 0;color:#333;">$1</h3>')
                  // Bold
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  // Italic
                  .replace(/\*(.*?)\*/g, '<em>$1</em>')
                  // Inline code
                  .replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:1px 4px;border-radius:2px;font-family:monospace;font-size:10px;color:#d63384;">$1</code>')
                  // Lists
                  .replace(/^- (.*$)/gm, '<div style="margin-left:15px;margin-bottom:3px;">• $1</div>')
                  // Line breaks
                  .replace(/\n/g, '<br>');
                
                return <div dangerouslySetInnerHTML={{__html: processed}} />;
              } catch (error) {
                console.error('Error rendering content:', error);
                return post.content || '';
              }
            })()} 
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                if (!user) {
                  setPopupTitle('Login Required');
                  setPopupMessage('Please create an account or login to like posts.');
                  setPopupType('info');
                  setShowPopup(true);
                  return;
                }
                handleLike(post._id);
              }}
              style={{
                background: liked ? '#ff4757' : '#ece9d8',
                border: '2px solid',
                borderColor: '#ffffff #404040 #404040 #ffffff',
                padding: '4px 8px',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: liked ? 'white' : '#333'
              }}
            >
              ❤️ {likeCount} Likes
            </button>
            <button
              style={{
                background: '#ece9d8',
                border: '2px solid',
                borderColor: '#ffffff #404040 #404040 #ffffff',
                padding: '4px 8px',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#333'
              }}
            >
              💬 {post.comments?.length || 0} Comments
            </button>
            <button
              onClick={async () => {
                try {
                  if (!user) {
                    setPopupTitle('Login Required');
                    setPopupMessage('Please create an account or login to bookmark posts.');
                    setPopupType('info');
                    setShowPopup(true);
                    return;
                  }
                  const response = await apiCall(`/api/posts/${post._id}/bookmark`, {
                    method: 'POST'
                  });
                  if (response.ok) {
                    const data = await response.json();
                    setBookmarked(data.bookmarked);
                  }
                } catch (error) {
                  console.error('Failed to bookmark:', error);
                }
              }}
              style={{
                background: bookmarked ? '#ffa502' : '#ece9d8',
                border: '2px solid',
                borderColor: '#ffffff #404040 #404040 #ffffff',
                padding: '4px 8px',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: bookmarked ? 'white' : '#333'
              }}
            >
              🔖 {bookmarked ? 'Bookmarked' : 'Bookmark'}
            </button>
            <button
              onClick={async () => {
                try {
                  const postUrl = `${window.location.origin}?post=${post._id}`;
                  
                  if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(postUrl);
                  } else {
                    // Fallback method
                    const textArea = document.createElement('textarea');
                    textArea.value = postUrl;
                    textArea.style.position = 'fixed';
                    textArea.style.left = '-999999px';
                    textArea.style.top = '-999999px';
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                  }
                  
                  setPopupTitle('Link Copied');
                  setPopupMessage('Post link copied to clipboard!');
                  setPopupType('success');
                  setShowPopup(true);
                } catch (error) {
                  console.error('Copy failed:', error);
                  setPopupTitle('Copy Failed');
                  setPopupMessage('Unable to copy link. Please try again.');
                  setPopupType('error');
                  setShowPopup(true);
                }
              }}
              style={{
                background: '#ece9d8',
                border: '2px solid',
                borderColor: '#ffffff #404040 #404040 #ffffff',
                padding: '4px 8px',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                color: '#333'
              }}
            >
              🔗 Share
            </button>
          </div>
        </div>

        {/* Research Files Section */}
        {post.attachments && post.attachments.length > 0 && (
          <div style={{
            background: '#f0f8ff',
            border: '2px solid',
            borderColor: '#ffffff #c0c0c0 #c0c0c0 #ffffff',
            padding: '12px',
            marginBottom: '15px',
            boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#0066cc' }}>
              📎 Research Files ({post.attachments.length})
            </div>
            <div style={{ display: 'grid', gap: '6px' }}>
              {post.attachments.map((attachment, index) => (
                <div 
                  key={index}
                  onClick={() => downloadFile(attachment.filename, attachment.originalName)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px',
                    background: 'white',
                    border: '1px solid #cce7ff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '10px'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>
                    {attachment.isImage ? '🖼️' : 
                     attachment.mimetype?.includes('pdf') ? '📕' :
                     attachment.mimetype?.includes('word') ? '📘' :
                     attachment.mimetype?.includes('zip') ? '📦' : '📄'}
                  </span>
                  <span style={{ flex: 1, fontWeight: 'bold' }}>{attachment.originalName}</span>
                  <span style={{ color: '#666' }}>{Math.round(attachment.size / 1024)}KB</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div style={{
          background: '#ece9d8',
          border: '2px solid',
          borderColor: '#ffffff #c0c0c0 #c0c0c0 #ffffff',
          padding: '15px',
          boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>Comments ({post.comments?.length || 0})</h3>
          
          {post.comments?.map((comment, index) => (
            <div key={index}>
              <div style={{
                background: '#f0f0f0',
                border: '1px solid #c0c0c0',
                padding: '10px',
                marginBottom: '10px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '5px' }}>
                  <span 
                    style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}
                    onClick={() => {
                      if (comment.author._id) {
                        setSelectedPost(null);
                        setViewingProfile(null);
                        fetchUserProfile(comment.author._id);
                        setCurrentView('userProfile');
                      }
                    }}
                  >
                    {comment.author.username}
                  </span>
                </div>
                <div style={{ fontSize: '10px', color: '#666', marginBottom: '8px' }}>
                  {formatDate(comment.createdAt)}
                </div>
                <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                  {comment.content || ''}
                </div>
                <button
                  onClick={() => setReplyingTo(replyingTo === comment._id ? null : comment._id)}
                  style={{
                    background: '#ece9d8',
                    border: '2px solid',
                    borderColor: '#ffffff #404040 #404040 #ffffff',
                    padding: '2px 6px',
                    fontFamily: 'Tahoma, sans-serif',
                    fontSize: '9px',
                    cursor: 'pointer',
                    color: '#333'
                  }}
                >
                  💬 Reply
                </button>
              </div>
              
              {/* Replies */}
              {comment.replies?.map((reply, replyIndex) => (
                <div key={replyIndex} style={{
                  background: '#e8e8e8',
                  border: '1px solid #c0c0c0',
                  padding: '8px',
                  marginLeft: '20px',
                  marginBottom: '8px'
                }}>
                  <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '3px' }}>
                    <span 
                      style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}
                      onClick={() => {
                        if (reply.author._id) {
                          setSelectedPost(null);
                          setViewingProfile(null);
                          fetchUserProfile(reply.author._id);
                          setCurrentView('userProfile');
                        }
                      }}
                    >
                      {reply.author.username}
                    </span>
                  </div>
                  <div style={{ fontSize: '9px', color: '#666', marginBottom: '5px' }}>
                    {formatDate(reply.createdAt)}
                  </div>
                  <div style={{ fontSize: '11px' }}>
                    {reply.content || ''}
                  </div>
                </div>
              ))}
              
              {/* Reply Form */}
              {replyingTo === comment._id && user && (
                <div style={{
                  marginLeft: '20px',
                  marginBottom: '10px',
                  padding: '8px',
                  background: '#f8f8f8',
                  border: '1px solid #ddd'
                }}>
                  <textarea
                    key={`reply-${comment._id}`}
                    value={replyTexts[comment._id] || ''}
                    onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment._id]: e.target.value }))}
                    placeholder="Write a reply..."
                    style={{
                      width: '100%',
                      height: '50px',
                      padding: '6px',
                      border: '1px inset #c0c0c0',
                      fontFamily: 'Tahoma, sans-serif',
                      fontSize: '16px',
                      resize: 'none'
                    }}
                  />
                  <div style={{ marginTop: '6px', display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleReply(post._id, comment._id, replyTexts[comment._id] || '')}
                      disabled={!(replyTexts[comment._id] || '').trim()}
                      style={{
                        padding: '4px 8px',
                        background: '#ece9d8',
                        border: '2px solid',
                        borderColor: '#ffffff #404040 #404040 #ffffff',
                        fontFamily: 'Tahoma, sans-serif',
                        fontSize: '9px',
                        cursor: (replyTexts[comment._id] || '').trim() ? 'pointer' : 'not-allowed'
                      }}
                    >
                      Reply
                    </button>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyTexts(prev => ({ ...prev, [comment._id]: '' }));
                      }}
                      style={{
                        padding: '4px 8px',
                        background: '#ece9d8',
                        border: '2px solid',
                        borderColor: '#ffffff #404040 #404040 #ffffff',
                        fontFamily: 'Tahoma, sans-serif',
                        fontSize: '9px'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div style={{ marginTop: '15px' }}>
            <textarea
              key="main-comment"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={user ? "Add a comment..." : "Login to comment..."}
              disabled={!user}
              style={{
                width: '100%',
                height: '60px',
                padding: '8px',
                border: '1px inset #c0c0c0',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: '16px',
                resize: 'none',
                opacity: user ? 1 : 0.6
              }}
            />
            <button
              onClick={() => {
                if (!user) {
                  setPopupTitle('Login Required');
                  setPopupMessage('Please create an account or login to comment on posts.');
                  setPopupType('info');
                  setShowPopup(true);
                  return;
                }
                handleComment(post._id, commentText);
              }}
              disabled={!commentText.trim() && user}
              style={{
                marginTop: '8px',
                padding: '6px 12px',
                background: '#ece9d8',
                border: '2px solid',
                borderColor: '#ffffff #404040 #404040 #ffffff',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: '11px',
                cursor: (commentText.trim() && user) || !user ? 'pointer' : 'not-allowed'
              }}
            >
              Post Comment
            </button>
          </div>
        </div>
      </div>
    );
  });

  const LoginView = () => {
    const [formData, setFormData] = useState({ email: '', password: '', username: '' });
    const [isLogin, setIsLogin] = useState(true);
    const [showPopup, setShowPopup] = useState(false);
    const [popupMessage, setPopupMessage] = useState('');
    const [popupType, setPopupType] = useState('error');
    const [popupTitle, setPopupTitle] = useState('');

    const showMessage = (message, type = 'error', title = '') => {
      setPopupMessage(message);
      setPopupType(type);
      setPopupTitle(title || (type === 'success' ? 'Success' : 'Error'));
      setShowPopup(true);
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const response = await apiCall(endpoint, {
          method: 'POST',
          body: JSON.stringify(formData)
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('token', data.token);
          setUser(data.user);
          showMessage(`Welcome, ${data.user.username}!`, 'success', 'Login Successful');
          setTimeout(() => {
            setShowPopup(false);
            setCurrentView('home');
          }, 2000);
        } else {
          const errorData = await response.json();
          showMessage(errorData.message || (isLogin ? 'Incorrect email or password' : 'Registration failed'), 'error', isLogin ? 'Login Failed' : 'Registration Failed');
        }
      } catch (error) {
        console.error('Auth failed:', error);
        showMessage('Network error. Please try again.');
      }
    };

    return (
      <div style={{ padding: '20px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#fff' }}>
          {isLogin ? 'Login' : 'Register'}
        </h2>
        <form onSubmit={handleSubmit} style={{ maxWidth: '300px', margin: '0 auto' }}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              style={{
                width: '100%',
                padding: '4px',
                marginBottom: '10px',
                border: '1px inset #c0c0c0',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: '16px'
              }}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            style={{
              width: '100%',
              padding: '4px',
              marginBottom: '10px',
              border: '1px inset #c0c0c0',
              fontFamily: 'Tahoma, sans-serif',
              fontSize: '11px'
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            style={{
              width: '100%',
              padding: '4px',
              marginBottom: '15px',
              border: '1px inset #c0c0c0',
              fontFamily: 'Tahoma, sans-serif',
              fontSize: '11px'
            }}
          />
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '8px',
              background: '#ece9d8',
              color: 'black',
              border: '2px solid',
              borderColor: '#ffffff #404040 #404040 #ffffff',
              marginBottom: '10px',
              fontFamily: 'Tahoma, sans-serif',
              fontSize: '11px',
              fontWeight: 'bold'
            }}
          >
            {isLogin ? 'Login' : 'Register'}
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{
              width: '100%',
              padding: '8px',
              background: '#ece9d8',
              color: 'black',
              border: '2px solid',
              borderColor: '#ffffff #404040 #404040 #ffffff',
              fontFamily: 'Tahoma, sans-serif',
              fontSize: '11px'
            }}
          >
            {isLogin ? 'Need an account?' : 'Have an account?'}
          </button>
        </form>
        
        {/* XP Popup */}
        {showPopup && (
          <XPPopup
            title={popupTitle}
            message={popupMessage}
            type={popupType}
            onClose={() => setShowPopup(false)}
          />
        )}
      </div>
    );
  };

  const searchUsers = React.useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const response = await apiCall(`/api/profile/search/${query}`);
      if (response.ok) {
        const users = await response.json();
        setSearchResults(users);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const SearchView = () => {

    return (
      <div style={{ padding: '10px' }}>
        <input
          type="text"
          placeholder="Search for users..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchUsers(e.target.value);
          }}
          style={{
            width: '100%',
            padding: '8px',
            marginBottom: '15px',
            border: '1px inset #c0c0c0',
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '16px'
          }}
          autoFocus
        />
        {searchLoading && <div style={{ textAlign: 'center', padding: '10px', color: '#fff' }}>Searching...</div>}
        
        <h2 style={{ margin: '0 0 15px 0', color: '#fff' }}>
          {searchQuery ? `Search Results (${searchResults.length})` : 'Search Users'}
        </h2>

        {searchQuery && searchResults.length === 0 && !searchLoading && (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            color: '#666',
            fontSize: '12px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>🔍</div>
            <div>No users found for "{searchQuery}"</div>
          </div>
        )}

        {searchResults.length > 0 && searchResults.map(user => (
          <div 
            key={user._id}
            onClick={() => {
              setViewingProfile(null);
              fetchUserProfile(user._id);
              setCurrentView('userProfile');
            }}
            style={{
              background: '#ece9d8',
              border: '2px solid',
              borderColor: '#ffffff #c0c0c0 #c0c0c0 #ffffff',
              padding: '15px',
              marginBottom: '10px',
              boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <div style={{ fontSize: '32px' }}>👤</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333', marginBottom: '4px' }}>
                {user.username}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                <span>{user.isAdmin ? 'Administrator' : 'Member'}</span>
                <span> • Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              View Profile →
            </div>
          </div>
        ))}

        {!searchQuery && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#666',
            fontSize: '12px'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
            <div style={{ marginBottom: '8px' }}>Start typing to search for users</div>
            <div>Find other members by their username</div>
          </div>
        )}
      </div>
    );
  };

  const ProfileView = () => {
    useEffect(() => {
      if (user && !userProfile) {
        fetchUserProfile();
      }
    }, [user, userProfile]);

    if (!userProfile) {
      return <div style={{ padding: '20px', textAlign: 'center' }}>Loading profile...</div>;
    }

    const { user: profileUser, posts: userPosts, stats } = userProfile;

    return (
      <div style={{ padding: '10px' }}>
        <div style={{
          background: '#ece9d8',
          border: '2px solid',
          borderColor: '#ffffff #c0c0c0 #c0c0c0 #ffffff',
          padding: '15px',
          marginBottom: '15px',
          boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ fontSize: '32px', marginRight: '15px' }}>👤</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '18px' }}>
                {profileUser.username}
              </h2>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '3px' }}>
                {profileUser.isAdmin ? 'Administrator' : 'Member'} • Rank: {profileUser.rank || 'Newbie'}
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                Joined {formatDate(profileUser.createdAt)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                {stats.totalKarma}
              </div>
              <div style={{ fontSize: '10px', color: '#666' }}>Total Karma</div>
            </div>
          </div>
          
          <button
            onClick={() => {
              localStorage.removeItem('token');
              setUser(null);
              setUserProfile(null);
              setCurrentView('home');
            }}
            style={{
              padding: '6px 12px',
              background: '#ece9d8',
              border: '2px solid',
              borderColor: '#ffffff #404040 #404040 #ffffff',
              fontFamily: 'Tahoma, sans-serif',
              fontSize: '11px'
            }}
          >
            Logout
          </button>
        </div>

        <div style={{
          background: '#ece9d8',
          border: '2px solid',
          borderColor: '#ffffff #c0c0c0 #c0c0c0 #ffffff',
          marginBottom: '15px',
          display: 'flex'
        }}>
          {['overview', 'posts', 'activity'].map(tab => (
            <button
              key={tab}
              onClick={() => setProfileTab(tab)}
              style={{
                flex: 1,
                padding: '8px',
                background: profileTab === tab ? '#d4d0c8' : 'transparent',
                border: 'none',
                borderRight: tab !== 'activity' ? '1px solid #c0c0c0' : 'none',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'posts' && ` (${stats.postsCreated})`}
            </button>
          ))}
        </div>

        <div style={{
          background: '#ece9d8',
          border: '2px solid',
          borderColor: '#ffffff #c0c0c0 #c0c0c0 #ffffff',
          padding: '15px',
          boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          {profileTab === 'overview' && (
            <div>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>Statistics</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ textAlign: 'center', padding: '10px', background: '#f0f0f0', border: '1px solid #c0c0c0' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{stats.postsCreated}</div>
                  <div style={{ fontSize: '10px' }}>Posts</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', background: '#f0f0f0', border: '1px solid #c0c0c0' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{stats.postLikes}</div>
                  <div style={{ fontSize: '10px' }}>Post Likes</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', background: '#f0f0f0', border: '1px solid #c0c0c0' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{stats.commentsCreated}</div>
                  <div style={{ fontSize: '10px' }}>Comments</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', background: '#f0f0f0', border: '1px solid #c0c0c0' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{stats.commentLikes}</div>
                  <div style={{ fontSize: '10px' }}>Comment Likes</div>
                </div>
              </div>
            </div>
          )}

          {profileTab === 'posts' && (
            <div>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>My Posts ({userPosts.length})</h3>
              {userPosts.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', fontSize: '12px' }}>No posts yet</div>
              ) : (
                userPosts.map(post => (
                  <div 
                    key={post._id}
                    onClick={() => setSelectedPost(post)}
                    style={{
                      background: '#f0f0f0',
                      border: '1px solid #c0c0c0',
                      padding: '10px',
                      marginBottom: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                      {post.title}
                    </div>
                    <div style={{ fontSize: '10px', color: '#666', marginBottom: '5px' }}>
                      {formatDate(post.createdAt)} • ❤️ {post.likes.length} • 💬 {post.comments.length}
                    </div>
                    <div style={{ fontSize: '11px', color: '#555' }}>
                      {post.content.substring(0, 100)}...
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {profileTab === 'activity' && (
            <div>
              <h3 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>Recent Activity</h3>
              <div style={{ fontSize: '11px' }}>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📝</span> Created {stats.postsCreated} posts
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>💬</span> Made {stats.commentsCreated} comments
                </div>
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>↩️</span> Posted {stats.repliesCreated || 0} replies
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⭐</span> Earned {stats.totalKarma} total karma
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const UserProfileView = () => {
    if (!viewingProfile) {
      return <div style={{ padding: '20px', textAlign: 'center' }}>Loading profile...</div>;
    }

    const { user: profileUser, posts: userPosts, stats } = viewingProfile;

    return (
      <div style={{ padding: '10px' }}>
        <button 
          onClick={() => setCurrentView('home')}
          style={{
            background: '#ece9d8',
            color: 'black',
            border: '2px solid',
            borderColor: '#ffffff #404040 #404040 #ffffff',
            padding: '8px 15px',
            marginBottom: '15px',
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '11px'
          }}
        >
          ← Back
        </button>
        
        <div style={{
          background: '#ece9d8',
          border: '2px solid',
          borderColor: '#ffffff #c0c0c0 #c0c0c0 #ffffff',
          padding: '15px',
          marginBottom: '15px',
          boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
            <div style={{ fontSize: '32px', marginRight: '15px' }}>👤</div>
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 5px 0', color: '#333', fontSize: '18px' }}>
                {profileUser.username}
              </h2>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '3px' }}>
                {profileUser.isAdmin ? 'Administrator' : 'Member'} • Rank: {profileUser.rank || 'Newbie'}
              </div>
              <div style={{ fontSize: '11px', color: '#666' }}>
                Joined {formatDate(profileUser.createdAt)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                {stats.totalKarma}
              </div>
              <div style={{ fontSize: '10px', color: '#666' }}>Total Karma</div>
            </div>
          </div>
        </div>

        {/* Friend/DM buttons when viewing another user's profile */}
        {user && profileUser && user.id !== profileUser._id && (
          <div style={{
            background: '#ece9d8',
            border: '2px solid',
            borderColor: '#ffffff #c0c0c0 #c0c0c0 #ffffff',
            padding: '15px',
            marginBottom: '15px',
            boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            gap: '10px'
          }}>
            <button
              onClick={() => {
                if (!user) {
                  setCurrentView('login');
                  return;
                }
                
                const friendship = friends.find(f => f._id === profileUser._id);
                
                if (friendship) {
                  // Remove friend
                  removeFriend(friendship.friendshipId);
                } else {
                  // Send friend request
                  sendFriendRequest(profileUser._id);
                }
              }}
              style={{
                flex: 1,
                background: '#ece9d8',
                border: '2px solid',
                borderColor: '#ffffff #404040 #404040 #ffffff',
                padding: '8px',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px'
              }}
            >
              👥 {friends.some(f => f._id === profileUser._id) ? 'Remove Friend' : 'Add Friend'}
            </button>
            

          </div>
        )}

        <div style={{
          background: '#ece9d8',
          border: '2px solid',
          borderColor: '#ffffff #c0c0c0 #c0c0c0 #ffffff',
          padding: '15px',
          boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          <h3 style={{ margin: '0 0 15px 0', fontSize: '14px' }}>Posts ({userPosts.length})</h3>
          {userPosts.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', fontSize: '12px' }}>No posts yet</div>
          ) : (
            userPosts.map(post => (
              <div 
                key={post._id}
                onClick={() => setSelectedPost(post)}
                style={{
                  background: '#f0f0f0',
                  border: '1px solid #c0c0c0',
                  padding: '10px',
                  marginBottom: '10px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {post.title}
                </div>
                <div style={{ fontSize: '10px', color: '#666', marginBottom: '5px' }}>
                  {formatDate(post.createdAt)} • ❤️ {post.likes.length} • 💬 {post.comments.length}
                </div>
                <div style={{ fontSize: '11px', color: '#555' }}>
                  {post.content.substring(0, 100)}...
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Other friend request handling functions

  const acceptFriendRequest = async (requestId) => {
    try {
      const response = await apiCall(`/api/friends/accept/${requestId}`, {
        method: 'POST'
      });
      if (response.ok) {
        fetchFriendRequests();
        fetchFriends();
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const declineFriendRequest = async (requestId) => {
    try {
      const response = await apiCall(`/api/friends/decline/${requestId}`, {
        method: 'POST'
      });
      if (response.ok) {
        fetchFriendRequests();
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const removeFriend = async (friendshipId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    try {
      const response = await apiCall(`/api/friends/${friendshipId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchFriends();
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  // Friends view component
  const FriendsView = () => {
    const [activeTab, setActiveTab] = useState('friends');
    
    useEffect(() => {
      // Only fetch data when component mounts if not already fetched
      if (!initialDataFetched) {
        fetchFriends();
        fetchFriendRequests();
      }
    }, [initialDataFetched]);

    return (
      <div style={{ padding: '10px' }}>
        <div style={{ display: 'flex', marginBottom: '15px' }}>
          <button
            onClick={() => setCurrentExtrasView('menu')}
            style={{
              background: '#ece9d8',
              color: 'black',
              border: '2px solid',
              borderColor: '#ffffff #404040 #404040 #ffffff',
              padding: '8px 15px',
              fontFamily: 'Tahoma, sans-serif',
              fontSize: '11px'
            }}
          >
            ← Back
          </button>
        </div>

        <h2 style={{ margin: '0 0 15px 0', color: '#fff' }}>Friends</h2>
        
        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          marginBottom: '15px',
          background: '#ece9d8',
          border: '2px solid',
          borderColor: '#ffffff #c0c0c0 #c0c0c0 #ffffff'
        }}>
          <button 
            onClick={() => setActiveTab('friends')}
            style={{ 
              flex: 1,
              padding: '8px',
              background: activeTab === 'friends' ? '#d4d0c8' : 'transparent',
              border: 'none',
              borderRight: '1px solid #c0c0c0',
              fontFamily: 'Tahoma, sans-serif',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Friends ({friends.length})
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            style={{ 
              flex: 1,
              padding: '8px',
              background: activeTab === 'requests' ? '#d4d0c8' : 'transparent',
              border: 'none',
              fontFamily: 'Tahoma, sans-serif',
              fontSize: '12px',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            Requests ({friendRequests.length})
            {friendRequests.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '2px',
                right: '4px',
                background: '#ff4757',
                color: 'white',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {friendRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Content */}
        <div style={{
          background: '#ece9d8',
          border: '2px solid',
          borderColor: '#ffffff #c0c0c0 #c0c0c0 #ffffff',
          padding: '15px',
          boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          {activeTab === 'friends' && (
            <div>
              {friends.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px', 
                  color: '#666',
                  fontSize: '12px'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
                  <div>No friends yet</div>
                  <div style={{ marginTop: '8px' }}>
                    Use the Search feature to find people and send friend requests!
                  </div>
                </div>
              ) : (
                friends.map(friend => (
                  <div key={friend._id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px',
                    border: '1px solid #ddd',
                    marginBottom: '8px',
                    background: 'white'
                  }}>
                    <div style={{ fontSize: '24px', marginRight: '10px' }}>👤</div>
                    <div style={{ flex: 1, fontSize: '14px' }}>
                      <div style={{ fontWeight: 'bold' }}>{friend.username}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <button 
                        onClick={() => {
                          setViewingProfile(null);
                          fetchUserProfile(friend._id);
                          setCurrentView('userProfile');
                          setCurrentExtrasView('menu');
                        }}
                        style={{
                          padding: '5px 10px',
                          background: '#ece9d8',
                          border: '2px solid',
                          borderColor: '#ffffff #404040 #404040 #ffffff',
                          fontFamily: 'Tahoma, sans-serif',
                          fontSize: '11px'
                        }}
                      >
                        View
                      </button>

                      <button 
                        onClick={() => removeFriend(friend.friendshipId)}
                        style={{
                          padding: '5px 10px',
                          background: '#ff6b6b',
                          color: 'white',
                          border: '2px solid',
                          borderColor: '#ff9a9a #cc5555 #cc5555 #ff9a9a',
                          fontFamily: 'Tahoma, sans-serif',
                          fontSize: '11px'
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              {friendRequests.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px', 
                  color: '#666',
                  fontSize: '12px'
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '12px' }}>📨</div>
                  <div>No pending friend requests</div>
                </div>
              ) : (
                friendRequests.map(request => (
                  <div key={request._id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '10px',
                    border: '1px solid #ddd',
                    marginBottom: '8px',
                    background: '#f8f9fa'
                  }}>
                    <div style={{ fontSize: '24px', marginRight: '10px' }}>👤</div>
                    <div style={{ flex: 1, fontSize: '14px' }}>
                      <div style={{ fontWeight: 'bold' }}>{request.requester.username}</div>
                      <div style={{ color: '#666', fontSize: '12px' }}>
                        Sent {formatDate(request.createdAt)}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <button 
                        onClick={() => {
                          setViewingProfile(null);
                          fetchUserProfile(request.requester._id);
                          setCurrentView('userProfile');
                          setCurrentExtrasView('menu');
                        }}
                        style={{
                          padding: '5px 10px',
                          background: '#ece9d8',
                          border: '2px solid',
                          borderColor: '#ffffff #404040 #404040 #ffffff',
                          fontFamily: 'Tahoma, sans-serif',
                          fontSize: '11px'
                        }}
                      >
                        View
                      </button>
                      <button 
                        onClick={() => acceptFriendRequest(request._id)}
                        style={{
                          padding: '5px 10px',
                          background: '#28a745',
                          color: 'white',
                          border: '2px solid',
                          borderColor: '#34ce57 #1e7e34 #1e7e34 #34ce57',
                          fontFamily: 'Tahoma, sans-serif',
                          fontSize: '11px'
                        }}
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => declineFriendRequest(request._id)}
                        style={{
                          padding: '5px 10px',
                          background: '#ff6b6b',
                          color: 'white',
                          border: '2px solid',
                          borderColor: '#ff9a9a #cc5555 #cc5555 #ff9a9a',
                          fontFamily: 'Tahoma, sans-serif',
                          fontSize: '11px'
                        }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const InfoView = () => {
    return (
      <div style={{ padding: '10px' }}>
        <div style={{ display: 'flex', marginBottom: '15px' }}>
          <button
            onClick={() => setCurrentExtrasView('menu')}
            style={{
              background: '#ece9d8',
              color: 'black',
              border: '2px solid',
              borderColor: '#ffffff #404040 #404040 #ffffff',
              padding: '8px 15px',
              fontFamily: 'Tahoma, sans-serif',
              fontSize: '11px'
            }}
          >
            ← Back
          </button>
        </div>

        <h2 style={{ margin: '0 0 15px 0', color: '#fff' }}>About XPloitHUB Mobile</h2>
        
        <div style={{
          background: '#ece9d8',
          border: '2px solid',
          borderColor: '#ffffff #c0c0c0 #c0c0c0 #ffffff',
          padding: '20px',
          boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
          lineHeight: '1.6'
        }}>
          <div style={{ fontSize: '14px', marginBottom: '15px', textAlign: 'center' }}>
            <strong>🚧 BETA VERSION 🚧</strong>
          </div>
          
          <div style={{ fontSize: '12px', marginBottom: '15px' }}>
            Welcome to XPloitHUB Mobile! You're experiencing our cutting-edge mobile interface that brings the power of our cybersecurity community to your fingertips.
          </div>
          
          <div style={{ fontSize: '12px', marginBottom: '15px' }}>
            <strong>⚠️ Beta Notice:</strong> This mobile version is currently in beta testing. You may encounter bugs, missing features, or performance issues as we continue to refine the experience.
          </div>
          
          <div style={{ fontSize: '12px', marginBottom: '15px' }}>
            <strong>🖥️ Desktop Experience:</strong> For the complete XPloitHUB experience with all features, advanced tools, and our signature Windows XP interface, we highly recommend using our desktop version. It offers:
          </div>
          
          <ul style={{ fontSize: '11px', marginBottom: '15px', paddingLeft: '20px' }}>
            <li>Full windowed interface with drag & drop functionality</li>
            <li>Advanced post creation with rich text editing</li>
            <li>Complete file upload and attachment system</li>
            <li>Enhanced search and filtering capabilities</li>
            <li>Real-time notifications and messaging</li>
            <li>Immersive retro computing experience</li>
          </ul>
          
          <div style={{ fontSize: '12px', marginBottom: '15px' }}>
            <strong>🎯 Our Vision:</strong> XPloitHUB represents the perfect fusion of nostalgic computing aesthetics with modern cybersecurity discourse. Our desktop platform delivers an unparalleled experience that mobile simply cannot match.
          </div>
          
          <div style={{ fontSize: '11px', color: '#666', textAlign: 'center', marginTop: '20px' }}>
            Thank you for being part of our beta testing community!
          </div>
        </div>
      </div>
    );
  };

  const ExtrasView = () => {
    if (currentExtrasView === 'friends') {
      return <FriendsView />;
    }
    
    if (currentExtrasView === 'info') {
      return <InfoView />;
    }
    
    return (
      <div style={{ padding: '10px' }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#fff' }}>Extras</h2>
        
        <div style={{
          background: '#ece9d8',
          border: '2px solid',
          borderColor: '#ffffff #c0c0c0 #c0c0c0 #ffffff',
          padding: '15px',
          marginBottom: '15px',
          boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ display: 'grid', gap: '10px' }}>
            <button
              onClick={() => {
                if (!user) {
                  setCurrentView('login');
                  return;
                }
                setCurrentExtrasView('friends');
              }}
              style={{
                background: '#ece9d8',
                border: '2px solid',
                borderColor: '#ffffff #404040 #404040 #ffffff',
                padding: '12px',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              👥 Friends {friendRequests.length > 0 && `(${friendRequests.length})`}
            </button>
            
            <button
              onClick={() => setCurrentExtrasView('info')}
              style={{
                background: '#ece9d8',
                border: '2px solid',
                borderColor: '#ffffff #404040 #404040 #ffffff',
                padding: '12px',
                fontFamily: 'Tahoma, sans-serif',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ℹ️ Info
            </button>
          </div>
        </div>
      </div>
    );
  };





  const renderContent = () => {
    if (selectedPost) return <PostView post={selectedPost} />;
    if (currentView === 'login') return <LoginView />;
    if (currentView === 'search') return <SearchView />;
    if (currentView === 'profile') return <ProfileView />;
    if (currentView === 'userProfile') return <UserProfileView />;
    if (currentView === 'extras') return <ExtrasView />;
    return <PostList />;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      fontFamily: 'Tahoma, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(to bottom, #0054e3, #4d8cff)',
        color: 'white',
        padding: '15px',
        textAlign: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        border: '2px solid',
        borderColor: '#ffffff #404040 #404040 #ffffff',
        boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
      }}>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>XPloitHUB Mobile BETA</h1>
      </div>

      <div style={{ paddingBottom: '70px' }}>
        {renderContent()}
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'linear-gradient(to bottom, #0054e3, #4d8cff)',
        border: '2px solid',
        borderColor: '#ffffff #404040 #404040 #ffffff',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '10px 0'
      }}>
        <button
          onClick={() => { setCurrentView('home'); setSelectedPost(null); setViewingProfile(null); }}
          style={{
            background: currentView === 'home' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'white',
            padding: '5px',
            fontFamily: 'Tahoma, sans-serif'
          }}
        >
          <Home size={20} />
          <span style={{ fontSize: '10px', marginTop: '2px' }}>Home</span>
        </button>
        
        <button
          onClick={() => { setCurrentView('search'); setSelectedPost(null); setViewingProfile(null); }}
          style={{
            background: currentView === 'search' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'white',
            padding: '5px',
            fontFamily: 'Tahoma, sans-serif'
          }}
        >
          <Search size={20} />
          <span style={{ fontSize: '10px', marginTop: '2px' }}>Users</span>
        </button>

        <button
          onClick={() => { setCurrentView('extras'); setSelectedPost(null); setViewingProfile(null); }}
          style={{
            background: currentView === 'extras' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'white',
            padding: '5px',
            fontFamily: 'Tahoma, sans-serif'
          }}
        >
          <Plus size={20} />
          <span style={{ fontSize: '10px', marginTop: '2px' }}>Extras</span>
        </button>

        {user ? (
          <button
            onClick={() => { setCurrentView('profile'); setSelectedPost(null); setViewingProfile(null); }}
            style={{
              background: currentView === 'profile' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'white',
              padding: '5px',
              fontFamily: 'Tahoma, sans-serif'
            }}
          >
            <User size={20} />
            <span style={{ fontSize: '10px', marginTop: '2px' }}>Profile</span>
          </button>
        ) : (
          <button
            onClick={() => { setCurrentView('login'); setSelectedPost(null); setViewingProfile(null); }}
            style={{
              background: currentView === 'login' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: 'white',
              padding: '5px',
              fontFamily: 'Tahoma, sans-serif'
            }}
          >
            <User size={20} />
            <span style={{ fontSize: '10px', marginTop: '2px' }}>Login</span>
          </button>
        )}
      </div>
      
      {/* XP Popup */}
      {showPopup && (
        <XPPopup
          title={popupTitle}
          message={popupMessage}
          type={popupType}
          onClose={() => setShowPopup(false)}
        />
      )}
    </div>
  );
  } catch (error) {
    console.error('MobileApp Error:', error);
    return (
      <div style={{
        minHeight: '100vh',
        background: 'red',
        color: 'white',
        padding: '20px',
        fontFamily: 'monospace'
      }}>
        <h1>Mobile App Error</h1>
        <p>{error.toString()}</p>
        <pre>{error.stack}</pre>
      </div>
    );
  }
};

export default MobileApp;