import React, { useState, useEffect } from 'react';
import LoginRequired from './LoginRequired';

const FriendsApp = ({ onOpenProfile, onOpenChat, showPopup, user, onClose }) => {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/friends', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFriends(data);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/friends/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    }
  };

  const acceptRequest = async (friendshipId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/friends/accept/${friendshipId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        fetchFriends();
        fetchRequests();
        showPopup && showPopup({
          message: 'Friend request accepted!',
          type: 'success',
          title: 'Success'
        });
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const declineRequest = async (friendshipId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/friends/decline/${friendshipId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        fetchRequests();
        showPopup && showPopup({
          message: 'Friend request declined',
          type: 'info',
          title: 'Request Declined'
        });
      }
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const removeFriend = async (friendshipId) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/friends/${friendshipId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        fetchFriends();
        showPopup && showPopup({
          message: 'Friend removed',
          type: 'info',
          title: 'Friend Removed'
        });
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const loginRequired = (
    <LoginRequired 
      user={user}
      onClose={onClose}
      appName="Friends"
      appIcon="👥"
      description="Please create an account or login to manage your friends and send friend requests"
    />
  );
  
  if (!user) return loginRequired;
  
  if (loading) {
    return <div className="loading">Loading friends...</div>;
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #ccc',
        background: '#f0f0f0'
      }}>
        <button 
          className={`button ${activeTab === 'friends' ? 'primary' : ''}`}
          onClick={() => setActiveTab('friends')}
          style={{ 
            borderRadius: 0, 
            fontSize: '10px',
            flex: 1
          }}
        >
          👥 Friends ({friends.length})
        </button>
        <button 
          className={`button ${activeTab === 'requests' ? 'primary' : ''}`}
          onClick={() => setActiveTab('requests')}
          style={{ 
            borderRadius: 0, 
            fontSize: '10px',
            flex: 1,
            position: 'relative'
          }}
        >
          📨 Requests ({requests.length})
          {requests.length > 0 && (
            <span style={{
              position: 'absolute',
              top: '-2px',
              right: '4px',
              background: '#ff4757',
              color: 'white',
              borderRadius: '50%',
              width: '12px',
              height: '12px',
              fontSize: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        {activeTab === 'friends' && (
          <div>
            {friends.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px', 
                color: '#666',
                fontSize: '11px'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
                <div>No friends yet</div>
                <div style={{ marginTop: '8px' }}>
                  Use the Find Users app to search for people and send friend requests!
                </div>
              </div>
            ) : (
              friends.map(friend => (
                <div key={friend._id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  border: '1px solid #ddd',
                  marginBottom: '4px',
                  background: 'white'
                }}>
                  <div style={{ fontSize: '16px', marginRight: '8px' }}>👤</div>
                  <div style={{ flex: 1, fontSize: '11px' }}>
                    <div style={{ fontWeight: 'bold' }}>{friend.username}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      className="button"
                      onClick={() => onOpenProfile && onOpenProfile(friend._id, friend.username)}
                      style={{ fontSize: '9px', padding: '2px 6px' }}
                    >
                      View
                    </button>
                    <button 
                      className="button primary"
                      onClick={() => onOpenChat && onOpenChat(friend._id, friend.username)}
                      style={{ fontSize: '9px', padding: '2px 6px' }}
                    >
                      Chat
                    </button>
                    <button 
                      className="button"
                      onClick={() => removeFriend(friend.friendshipId)}
                      style={{ 
                        fontSize: '9px', 
                        padding: '2px 6px',
                        background: '#dc3545',
                        color: 'white'
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
            {requests.length === 0 ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px 20px', 
                color: '#666',
                fontSize: '11px'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>📨</div>
                <div>No pending friend requests</div>
              </div>
            ) : (
              requests.map(request => (
                <div key={request._id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px',
                  border: '1px solid #ddd',
                  marginBottom: '4px',
                  background: '#f8f9fa'
                }}>
                  <div style={{ fontSize: '16px', marginRight: '8px' }}>👤</div>
                  <div style={{ flex: 1, fontSize: '11px' }}>
                    <div style={{ fontWeight: 'bold' }}>{request.requester.username}</div>
                    <div style={{ color: '#666', fontSize: '10px' }}>
                      Sent {new Date(request.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button 
                      className="button"
                      onClick={() => onOpenProfile && onOpenProfile(request.requester._id, request.requester.username)}
                      style={{ fontSize: '9px', padding: '2px 6px' }}
                    >
                      View
                    </button>
                    <button 
                      className="button primary"
                      onClick={() => acceptRequest(request._id)}
                      style={{ 
                        fontSize: '9px', 
                        padding: '2px 6px',
                        background: '#28a745',
                        color: 'white'
                      }}
                    >
                      Accept
                    </button>
                    <button 
                      className="button"
                      onClick={() => declineRequest(request._id)}
                      style={{ 
                        fontSize: '9px', 
                        padding: '2px 6px',
                        background: '#dc3545',
                        color: 'white'
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

export default FriendsApp;