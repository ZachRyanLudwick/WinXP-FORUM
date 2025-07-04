import React, { useState } from 'react';

const CommentItem = ({ comment, postId, onUpdate }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return comment.likes?.includes(payload.userId) || false;
    } catch { return false; }
  });

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Please login to like comments');
      
      await fetch(`http://localhost:5001/api/posts/${postId}/comments/${comment._id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setLiked(!liked);
      onUpdate();
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) return alert('Please login to reply');
      
      await fetch(`http://localhost:5001/api/posts/${postId}/comments/${comment._id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: replyText })
      });
      
      setReplyText('');
      setShowReplyForm(false);
      onUpdate();
    } catch (error) {
      console.error('Error replying:', error);
    }
  };

  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee', background: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
        <div style={{ 
          width: '24px', height: '24px', borderRadius: '50%', background: '#007bff', 
          color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontSize: '10px', fontWeight: 'bold' 
        }}>
          {comment.author?.username?.charAt(0).toUpperCase()}
        </div>
        <div style={{ fontSize: '11px', fontWeight: 'bold' }}>{comment.author?.username}</div>
        <div style={{ fontSize: '9px', color: '#666' }}>
          {new Date(comment.createdAt).toLocaleDateString()}
        </div>
      </div>
      <div style={{ fontSize: '11px', lineHeight: '1.4', marginLeft: '32px' }}>
        {comment.content}
      </div>
      <div style={{ marginTop: '6px', marginLeft: '32px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button 
          onClick={handleLike}
          style={{ 
            background: 'none', border: 'none', fontSize: '9px', 
            color: liked ? '#ff4757' : '#666', cursor: 'pointer' 
          }}
        >
          👍 {comment.likes?.length || 0}
        </button>
        <button 
          onClick={() => setShowReplyForm(!showReplyForm)}
          style={{ background: 'none', border: 'none', fontSize: '9px', color: '#666', cursor: 'pointer' }}
        >
          💬 Reply
        </button>
      </div>
      
      {showReplyForm && (
        <div style={{ marginLeft: '32px', marginTop: '8px' }}>
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            style={{ width: '100%', padding: '4px', fontSize: '10px', border: '1px solid #ddd' }}
          />
          <div style={{ marginTop: '4px', display: 'flex', gap: '4px' }}>
            <button className="button primary" onClick={handleReply} style={{ fontSize: '9px' }}>Reply</button>
            <button className="button" onClick={() => setShowReplyForm(false)} style={{ fontSize: '9px' }}>Cancel</button>
          </div>
        </div>
      )}
      
      {comment.replies?.map((reply, idx) => {
        const handleReplyLike = async () => {
          try {
            const token = localStorage.getItem('token');
            if (!token) return alert('Please login to like replies');
            
            await fetch(`http://localhost:5001/api/posts/${postId}/comments/${comment._id}/replies/${reply._id}/like`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` }
            });
            
            onUpdate();
          } catch (error) {
            console.error('Error liking reply:', error);
          }
        };
        
        const isLiked = (() => {
          const token = localStorage.getItem('token');
          if (!token) return false;
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return reply.likes?.includes(payload.userId) || false;
          } catch { return false; }
        })();
        
        return (
          <div key={idx} style={{ marginLeft: '32px', marginTop: '8px', padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <div style={{ 
                width: '20px', height: '20px', borderRadius: '50%', background: '#28a745', 
                color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                fontSize: '8px', fontWeight: 'bold' 
              }}>
                {reply.author?.username?.charAt(0).toUpperCase()}
              </div>
              <div style={{ fontSize: '10px', fontWeight: 'bold' }}>{reply.author?.username}</div>
              <div style={{ fontSize: '8px', color: '#666' }}>
                {new Date(reply.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div style={{ fontSize: '10px', marginLeft: '26px', marginBottom: '4px' }}>{reply.content}</div>
            <div style={{ marginLeft: '26px' }}>
              <button 
                onClick={handleReplyLike}
                style={{ 
                  background: 'none', border: 'none', fontSize: '8px', 
                  color: isLiked ? '#ff4757' : '#666', cursor: 'pointer' 
                }}
              >
                👍 {reply.likes?.length || 0}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Simple markdown-style renderer
const renderContent = (content, onFileClick) => {
  if (!content) return '';
  
  let rendered = content
    // Code blocks first (before inline code)
    .replace(/```([\s\S]*?)```/g, '<pre style="background:#f5f5f5;padding:12px;border-radius:4px;overflow-x:auto;border:1px solid #ddd;margin:8px 0;font-family:Consolas,Monaco,monospace;font-size:11px;white-space:pre-wrap;"><code>$1</code></pre>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;height:auto;margin:8px 0;border:1px solid #ddd;border-radius:4px;cursor:pointer;" onclick="window.open(\'$2\', \'_blank\')" />')
    // File links - render as download boxes
    .replace(/\[📎 ([^\]]+)\]\(([^)]+)\)/g, '<div class="file-download-box" data-url="$2" data-name="$1" style="display:block;background:#f8f9fa;border:2px solid #dee2e6;border-radius:8px;padding:12px;margin:12px 0;cursor:pointer;transition:all 0.2s;box-shadow:0 2px 4px rgba(0,0,0,0.1);" onmouseover="this.style.background=\'#e9ecef\';this.style.borderColor=\'#adb5bd\'" onmouseout="this.style.background=\'#f8f9fa\';this.style.borderColor=\'#dee2e6\';"><div style="display:flex;align-items:center;gap:12px;"><div style="font-size:32px;color:#6c757d;">📄</div><div style="flex:1;"><div style="font-weight:bold;font-size:12px;color:#495057;margin-bottom:4px;">$1</div><div style="font-size:10px;color:#6c757d;">Click to download file</div></div><div style="background:#007bff;color:white;padding:6px 12px;border-radius:4px;font-size:10px;font-weight:bold;">💾 Download</div></div></div>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:2px 6px;border-radius:3px;font-family:Consolas,Monaco,monospace;font-size:11px;color:#d63384;">$1</code>')
    // Headers
    .replace(/^## (.*$)/gm, '<h3 style="font-size:14px;font-weight:bold;margin:16px 0 8px 0;color:#333;">$1</h3>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:bold;">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em style="font-style:italic;">$1</em>')
    // Lists
    .replace(/^- (.*$)/gm, '<div style="margin-left:20px;margin-bottom:4px;">• $1</div>')
    // Line breaks
    .replace(/\n/g, '<br>');
    
  return rendered;
};

const FileViewer = ({ filename, originalName, onClose }) => {
  const downloadFile = () => {
    const link = document.createElement('a');
    link.href = `http://localhost:5001/uploads/${filensame}`;
    link.download = originalName;
    link.click();
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
      <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>{originalName}</h3>
      <p style={{ fontSize: '11px', color: '#666', marginBottom: '16px' }}>Click download to save this file</p>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button className="button primary" onClick={downloadFile}>
          💾 Download
        </button>
        <button className="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

const PostViewer = ({ post, onOpenFile, onBookmarkChange, bookmarkRefresh }) => {
  const [liked, setLiked] = useState(() => {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.userId;
      return post?.likes?.includes(userId) || false;
    } catch {
      return false;
    }
  });
  const [likeCount, setLikeCount] = useState(post?.likes?.length || 0);
  const [comments, setComments] = useState(post?.comments || []);
  const [newComment, setNewComment] = useState('');
  const [bookmarked, setBookmarked] = useState(false);

  const checkBookmarkStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch('http://localhost:5001/api/posts/bookmarks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const bookmarks = await response.json();
        setBookmarked(bookmarks.some(b => b._id === post._id));
      }
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  React.useEffect(() => {
    checkBookmarkStatus();
  }, [post._id, bookmarkRefresh]);

  const fetchPostData = async () => {
    try {
      const response = await fetch(`http://localhost:5001/api/posts/${post._id}`);
      if (response.ok) {
        const updatedPost = await response.json();
        setComments(updatedPost.comments);
        setLikeCount(updatedPost.likes.length);
      }
    } catch (error) {
      console.error('Error fetching post data:', error);
    }
  };

  React.useEffect(() => {
    const interval = setInterval(fetchPostData, 3000);
    return () => clearInterval(interval);
  }, [post._id]);

  if (!post) {
    return <div className="error">Post not found</div>;
  }

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to like posts');
        return;
      }
      
      const response = await fetch(`http://localhost:5001/api/posts/${post._id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setLiked(!liked);
        setLikeCount(prev => liked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to comment');
        return;
      }
      
      const response = await fetch(`http://localhost:5001/api/posts/${post._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });
      
      if (response.ok) {
        const updatedPost = await response.json();
        setComments(updatedPost.comments);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      general: '🔍',
      vulnerability: '🚨',
      malware: '🦠',
      network: '🌐',
      forensics: '🔬',
      tools: '🛠️',
      tutorial: '📚'
    };
    return icons[category] || '🔍';
  };

  return (
    <div className="post-viewer" style={{ height: '100%', overflow: 'auto' }}>
      <div style={{ padding: '12px', borderBottom: '1px solid #ccc', background: '#f5f5f5' }}>
        <h2 style={{ fontSize: '16px', marginBottom: '8px', fontWeight: 'bold' }}>{post.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: '#666' }}>
          <span>{getCategoryIcon(post.category)} {post.category?.toUpperCase()}</span>
          <span>By {post.author?.username || 'Unknown'}</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
        {post.tags && post.tags.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            {post.tags.map((tag, index) => (
              <span 
                key={index} 
                style={{ 
                  background: '#e1f5fe', 
                  color: '#0277bd', 
                  padding: '2px 6px', 
                  borderRadius: '3px', 
                  fontSize: '10px', 
                  marginRight: '4px',
                  border: '1px solid #b3e5fc'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
      <div 
        className="post-content" 
        style={{ 
          padding: '16px', 
          fontSize: '12px', 
          lineHeight: '1.6',
          minHeight: '200px'
        }}
        dangerouslySetInnerHTML={{ __html: renderContent(post.content) }}
        onClick={(e) => {
          // Handle file download boxes
          const fileBox = e.target.closest('.file-download-box');
          if (fileBox) {
            const url = fileBox.getAttribute('data-url');
            const name = fileBox.getAttribute('data-name');
            const filename = url.split('/').pop();
            onOpenFile && onOpenFile({ filename, originalName: name });
          }
        }}
      />

            {/* Research Files Section - Above Content */}
      {post.attachments && post.attachments.length > 0 && (
        <div style={{ 
          borderBottom: '1px solid #ddd', 
          padding: '12px 16px', 
          background: '#f0f8ff' 
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', color: '#0066cc' }}>
            📎 Research Files ({post.attachments.length})
          </div>
          <div style={{ display: 'grid', gap: '6px' }}>
            {post.attachments.map((attachment, index) => (
              <div 
                key={index}
                onClick={() => onOpenFile && onOpenFile(attachment)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
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
      
      {/* Engagement Section */}
      <div style={{ 
        borderTop: '1px solid #ddd', 
        padding: '12px 16px', 
        background: '#f8f9fa',
        display: 'flex',
        gap: '16px',
        alignItems: 'center'
      }}>
        <button 
          className="button"
          onClick={handleLike}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            background: liked ? '#ff4757' : 'transparent',
            color: liked ? 'white' : '#666',
            border: liked ? '1px solid #ff4757' : '1px solid #ddd'
          }}
        >
          ❤️ {likeCount} Likes
        </button>
        <button 
          className="button"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px'
          }}
        >
          💬 {comments.length} Comments
        </button>
        <button 
          className="button"
          onClick={async () => {
            try {
              const token = localStorage.getItem('token');
              if (!token) {
                alert('Please login to bookmark posts');
                return;
              }
              const response = await fetch(`http://localhost:5001/api/posts/${post._id}/bookmark`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
              });
              if (response.ok) {
                const data = await response.json();
                setBookmarked(data.bookmarked);
                onBookmarkChange && onBookmarkChange();
              }
            } catch (error) {
              console.error('Error bookmarking post:', error);
            }
          }}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '4px',
            background: bookmarked ? '#ffa502' : 'transparent',
            color: bookmarked ? 'white' : '#666',
            border: bookmarked ? '1px solid #ffa502' : '1px solid #ddd'
          }}
        >
          🔖 {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </button>
      </div>

      {/* Comments Section */}
      <div style={{ 
        borderTop: '1px solid #ddd'
      }}>
        <div style={{ padding: '12px 16px', background: '#f0f0f0', fontSize: '11px', fontWeight: 'bold' }}>
          💬 Discussion ({comments.length})
        </div>
        
        {/* Add Comment */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #eee' }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts on this research..."
            style={{
              width: '100%',
              height: '60px',
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '11px',
              resize: 'none',
              fontFamily: 'inherit'
            }}
          />
          <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
            <button 
              className="button primary" 
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              style={{ fontSize: '10px' }}
            >
              💬 Post Comment
            </button>
            <button 
              className="button" 
              onClick={() => setNewComment('')}
              style={{ fontSize: '10px' }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Comments List */}
        {comments && comments.map((comment, index) => (
          <CommentItem 
            key={comment._id || index}
            comment={comment}
            postId={post._id}
            onUpdate={fetchPostData}
          />
        ))}
        
        {(!comments || comments.length === 0) && (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: '#666', 
            fontSize: '11px' 
          }}>
            No comments yet. Be the first to discuss this research!
          </div>
        )}
      </div>
    </div>
  );
};

export default PostViewer;