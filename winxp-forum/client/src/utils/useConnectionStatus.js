import { useState, useEffect } from 'react';
import { apiCall } from './api';

const useConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    try {
      setIsChecking(true);
      const response = await apiCall('/api/posts/community/');
      if (response.ok) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    // Check connection every 10 seconds
    const interval = setInterval(checkConnection, 10000);
    
    // Initial check
    checkConnection();
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const retryConnection = () => {
    checkConnection();
  };

  return { isConnected, isChecking, retryConnection };
};

export default useConnectionStatus;