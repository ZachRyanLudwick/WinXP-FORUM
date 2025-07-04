import React, { useState, useEffect } from 'react';

const Profile = ({ userId = null, onOpenProfile }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = userId ? `http://localhost:5001/api/profile/user/${userId}` : 'http://localhost:5001/api/profile';
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (!profileData) {
    return <div className="error">Profile not found</div>;
  }

  const { user, posts, stats } = profileData;

  return (
    <div className="profile">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">👤</div>
        <div className="profile-info">
          <h2 className="profile-username">{user.username}</h2>
          <div className="profile-role">{user.isAdmin ? 'Administrator' : 'Member'}</div>
          <div className="profile-joined">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
        </div>
        <div className="profile-karma">
          <div className="karma-total">{stats.totalKarma}</div>
          <div className="karma-label">Total Karma</div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="profile-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          Posts ({stats.postsCreated})
        </button>
        <button 
          className={`tab ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
      </div>

      {/* Tab Content */}
      <div className="profile-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{stats.postsCreated}</div>
                <div className="stat-label">Posts Created</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.postLikes}</div>
                <div className="stat-label">Post Likes</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.commentsCreated}</div>
                <div className="stat-label">Comments</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.commentLikes}</div>
                <div className="stat-label">Comment Likes</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.repliesCreated}</div>
                <div className="stat-label">Replies</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{stats.replyLikes}</div>
                <div className="stat-label">Reply Likes</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div className="posts-tab">
            {posts.length === 0 ? (
              <div className="no-content">No posts yet</div>
            ) : (
              posts.map(post => (
                <div key={post._id} className="post-summary">
                  <div className="post-title">{post.title}</div>
                  <div className="post-meta">
                    {new Date(post.createdAt).toLocaleDateString()} • 
                    ❤️ {post.likes.length} • 💬 {post.comments.length}
                  </div>
                  <div className="post-preview">
                    {post.content.substring(0, 150)}...
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-tab">
            <div className="activity-summary">
              <h3>Recent Activity</h3>
              <div className="activity-item">
                <span className="activity-icon">📝</span>
                Created {stats.postsCreated} posts
              </div>
              <div className="activity-item">
                <span className="activity-icon">💬</span>
                Made {stats.commentsCreated} comments
              </div>
              <div className="activity-item">
                <span className="activity-icon">↩️</span>
                Posted {stats.repliesCreated} replies
              </div>
              <div className="activity-item">
                <span className="activity-icon">⭐</span>
                Earned {stats.totalKarma} total karma
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;