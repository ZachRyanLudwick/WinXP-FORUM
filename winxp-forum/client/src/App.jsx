import { useState, useEffect } from 'react'
import Desktop from './components/Desktop'
import MobileBlock from './components/MobileBlock'
import ConnectionModal from './components/ConnectionModal'
import useConnectionStatus from './utils/useConnectionStatus'

function App() {
  const [isMobile, setIsMobile] = useState(false);
  const { isConnected, retryConnection } = useConnectionStatus();

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
      const isSmallScreen = window.innerWidth <= 768;
      setIsMobile(isMobileDevice || isSmallScreen);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return <MobileBlock />;
  }

  return (
    <div className="app">
      <Desktop />
      <ConnectionModal 
        isConnected={isConnected} 
        onRetry={retryConnection} 
      />
    </div>
  )
}
export default App
