import { useState, useEffect } from 'react';
import { apiCall } from './api';

const useConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    try {
      const response = await apiCall('/api/health/');
      if (response.ok) {
        // Only update if we were previously disconnected
        if (!isConnected) {
          setIsConnected(true);
        }
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(checkConnection, 10000);
    
    // Initial check
    checkConnection();
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const retryConnection = () => {
    checkConnection();
  }

  return { isConnected, isChecking, retryConnection };
};

export default useConnectionStatus;