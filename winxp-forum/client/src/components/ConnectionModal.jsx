import React, { useState, useEffect } from 'react';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';

const ConnectionModal = ({ isConnected, onRetry }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!isConnected) {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  if (isConnected) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="window" style={{
        position: 'relative',
        width: '400px',
        height: '250px'
      }}>
        <div className="window-header">
          <div className="window-title">
            <AlertTriangle size={16} color="white" />
            <span>Connection Error</span>
          </div>
        </div>
        
        <div className="window-content" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '20px',
          overflow: 'hidden'
        }}>
          <div style={{ marginBottom: '20px' }}>
            <WifiOff size={48} color="#ff6b6b" />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px' }}>
              Cannot connect to server
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              The forum server is currently unavailable.
              <br />
              This may be due to maintenance or network issues.
            </div>
          </div>
          
          <div style={{ marginBottom: '20px', fontSize: '11px', color: '#888' }}>
            Attempting to reconnect{dots}
          </div>
          
          <button 
            className="button primary"
            onClick={onRetry}
            style={{ minWidth: '100px' }}
          >
            <Wifi size={12} style={{ marginRight: '4px' }} />
            Retry Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectionModal;