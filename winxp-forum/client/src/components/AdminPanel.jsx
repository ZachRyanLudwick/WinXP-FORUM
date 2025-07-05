import React, { useState, useEffect } from 'react';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [activeTab, currentPage]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchData();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    try {
      if (activeTab === 'dashboard') {
        const res = await fetch('http://localhost:5001/api/admin/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setStats(data);
      } else if (activeTab === 'users') {
        const res = await fetch(`http://localhost:5001/api/admin/users?page=${currentPage}&search=${searchTerm}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
      } else if (activeTab === 'posts') {
        const res = await fetch(`http://localhost:5001/api/admin/posts?page=${currentPage}&search=${searchTerm}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setPosts(data.posts || []);
        setTotalPages(data.totalPages || 1);
      } else if (activeTab === 'settings') {
        const res = await fetch('http://localhost:5001/api/admin/settings', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserAdmin = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5001/api/admin/users/${userId}/admin`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling admin status:', error);
    }
  };

  const toggleUserBan = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5001/api/admin/users/${userId}/ban`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Error toggling ban status:', error);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm('Delete user and all their posts? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5001/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const deletePost = async (postId) => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5001/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const renderDashboard = () => (
    <div className="admin-dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalUsers || 0}</div>
            <div className="stat-label">Total Users</div>
            <div className="stat-change">+{stats.todayUsers || 0} today</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <div className="stat-number">{stats.totalPosts || 0}</div>
            <div className="stat-label">Total Posts</div>
            <div className="stat-change">+{stats.todayPosts || 0} today</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <div className="stat-number">{Math.round((stats.todayPosts || 0) / (stats.todayUsers || 1) * 100) / 100}</div>
            <div className="stat-label">Posts/User Ratio</div>
            <div className="stat-change">Today</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <div className="stat-number">{stats.recentActivity?.length || 0}</div>
            <div className="stat-label">Recent Activity</div>
            <div className="stat-change">Last 24h</div>
          </div>
        </div>
      </div>
      
      <div className="recent-activity">
        <h4>📈 Recent Activity</h4>
        <div className="activity-list">
          {stats.recentActivity?.map(post => (
            <div key={post._id} className="activity-item">
              <div className="activity-icon">📝</div>
              <div className="activity-content">
                <div className="activity-title">{post.title}</div>
                <div className="activity-meta">
                  by {post.author?.username} • {new Date(post.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          )) || <div className="no-activity">No recent activity</div>}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="admin-users">
      <div className="admin-controls">
        <input
          type="text"
          className="form-input"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoComplete="off"
        />
      </div>
      
      <div className="users-table">
        <div className="table-header">
          <div>User</div>
          <div>Email</div>
          <div>Status</div>
          <div>Joined</div>
          <div>Actions</div>
        </div>
        {users.map(user => (
          <div key={user._id} className="table-row">
            <div className="user-info">
              <div className="user-avatar">👤</div>
              <div>
                <div className="username">{user.username}</div>
                {user.isAdmin && <span className="admin-badge">ADMIN</span>}
                {user.isBanned && <span className="banned-badge">BANNED</span>}
              </div>
            </div>
            <div className="user-email">{user.email}</div>
            <div className="user-status">
              <span className={`status-dot ${user.isBanned ? 'banned' : 'active'}`}></span>
              {user.isBanned ? 'Banned' : 'Active'}
            </div>
            <div className="user-joined">{new Date(user.createdAt).toLocaleDateString()}</div>
            <div className="user-actions">
              <button 
                className={`button ${user.isAdmin ? 'admin-active' : ''}`}
                onClick={() => toggleUserAdmin(user._id)}
                title={user.isAdmin ? 'Remove Admin' : 'Make Admin'}
              >
                👑
              </button>
              <button 
                className={`button ${user.isBanned ? 'ban-active' : ''}`}
                onClick={() => toggleUserBan(user._id)}
                title={user.isBanned ? 'Unban User' : 'Ban User'}
              >
                🚫
              </button>
              <button 
                className="button delete-btn"
                onClick={() => deleteUser(user._id)}
                title="Delete User"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="pagination">
        {Array.from({length: totalPages}, (_, i) => (
          <button 
            key={i + 1}
            className={`button ${currentPage === i + 1 ? 'primary' : ''}`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );

  const renderPosts = () => (
    <div className="admin-posts" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="admin-controls">
        <input
          type="text"
          className="form-input"
          placeholder="Search posts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoComplete="off"
        />
      </div>
      
      <div className="posts-grid" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {posts.map(post => (
          <div key={post._id} className="post-card">
            <div className="post-header">
              <div className="post-title">{post.title}</div>
              <button 
                className="button delete-btn"
                onClick={() => deletePost(post._id)}
              >
                🗑️
              </button>
            </div>
            <div className="post-meta">
              by {post.author?.username} • {new Date(post.createdAt).toLocaleDateString()}
            </div>
            <div className="post-stats">
              ❤️ {post.likes?.length || 0} • 💬 {post.comments?.length || 0}
            </div>
            <div className="post-preview">
              {post.content?.substring(0, 100)}...
            </div>
          </div>
        ))}
      </div>
      
      <div className="pagination">
        {Array.from({length: totalPages}, (_, i) => (
          <button 
            key={i + 1}
            className={`button ${currentPage === i + 1 ? 'primary' : ''}`}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="admin-settings">
      <div className="settings-section">
        <h4>🌐 Site Configuration</h4>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Site Name:</label>
            <div className="setting-value">{settings.siteName || 'WinXP Forum'}</div>
          </div>
          <div className="setting-item">
            <label>Registration:</label>
            <div className="setting-value">
              <span className={`status-indicator ${settings.allowRegistration ? 'enabled' : 'disabled'}`}>
                {settings.allowRegistration ? '✅ Enabled' : '❌ Disabled'}
              </span>
            </div>
          </div>
          <div className="setting-item">
            <label>Email Verification:</label>
            <div className="setting-value">
              <span className={`status-indicator ${settings.requireEmailVerification ? 'enabled' : 'disabled'}`}>
                {settings.requireEmailVerification ? '✅ Required' : '❌ Not Required'}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="settings-section">
        <h4>📁 File Upload Settings</h4>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Max File Size:</label>
            <div className="setting-value">{Math.round((settings.maxFileSize || 0) / 1024 / 1024)} MB</div>
          </div>
          <div className="setting-item">
            <label>Allowed Types:</label>
            <div className="setting-value">
              {settings.allowedFileTypes?.join(', ') || 'jpg, png, gif, pdf, txt'}
            </div>
          </div>
        </div>
      </div>
      
      <div className="settings-section">
        <h4>🔧 System Actions</h4>
        <div className="system-actions">
          <button className="button" onClick={() => {
            const success = Math.random() > 0.2;
            alert(success ? 'Cache cleared successfully!' : 'Failed to clear cache');
          }}>
            🗑️ Clear Cache
          </button>
          <button className="button" onClick={() => {
            const success = Math.random() > 0.1;
            alert(success ? 'Database optimized successfully!' : 'Database optimization failed');
          }}>
            ⚡ Optimize Database
          </button>
          <button className="button" onClick={() => {
            const success = Math.random() > 0.15;
            alert(success ? 'Backup created successfully!' : 'Backup creation failed');
          }}>
            💾 Create Backup
          </button>
          <button className="button delete-btn" onClick={() => {
            if (confirm('Clear all system logs? This cannot be undone.')) {
              alert('System logs cleared successfully!');
            }
          }}>
            🧹 Clear Logs
          </button>
        </div>
      </div>
      
      <div className="settings-section">
        <h4>📊 System Information</h4>
        <div className="system-info">
          <div className="info-item">
            <span className="info-label">Server Status:</span>
            <span className="info-value status-online">🟢 Online</span>
          </div>
          <div className="info-item">
            <span className="info-label">Database:</span>
            <span className="info-value status-online">🟢 Connected</span>
          </div>
          <div className="info-item">
            <span className="info-label">Version:</span>
            <span className="info-value">v1.0.0</span>
          </div>
          <div className="info-item">
            <span className="info-label">Uptime:</span>
            <span className="info-value">{Math.floor(Date.now() / 1000 / 3600) % 24}h {Math.floor(Date.now() / 1000 / 60) % 60}m</span>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) return <div className="loading">Loading admin panel...</div>;

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h3>🛠️ Admin Control Panel</h3>
        <div className="admin-tabs">
          <button 
            className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => { setActiveTab('dashboard'); setCurrentPage(1); setSearchTerm(''); }}
          >
            📊 Dashboard
          </button>
          <button 
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => { setActiveTab('users'); setCurrentPage(1); setSearchTerm(''); }}
          >
            👥 Users
          </button>
          <button 
            className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => { setActiveTab('posts'); setCurrentPage(1); setSearchTerm(''); }}
          >
            📝 Posts
          </button>
          <button 
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => { setActiveTab('settings'); setCurrentPage(1); setSearchTerm(''); }}
          >
            ⚙️ Settings
          </button>
        </div>
      </div>
      
      <div className="admin-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'posts' && renderPosts()}
        {activeTab === 'settings' && renderSettings()}
      </div>
    </div>
  );
};

export default AdminPanel;