import React, { useState, useEffect } from 'react';

const Settings = ({ user, onLogout, onClose }) => {
  const [notificationSettings, setNotificationSettings] = useState({
    likes: true,
    comments: true,
    replies: true,
    messages: true
  });
  const [dmSettings, setDmSettings] = useState({
    allowDMs: true,
    allowDMsFromFriends: true
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDMSettings, setShowDMSettings] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotificationSettings();
    }
  }, [user]);

  const fetchNotificationSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/notifications/settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const settings = await response.json();
        setNotificationSettings(settings);
      }
      
      const dmResponse = await fetch('http://localhost:5001/api/user/dm-settings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (dmResponse.ok) {
        const dmData = await dmResponse.json();
        setDmSettings(dmData);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const updateNotificationSetting = async (type, enabled) => {
    const newSettings = { ...notificationSettings, [type]: enabled };
    setNotificationSettings(newSettings);
    
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:5001/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newSettings)
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout();
    onClose();
  };

  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔐</div>
        <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Account Required</h3>
        <p style={{ fontSize: '11px', color: '#666', marginBottom: '16px' }}>
          Please create an account or login to access settings
        </p>
        <button className="button primary" onClick={onClose}>
          Create Account / Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px' }}>
      {/* User Info Section */}
      <div style={{ 
        background: '#f5f5f5', 
        padding: '12px', 
        borderRadius: '4px', 
        marginBottom: '16px',
        border: '1px solid #ddd'
      }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
          👤 Account Information
        </div>
        <div style={{ fontSize: '11px', marginBottom: '4px' }}>
          <strong>Username:</strong> {user.username}
        </div>
        <div style={{ fontSize: '11px', marginBottom: '4px' }}>
          <strong>Email:</strong> {user.email}
        </div>
        <div style={{ fontSize: '11px', marginBottom: '4px' }}>
          <strong>Role:</strong> {user.isAdmin ? '👑 Administrator' : '👤 User'}
        </div>
      </div>

      {/* Settings Options */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>
          ⚙️ Settings
        </div>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px' 
        }}>
          <button 
            className="button"
            onClick={() => setShowNotifications(!showNotifications)}
            style={{ 
              textAlign: 'left', 
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: showNotifications ? '#e6f3ff' : 'transparent'
            }}
          >
            🔔 Notifications {showNotifications ? '▼' : '▶'}
          </button>
          
          {showNotifications && (
            <div style={{ 
              marginLeft: '16px', 
              padding: '8px', 
              background: '#f8f9fa', 
              border: '1px solid #dee2e6',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>
                Choose which notifications to receive:
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.likes}
                    onChange={(e) => updateNotificationSetting('likes', e.target.checked)}
                  />
                  ❤️ Likes on my posts and comments
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.comments}
                    onChange={(e) => updateNotificationSetting('comments', e.target.checked)}
                  />
                  💬 Comments on my posts
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.replies}
                    onChange={(e) => updateNotificationSetting('replies', e.target.checked)}
                  />
                  ↩️ Replies to my comments
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                  <input 
                    type="checkbox" 
                    checked={notificationSettings.messages}
                    onChange={(e) => updateNotificationSetting('messages', e.target.checked)}
                  />
                  💬 Direct messages
                </label>
              </div>
            </div>
          )}
          
          <button 
            className="button"
            style={{ 
              textAlign: 'left', 
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🎨 Theme (Coming Soon)
          </button>
          
          <button 
            className="button"
            onClick={() => setShowDMSettings(!showDMSettings)}
            style={{ 
              textAlign: 'left', 
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: showDMSettings ? '#e6f3ff' : 'transparent'
            }}
          >
            💬 Direct Messages {showDMSettings ? '▼' : '▶'}
          </button>
          
          {showDMSettings && (
            <div style={{ 
              marginLeft: '16px', 
              padding: '8px', 
              background: '#f8f9fa', 
              border: '1px solid #dee2e6',
              borderRadius: '4px'
            }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '8px' }}>
                Choose who can send you direct messages:
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                  <input 
                    type="checkbox" 
                    checked={dmSettings.allowDMs}
                    onChange={async (e) => {
                      const newSettings = { ...dmSettings, allowDMs: e.target.checked };
                      setDmSettings(newSettings);
                      try {
                        const token = localStorage.getItem('token');
                        await fetch('http://localhost:5001/api/user/dm-settings', {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify(newSettings)
                        });
                      } catch (error) {
                        console.error('Error updating DM settings:', error);
                      }
                    }}
                  />
                  💬 Allow messages from everyone
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                  <input 
                    type="checkbox" 
                    checked={dmSettings.allowDMsFromFriends}
                    onChange={async (e) => {
                      const newSettings = { ...dmSettings, allowDMsFromFriends: e.target.checked };
                      setDmSettings(newSettings);
                      try {
                        const token = localStorage.getItem('token');
                        await fetch('http://localhost:5001/api/user/dm-settings', {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify(newSettings)
                        });
                      } catch (error) {
                        console.error('Error updating DM settings:', error);
                      }
                    }}
                  />
                  👥 Allow messages from friends only
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ 
        borderTop: '1px solid #ddd', 
        paddingTop: '12px',
        display: 'flex',
        gap: '8px'
      }}>
        <button 
          className="button"
          onClick={handleLogout}
          style={{ 
            background: '#dc3545',
            color: 'white',
            border: '1px solid #dc3545'
          }}
        >
          🚪 Logout
        </button>
        <button className="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default Settings;