import React, { useState, useEffect } from 'react';
import Window from './Window';
import PostList from './PostList';
import PostViewer from './PostViewer';
import CreatePost from './CreatePost';
import Login from './Login';
import AdminPanel from './AdminPanel';
import XPPopup from './XPPopup';
import Settings from './Settings';

const FileViewer = ({ filename, originalName, onClose }) => {
  const downloadFile = async () => {
    try {
      const response = await fetch(`http://localhost:5001/uploads/${filename}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      showPopup('Download Failed', 'Error', 'error')
    }
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
      <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>{originalName}</h3>
      <p style={{ fontSize: '11px', color: '#666', marginBottom: '16px' }}>Click download to save this file</p>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button className="button primary" onClick={downloadFile}>
          💾 Download
        </button>
        <button className="button" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

const Desktop = () => {
  const [windows, setWindows] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [user, setUser] = useState(null);
  const [minimizedWindows, setMinimizedWindows] = useState(new Set());
  const [windowStates, setWindowStates] = useState({});
  const [activeWindow, setActiveWindow] = useState(null);
  const [popup, setPopup] = useState(null);

  const showPopup = (message, type = 'info', title = 'Notification') => {
    setPopup({ message, type, title });
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      fetch('http://localhost:5001/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
      });
    }
  }, []);

  const openWindow = (type, props = {}) => {
    const newWindow = {
      id: nextId,
      type,
      props,
      zIndex: nextId,
      position: { 
        x: 50 + (nextId * 20), 
        y: 50 + (nextId * 20) 
      }
    };
    
    setWindows(prev => [...prev, newWindow]);
    setActiveWindow(nextId);
    setNextId(prev => prev + 1);
  };

  const focusWindow = (id) => {
    setActiveWindow(id);
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, zIndex: Math.max(...prev.map(win => win.zIndex)) + 1 } : w
    ));
  };

  const updateWindowState = (id, state) => {
    setWindowStates(prev => ({
      ...prev,
      [id]: { ...prev[id], ...state }
    }));
  };

  const closeWindow = (id) => {
    setWindows(prev => prev.filter(w => w.id !== id));
    setMinimizedWindows(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    setWindowStates(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const minimizeWindow = (id) => {
    setMinimizedWindows(prev => new Set([...prev, id]));
  };

  const restoreWindow = (id) => {
    setMinimizedWindows(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    focusWindow(id);
  };

  const renderWindow = (window) => {
    const { id, type, props, zIndex, position } = window;
    
    const savedState = windowStates[id] || {};
    const windowProps = {
      onClose: () => closeWindow(id),
      onMinimize: () => minimizeWindow(id),
      onUpdateState: (state) => updateWindowState(id, state),
      onFocus: () => focusWindow(id),
      initialPosition: savedState.position || position,
      initialSize: savedState.size || (type === 'create' ? { width: 700, height: 600 } : { width: 600, height: 400 }),
      zIndex,
      isActive: activeWindow === id,
    };

    switch (type) {
      case 'posts':
        return (
          <Window 
            key={id}
            {...windowProps}
            title="Posts"
            icon="📝"
          >
            <PostList onOpenPost={(post) => openWindow('post', { post })} />
          </Window>
        );
      
      case 'post':
        return (
          <Window 
            key={id}
            {...windowProps}
            title={props.post?.title || 'Post'}
            icon="📄"
          >
            <PostViewer 
              post={props.post} 
              onOpenFile={(file) => openWindow('file', { file })}
            />
          </Window>
        );
      
      case 'create':
        return (
          <Window 
            key={id}
            {...windowProps}
            title="Create New Post"
            icon="✏️"

          >
            <CreatePost onPostCreated={() => closeWindow(id)} />
          </Window>
        );
      
      case 'login':
        return (
          <Window 
            key={id}
            {...windowProps}
            title="Login"
            icon="🔐"
            initialSize={{ width: 300, height: 250 }}
          >
            <Login onLogin={setUser} onClose={() => closeWindow(id)} />
          </Window>
        );
      
      case 'admin':
        return (
          <Window 
            key={id}
            {...windowProps}
            title="Admin Panel"
            icon="🛠️"
            initialSize={{ width: 500, height: 400 }}
          >
            <AdminPanel />
          </Window>
        );
      
      case 'file':
        return (
          <Window 
            key={id}
            {...windowProps}
            title={`File: ${props.file?.originalName || 'Unknown'}`}
            icon="📄"
            initialSize={{ width: 350, height: 300 }}
          >
            <FileViewer 
              filename={props.file?.filename}
              originalName={props.file?.originalName}
              onClose={() => closeWindow(id)}
            />
          </Window>
        );
      
      case 'settings':
        return (
          <Window 
            key={id}
            {...windowProps}
            title="Settings"
            icon="⚙️"
            initialSize={{ width: 400, height: 350 }}
          >
            <Settings 
              user={user}
              onLogout={() => setUser(null)}
              onClose={() => {
                if (!user) {
                  closeWindow(id);
                  openWindow('login');
                } else {
                  closeWindow(id);
                }
              }}
            />
          </Window>
        );
      
      default:
        return null;
    }
  };

  return (
    <div 
      className="desktop"
      onContextMenu={(e) => e.preventDefault()}
      onSelectStart={(e) => e.preventDefault()}
    >
      {/* Desktop Icons */}
      <div 
        className="desktop-icon"
        style={{ top: 20, left: 20 }}
        onDoubleClick={() => openWindow('posts')}
      >
        <div className="icon-image">📝</div>
        <span>Posts</span>
      </div>

      {user?.isAdmin && (
        <div 
          className="desktop-icon"
          style={{ top: 100, left: 20 }}
          onDoubleClick={() => openWindow('create')}
        >
          <div className="icon-image">✏️</div>
          <span>New Post</span>
        </div>
      )}

      {user?.isAdmin && (
        <div 
          className="desktop-icon"
          style={{ top: 180, left: 20 }}
          onDoubleClick={() => openWindow('admin')}
        >
          <div className="icon-image">🛠️</div>
          <span>Admin Panel</span>
        </div>
      )}

      {!user && (
        <div 
          className="desktop-icon"
          style={{ top: 20, left: 100 }}
          onDoubleClick={() => openWindow('login')}
        >
          <div className="icon-image">🔐</div>
          <span>Login</span>
        </div>
      )}

      <div 
        className="desktop-icon"
        style={{ top: 20, left: user ? 100 : 180 }}
        onDoubleClick={() => openWindow('settings')}
      >
        <div className="icon-image">⚙️</div>
        <span>Settings</span>
      </div>

      {/* Windows */}
      {windows.filter(w => !minimizedWindows.has(w.id)).map(renderWindow)}

      {/* Taskbar */}
      <div className="taskbar">
        <button className="start-button">
          Start
        </button>
        
        {windows.map(window => (
          <div 
            key={window.id} 
            className={`taskbar-item ${minimizedWindows.has(window.id) ? '' : 'active'}`}
            onClick={() => minimizedWindows.has(window.id) ? restoreWindow(window.id) : minimizeWindow(window.id)}
          >
            {window.type === 'posts' && '📝 Posts'}
            {window.type === 'post' && `📄 ${window.props.post?.title || 'Post'}`}
            {window.type === 'create' && '✏️ New Post'}
            {window.type === 'login' && '🔐 Login'}
            {window.type === 'admin' && '🛠️ Admin Panel'}
            {window.type === 'file' && `📄 ${window.props.file?.originalName || 'File'}`}
            {window.type === 'settings' && '⚙️ Settings'}
          </div>
        ))}

        <div style={{ marginLeft: 'auto', color: 'white', fontSize: '11px' }}>
          {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      {/* Popup */}
      {popup && (
        <XPPopup
          title={popup.title}
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
};

// Export showPopup function for global use
let globalShowPopup = null;

const DesktopWithPopup = () => {
  const [popup, setPopup] = useState(null);
  
  const showPopup = (message, type = 'info', title = 'Notification') => {
    setPopup({ message, type, title });
  };
  
  React.useEffect(() => {
    globalShowPopup = showPopup;
    return () => { globalShowPopup = null; };
  }, []);
  
  return (
    <>
      <Desktop />
      {popup && (
        <XPPopup
          title={popup.title}
          message={popup.message}
          type={popup.type}
          onClose={() => setPopup(null)}
        />
      )}
    </>
  );
};

export { globalShowPopup as showPopup };
export default DesktopWithPopup;