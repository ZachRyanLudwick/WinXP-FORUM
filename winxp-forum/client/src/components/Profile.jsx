import React, { useState, useEffect } from 'react';
import { getRankInfo, RankBadge } from '../utils/rankUtils.jsx';


const Profile = ({ userId = null, onOpenProfile, onOpenChat, showPopup }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [friendshipStatus, setFriendshipStatus] = useState(null);

  useEffect(() => {
    fetchProfile();
    if (userId) {
      checkFriendshipStatus();
    }
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

  const checkFriendshipStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/friends', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const friends = await response.json();
        const isFriend = friends.some(friend => friend._id === userId);
        if (isFriend) {
          setFriendshipStatus('friends');
          return;
        }
      }
      
      // Check pending requests
      const requestsResponse = await fetch('http://localhost:5001/api/friends/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (requestsResponse.ok) {
        const requests = await requestsResponse.json();
        const pendingRequest = requests.find(req => req.requester._id === userId);
        if (pendingRequest) {
          setFriendshipStatus('pending_received');
          return;
        }
      }
      
      setFriendshipStatus('none');
    } catch (error) {
      console.error('Error checking friendship status:', error);
    }
  };

  const sendFriendRequest = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/friends/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ recipientId: userId })
      });
      
      if (response.ok) {
        setFriendshipStatus('pending_sent');
        showPopup && showPopup({
          message: 'Friend request sent!',
          type: 'success',
          title: 'Request Sent'
        });
      } else {
        const error = await response.json();
        showPopup && showPopup({
          message: error.message || 'Failed to send friend request',
          type: 'error',
          title: 'Error'
        });
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <RankBadge rank={user.rank || 'Newbie'} size="large" />
            <div className="profile-role">{user.isAdmin ? 'Administrator' : 'Member'}</div>
          </div>
          <div className="profile-joined">Joined {new Date(user.createdAt).toLocaleDateString()}</div>
        </div>
        <div className="profile-actions">
          <div className="profile-karma">
            <div className="karma-total">{stats.totalKarma}</div>
            <div className="karma-label">Total Karma</div>
          </div>
          {userId && (() => {
            const token = localStorage.getItem('token');
            if (token) {
              try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.userId === userId) {
                  return null; // Don't show button for own profile
                }
              } catch (e) {}
            }
            return (
              <button 
                className="button primary"
                onClick={async () => {
                  try {
                    const response = await fetch(`http://localhost:5001/api/user/${userId}/dm-settings`, {
                      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    });
                    if (response.ok) {
                      const settings = await response.json();
                      if (!settings.allowDMs) {
                        // Check if we're friends and friend DMs are allowed
                        if (friendshipStatus === 'friends' && settings.allowDMsFromFriends) {
                          onOpenChat && onOpenChat(userId, user.username);
                          return;
                        }
                        showPopup && showPopup({
                          message: 'This user has disabled direct messages in their settings.',
                          type: 'info',
                          title: 'Messages Disabled'
                        });
                        return;
                      }
                    }
                    onOpenChat && onOpenChat(userId, user.username);
                  } catch (error) {
                    console.error('Error checking DM settings:', error);
                    onOpenChat && onOpenChat(userId, user.username);
                  }
                }}
                style={{ marginTop: '8px', fontSize: '10px', marginRight: '8px' }}
              >
                💬 Send Message
              </button>
            );
          })()}
          
          {userId && (() => {
            const token = localStorage.getItem('token');
            if (token) {
              try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                if (payload.userId === userId) {
                  return null; // Don't show button for own profile
                }
              } catch (e) {}
            }
            
            if (friendshipStatus === 'friends') {
              return (
                <button 
                  className="button"
                  style={{ marginTop: '8px', fontSize: '10px', background: '#28a745', color: 'white' }}
                  disabled
                >
                  👥 Friends
                </button>
              );
            } else if (friendshipStatus === 'pending_sent') {
              return (
                <button 
                  className="button"
                  style={{ marginTop: '8px', fontSize: '10px' }}
                  disabled
                >
                  ⏳ Request Sent
                </button>
              );
            } else if (friendshipStatus === 'pending_received') {
              return (
                <button 
                  className="button"
                  style={{ marginTop: '8px', fontSize: '10px', background: '#ffc107', color: 'black' }}
                  disabled
                >
                  📬 Request Received
                </button>
              );
            } else {
              return (
                <button 
                  className="button primary"
                  onClick={sendFriendRequest}
                  style={{ marginTop: '8px', fontSize: '10px' }}
                >
                  👥 Add Friend
                </button>
              );
            }
          })()}
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