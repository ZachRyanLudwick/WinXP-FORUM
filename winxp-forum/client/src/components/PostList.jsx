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
      setPosts(data.posts || []);
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
          key={post.id} 
          className="post-item"
          onClick={() => onOpenPost(post)}
        >
          <div className="post-icon">📄</div>
          <div className="post-info">
            <div className="post-title">{post.title}</div>
            <div className="post-meta">
              by {post.author} • {new Date(post.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PostList;