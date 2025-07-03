import React, { useState, useEffect } from 'react';

const AdminPanel = () => {
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [postsRes, usersRes] = await Promise.all([
        fetch('http://localhost:5001/api/posts', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5001/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ json: () => [] }))
      ]);
      
      const postsData = await postsRes.json();
      setPosts(postsData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setLoading(false);
    }
  };

  const deletePost = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5001/api/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(posts.filter(p => p._id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  if (loading) return <div className="loading">Loading admin panel...</div>;

  return (
    <div className="admin-panel">
      <h3>🛠️ Admin Panel</h3>
      
      <div className="admin-section">
        <h4>📝 Manage Posts ({posts.length})</h4>
        <div className="admin-posts">
          {posts.map(post => (
            <div key={post._id} className="admin-post-item">
              <div className="admin-post-info">
                <strong>{post.title}</strong>
                <div className="admin-post-meta">
                  by {post.author?.username} • {new Date(post.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button 
                className="button admin-delete-btn"
                onClick={() => deletePost(post._id)}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;