import React from 'react';

const LoginRequired = ({ user, onClose, appName, appIcon, description }) => {
  if (user) return null;

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>{appIcon || '🔐'}</div>
      <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Account Required</h3>
      <p style={{ fontSize: '11px', color: '#666', marginBottom: '16px' }}>
        {description || `Please create an account or login to access ${appName || 'this feature'}`}
      </p>
      <button className="button primary" onClick={onClose}>
        Create Account / Login
      </button>
    </div>
  );
};

export default LoginRequired;