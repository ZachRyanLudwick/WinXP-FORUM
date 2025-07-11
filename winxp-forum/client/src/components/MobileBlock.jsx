import React from 'react';

const MobileBlock = () => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      color: 'white',
      fontFamily: 'Tahoma, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>💻</div>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Desktop Only</h1>
        <p style={{ fontSize: '16px', marginBottom: '8px' }}>
          This Windows XP Cybersecurity & Hacking experience is designed for desktop computers. We apologise for any inconvenience.
        </p>
        <p style={{ fontSize: '14px', opacity: 0.8 }}>
          Mobile version coming soon!
        </p>
      </div>
    </div>
  );
};

export default MobileBlock;