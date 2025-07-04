import React, { useState, useEffect } from 'react';

const PostList = ({ onOpenPost, refreshTrigger }) => {
  const [posts, setPosts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
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
      const response = await fetch('http://localhost:5001/api/posts');
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      setPosts(data || []);
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

  if (posts.length === 0) {
    return <div>No posts yet. Be the first to create one!</div>;
  }

  const currentPosts = activeTab === 'bookmarks' ? bookmarks : posts;

  return (
    <div>
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #ccc', 
        marginBottom: '8px' 
      }}>
        <button 
          className={`button ${activeTab === 'all' ? 'primary' : ''}`}
          onClick={() => setActiveTab('all')}
          style={{ borderRadius: 0, marginRight: '2px' }}
        >
          📝 All Posts ({posts.length})
        </button>
        <button 
          className={`button ${activeTab === 'bookmarks' ? 'primary' : ''}`}
          onClick={() => setActiveTab('bookmarks')}
          style={{ borderRadius: 0 }}
        >
          🔖 Bookmarks ({bookmarks.length})
        </button>
      </div>
      <div className="post-list">
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