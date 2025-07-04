import React from 'react';

const Settings = ({ user, onLogout, onClose }) => {
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
            style={{ 
              textAlign: 'left', 
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🔔 Notifications (Coming Soon)
          </button>
          
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
            style={{ 
              textAlign: 'left', 
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            🔒 Privacy (Coming Soon)
          </button>
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