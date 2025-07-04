import React, { useState, useEffect } from 'react';

const PostList = ({ onOpenPost, refreshTrigger }) => {
  const [officialPosts, setOfficialPosts] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [activeTab, setActiveTab] = useState('official');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    fetchPosts();
    fetchBookmarks();
    const interval = setInterval(() => {
      fetchPosts();
      if (activeTab === 'bookmarks') fetchBookmarks();
    }, 3000);
    return () => clearInterval(interval);
  }, [activeTab, refreshTrigger]);

  const fetchBookmarks = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch('http://localhost:5001/api/posts/bookmarks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setBookmarks(data);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const fetchPosts = async () => {
    try {
      const [officialRes, communityRes] = await Promise.all([
        fetch('http://localhost:5001/api/posts'),
        fetch('http://localhost:5001/api/posts/community')
      ]);
      
      if (officialRes.ok) {
        const officialData = await officialRes.json();
        setOfficialPosts(officialData || []);
      }
      
      if (communityRes.ok) {
        const communityData = await communityRes.json();
        setCommunityPosts(communityData || []);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return <div className="loading">Loading posts...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const currentPosts = activeTab === 'official' ? officialPosts : 
                      activeTab === 'community' ? communityPosts : bookmarks;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #ccc', 
        margin: '8px 8px 0 8px' 
      }}>
        <button 
          className={`button ${activeTab === 'official' ? 'primary' : ''}`}
          onClick={() => setActiveTab('official')}
          style={{ borderRadius: 0, marginRight: '2px' }}
        >
          🏛️ Official Posts ({officialPosts.length})
        </button>
        <button 
          className={`button ${activeTab === 'community' ? 'primary' : ''}`}
          onClick={() => setActiveTab('community')}
          style={{ borderRadius: 0, marginRight: '2px' }}
        >
          👥 Community Posts ({communityPosts.length})
        </button>
        <button 
          className={`button ${activeTab === 'bookmarks' ? 'primary' : ''}`}
          onClick={() => setActiveTab('bookmarks')}
          style={{ borderRadius: 0 }}
        >
          🔖 Bookmarks ({bookmarks.length})
        </button>
      </div>
      <div className="post-list" style={{ flex: 1, overflow: 'auto', margin: '0 8px 8px 8px' }}>
        {currentPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
            {activeTab === 'bookmarks' ? 'No bookmarked posts yet.' : 'No posts yet. Be the first to create one!'}
          </div>
        ) : (
          currentPosts.map(post => (
        <div 
          key={post._id} 
          className="post-item"
          onDoubleClick={() => onOpenPost(post)}
        >
          <div className="post-icon">
            {post.category === 'vulnerability' ? '🚨' :
             post.category === 'malware' ? '🦠' :
             post.category === 'network' ? '🌐' :
             post.category === 'forensics' ? '🔬' :
             post.category === 'tools' ? '🛠️' :
             post.category === 'tutorial' ? '📚' : '🔍'}
          </div>
          <div className="post-info">
            <div className="post-title">{post.title}</div>
            <div className="post-meta">
              {post.category?.toUpperCase()} • by {post.author?.username || 'Unknown'} • {new Date(post.createdAt).toLocaleDateString()}
            </div>
            <div style={{ 
              fontSize: '9px', 
              color: '#666', 
              marginTop: '4px',
              display: 'flex',
              gap: '12px',
              alignItems: 'center'
            }}>
              <span>❤️ {post.likes?.length || 0}</span>
              <span>💬 {post.comments?.length || 0}</span>
              {post.attachments?.length > 0 && (
                <span>📎 {post.attachments.length}</span>
              )}
            </div>
            {post.tags && post.tags.length > 0 && (
              <div style={{ fontSize: '9px', color: '#888', marginTop: '2px' }}>
                {post.tags.slice(0, 3).join(', ')}{post.tags.length > 3 ? '...' : ''}
              </div>
            )}
          </div>
          </div>
        ))
        )}
      </div>
    </div>
  );
};

export default PostList;