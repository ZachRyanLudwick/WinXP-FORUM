import React, { useState, useEffect } from 'react';

const PostList = ({ onOpenPost }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPosts();
  }, []);

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

  return (
    <div className="post-list">
      {posts.map(post => (
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
      ))}
    </div>
  );
};

export default PostList;