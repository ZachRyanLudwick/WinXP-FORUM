import React, { useState, useEffect } from 'react';
import Window from './Window';
import PostList from './PostList';
import PostViewer from './PostViewer';
import CreatePost from './CreatePost';
import Login from './Login';
import AdminPanel from './AdminPanel';

const Desktop = () => {
  const [windows, setWindows] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [user, setUser] = useState(null);

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
    setNextId(prev => prev + 1);
  };

  const closeWindow = (id) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  };

  const minimizeWindow = (id) => {
    // Implementation for minimize
    console.log('Minimize window', id);
  };

  const renderWindow = (window) => {
    const { id, type, props, zIndex, position } = window;
    
    const windowProps = {
      onClose: () => closeWindow(id),
      onMinimize: () => minimizeWindow(id),
      initialPosition: position,
      zIndex,
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
            <PostViewer post={props.post} />
          </Window>
        );
      
      case 'create':
        return (
          <Window 
            key={id}
            {...windowProps}
            title="Create New Post"
            icon="✏️"
            initialSize={{ width: 500, height: 400 }}
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
      
      default:
        return null;
    }
  };

  return (
    <div className="desktop">
      {/* Desktop Icons */}
      <div 
        className="desktop-icon"
        style={{ top: 20, left: 20 }}
        onDoubleClick={() => openWindow('posts')}
      >
        <div className="icon-image">📝</div>
        <span>Posts</span>
      </div>

      {user && (
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

      {/* Windows */}
      {windows.map(renderWindow)}

      {/* Taskbar */}
      <div className="taskbar">
        <button className="start-button">
          Start
        </button>
        
        {windows.map(window => (
          <div key={window.id} className="taskbar-item active">
            {window.type === 'posts' && '📝 Posts'}
            {window.type === 'post' && `📄 ${window.props.post?.title || 'Post'}`}
            {window.type === 'create' && '✏️ New Post'}
            {window.type === 'login' && '🔐 Login'}
            {window.type === 'admin' && '🛠️ Admin Panel'}
          </div>
        ))}

        <div style={{ marginLeft: 'auto', color: 'white', fontSize: '11px' }}>
          {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default Desktop;