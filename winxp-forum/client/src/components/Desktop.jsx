import React, { useState, useEffect } from 'react';
import Window from './Window';
import { apiCall, API_URL } from '../utils/api';
import PostList from './PostList';
import PostViewer from './PostViewer';
import CreatePost from './CreatePost';
import Login from './Login';
import AdminPanel from './AdminPanel';
import XPPopup from './XPPopup';
import Settings from './Settings';
import Notepad from './Notepad';
import FileExplorer from './FileExplorer';
import Profile from './Profile';
import UserSearch from './UserSearch';
import Terminal from './Terminal';
import CV from './CV';
import DMApp from './DMApp';
import DMChat from './DMChat';
import FriendsApp from './FriendsApp';
import { saveIconPositions, loadIconPositions } from '../iconPositions';

const DesktopIcon = ({ id, icon, label, position = { x: 0, y: 0 }, onDoubleClick, onPositionChange, gridToPixels, snapToGrid, draggedIcon, setDraggedIcon, gridCols, gridRows }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Ensure position has valid values
  const safePosition = position || { x: 0, y: 0 };
  const pixelPos = gridToPixels(safePosition.x, safePosition.y);
  
  const handleMouseDown = (e) => {
    if (e.detail === 2) return; // Ignore on double click
    setIsDragging(true);
    setDraggedIcon(id);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleMouseMove = (e) => {
    if (isDragging && draggedIcon === id) {
      const newGridPos = snapToGrid(
        e.clientX - dragOffset.x - 20,
        e.clientY - dragOffset.y - 20
      );
      if (newGridPos.x >= 0 && newGridPos.y >= 0 && newGridPos.x < gridCols && newGridPos.y < gridRows) {
        onPositionChange && onPositionChange(newGridPos);
      }
    }
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedIcon(null);
  };
  
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, draggedIcon]);
  
  return (
    <div 
      className={`desktop-icon ${isDragging ? 'selected' : ''}`}
      style={{ 
        position: 'absolute',
        left: pixelPos.x, 
        top: pixelPos.y,
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 1000 : 1,
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
        boxShadow: isDragging ? '0 8px 16px rgba(0,0,0,0.3)' : 'none',
        opacity: isDragging ? 0.9 : 1
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onDoubleClick();
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="icon-image" style={{
        transform: isDragging ? 'rotate(5deg)' : 'rotate(0deg)',
        transition: isDragging ? 'none' : 'transform 0.2s ease'
      }}>{icon}</div>
      <span style={{
        textShadow: isDragging ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none'
      }}>{label}</span>
    </div>
  );
};

const FileViewer = ({ filename, originalName, onClose }) => {
  const downloadFile = async () => {
    try {
      const response = await fetch(`${API_URL}/uploads/${filename}`);
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
  const sharedPostOpened = React.useRef(false);
  const [bookmarkRefresh, setBookmarkRefresh] = useState(0);
  const [minimizedWindows, setMinimizedWindows] = useState(new Set());
  const [windowStates, setWindowStates] = useState({});

  const [activeWindow, setActiveWindow] = useState(null);
  const [popup, setPopup] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadDMCount, setUnreadDMCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [selectionStart, setSelectionStart] = useState({ x: 0, y: 0 });
  const [iconPositions, setIconPositions] = useState({});
  const [draggedIcon, setDraggedIcon] = useState(null);
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [showProgramsMenu, setShowProgramsMenu] = useState(false);
  const [programsMenuTimeout, setProgramsMenuTimeout] = useState(null);
  const [screenSize, setScreenSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  const GRID_SIZE = 80;
  const ICON_SIZE = 64;
  
  // Calculate grid dimensions based on screen size
  const gridCols = Math.floor((screenSize.width - 40) / GRID_SIZE);
  const gridRows = Math.floor((screenSize.height - 100) / GRID_SIZE); // Account for taskbar
  
  const snapToGrid = (x, y) => ({
    x: Math.round(x / GRID_SIZE),
    y: Math.round(y / GRID_SIZE)
  });
  
  const gridToPixels = (gridX, gridY) => ({
    x: gridX * GRID_SIZE + 20,
    y: gridY * GRID_SIZE + 20
  });

  const getIconPosition = (iconId, defaultPos = { x: 0, y: 0 }) => {
    if (iconPositions[iconId]) {
      return iconPositions[iconId];
    }
    
    // Calculate default positions based on visible icons
    const visibleIcons = [];
    visibleIcons.push('posts');
    visibleIcons.push('create');
    if (user?.isAdmin) visibleIcons.push('admin');
    if (!user) visibleIcons.push('login');
    visibleIcons.push('notepad');
    visibleIcons.push('explorer');
    if (user) visibleIcons.push('profile');
    visibleIcons.push('messages');
    visibleIcons.push('settings');
    
    const iconIndex = visibleIcons.indexOf(iconId);
    if (iconIndex === -1) return defaultPos;
    
    return {
      x: Math.floor(iconIndex / Math.max(5, gridRows)), // Dynamic icons per column
      y: iconIndex % Math.max(5, gridRows)
    };
  };

  const showPopup = (message, type = 'info', title = 'Notification') => {
    setPopup({ message, type, title });
  };

  const addNotification = (type, message) => {
    const newNotif = { type, message, timestamp: new Date(), read: false };
    setNotifications(prev => [newNotif, ...prev.slice(0, 49)]);
    setUnreadCount(prev => prev + 1);
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await apiCall(`/api/profile/search/${query}`);
      if (response.ok) {
        const users = await response.json();
        setSearchResults(users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  React.useEffect(() => {
    if (!user) return;
    
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await apiCall('/api/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.read).length);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    
    const fetchUnreadDMs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await apiCall('/api/messages/unread-count');
        if (response.ok) {
          const data = await response.json();
          setUnreadDMCount(data.count);
        }
      } catch (error) {
        console.error('Error fetching unread DM count:', error);
      }
    };
    
    fetchNotifications();
    fetchUnreadDMs();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadDMs();
    }, 3000);
    return () => clearInterval(interval);
  }, [user]);

  // Update clock every second
  React.useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Update screen size on resize
  React.useEffect(() => {
    const handleResize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      apiCall('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          // Load saved icon positions
          loadIconPositions(data.user.id).then(positions => {
            if (positions && typeof positions === 'object') {
              setIconPositions(prev => ({ ...prev, ...positions }));
            }
          }).catch(error => {
            console.error('Error loading icon positions:', error);
          });
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
      });
    }
  }, []);
  
  // Handle shared post URLs
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post');
    if (postId && !sharedPostOpened.current) {
      sharedPostOpened.current = true;
      apiCall(`/api/posts/${postId}`)
        .then(res => res.json())
        .then(post => {
          if (post && !post.message) {
            openWindow('post', { post });
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .catch(error => {
          console.error('Error loading shared post:', error);
        });
    }
  }, []); // Run only once

  // Save icon positions when they change
  useEffect(() => {
    if (user) {
      saveIconPositions(iconPositions, user.id);
    }
  }, [iconPositions, user]);

  const openWindow = (type, props = {}) => {
    const maxZ = windows.length > 0 ? Math.max(...windows.map(w => w.zIndex)) : 0;
    const newZIndex = maxZ + 1;
    
    const position = {
      x: 100 + ((nextId - 1) % 4) * 200,
      y: 80 + Math.floor((nextId - 1) / 4) * 50
    };
    
    const newWindow = {
      id: nextId,
      type,
      props,
      zIndex: newZIndex,
      position
    };
    
    setWindows(prev => [...prev, newWindow]);
    setActiveWindow(nextId);
    setNextId(prev => prev + 1);
  };

  const focusWindow = (id) => {
    setActiveWindow(id);
    const maxZ = Math.max(...windows.map(w => w.zIndex));
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, zIndex: maxZ + 1 } : w
    ));
  };

  const updateWindowState = (id, state) => {
    setWindowStates(prev => ({
      ...prev,
      [id]: { ...prev[id], ...state }
    }));
    
    // Also update the window in the windows array
    setWindows(prev => prev.map(w => 
      w.id === id ? { ...w, ...state } : w
    ));
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
      initialPosition: savedState.position || window.position,
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
            <PostList 
              onOpenPost={(post) => openWindow('post', { post })} 
              refreshTrigger={bookmarkRefresh}
            />
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
              onBookmarkChange={() => setBookmarkRefresh(prev => prev + 1)}
              bookmarkRefresh={bookmarkRefresh}
              onOpenProfile={(userId, username) => openWindow('profile', { userId, username })}
              showPopup={setPopup}
              user={user}
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
            <CreatePost 
              onPostCreated={() => closeWindow(id)} 
              user={user}
              onClose={() => {
                closeWindow(id);
                if (!user) openWindow('login');
              }}
            />
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
      
      case 'notepad':
        return (
          <Window 
            key={id}
            {...windowProps}
            title={`${props.file?.name || 'Untitled'} - Notepad`}
            icon="📝"
            initialSize={{ width: 500, height: 400 }}
          >
            <Notepad initialFile={props.file} />
          </Window>
        );
      
      case 'explorer':
        return (
          <Window 
            key={id}
            {...windowProps}
            title="My Documents"
            icon="📁"
            initialSize={{ width: 600, height: 450 }}
          >
            <FileExplorer onOpenFile={(file) => openWindow('notepad', { file })} />
          </Window>
        );
      
      case 'profile':
        return (
          <Window 
            key={id}
            {...windowProps}
            title={props.userId ? `${props.username || 'User'} Profile` : "My Profile"}
            icon="👤"
            initialSize={{ width: 500, height: 400 }}
          >
            <Profile 
              userId={props.userId} 
              onOpenProfile={(userId, username) => openWindow('profile', { userId, username })}
              onOpenChat={(userId, username) => openWindow('chat', { userId, username })}
              showPopup={setPopup}
            />
          </Window>
        );
      
      case 'usersearch':
        return (
          <Window 
            key={id}
            {...windowProps}
            title="Find Users"
            icon="🔍"
            initialSize={{ width: 400, height: 350 }}
          >
            <UserSearch onOpenProfile={(userId, username) => openWindow('profile', { userId, username })} />
          </Window>
        );
      
      case 'terminal':
        return (
          <Window 
            key={id}
            {...windowProps}
            title="Command Prompt"
            icon="💻"
            initialSize={{ width: 600, height: 400 }}
          >
            <Terminal onOpenCV={() => openWindow('cv')} onClose={() => closeWindow(id)} />
          </Window>
        );
      
      case 'cv':
        return (
          <Window 
            key={id}
            {...windowProps}
            title="Resume - CV"
            icon="📄"
            initialSize={{ width: 700, height: 500 }}
          >
            <CV />
          </Window>
        );
      
      case 'messages':
        return (
          <Window 
            key={id}
            {...windowProps}
            title="Messages"
            icon="💬"
            initialSize={{ width: 400, height: 500 }}
          >
            <DMApp 
              onOpenChat={(userId, username) => openWindow('chat', { userId, username })} 
              user={user}
              onClose={() => {
                closeWindow(id);
                if (!user) openWindow('login');
              }}
              onOpenProfile={(userId, username) => openWindow('profile', { userId, username })}
            />
          </Window>
        );
      
      case 'chat':
        return (
          <Window 
            key={id}
            {...windowProps}
            title={`Chat - ${props.username}`}
            icon="💬"
            initialSize={{ width: 450, height: 400 }}
          >
            <DMChat 
              userId={props.userId} 
              username={props.username}
              onOpenProfile={(userId, username) => openWindow('profile', { userId, username })}
            />
          </Window>
        );
      
      case 'friends':
        return (
          <Window 
            key={id}
            {...windowProps}
            title="Friends"
            icon="👥"
            initialSize={{ width: 400, height: 500 }}
          >
            <FriendsApp 
              onOpenProfile={(userId, username) => openWindow('profile', { userId, username })}
              onOpenChat={(userId, username) => openWindow('chat', { userId, username })}
              showPopup={setPopup}
              user={user}
              onClose={() => {
                closeWindow(id);
                if (!user) openWindow('login');
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
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setShowNotifications(false);
          setShowStartMenu(false);
          setShowProgramsMenu(false);
        }
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && e.button === 0) {
          setIsSelecting(true);
          setSelectionStart({ x: e.clientX, y: e.clientY });
          setSelectionBox({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
        }
      }}
      onMouseMove={(e) => {
        if (isSelecting) {
          const width = e.clientX - selectionStart.x;
          const height = e.clientY - selectionStart.y;
          setSelectionBox({
            x: width < 0 ? e.clientX : selectionStart.x,
            y: height < 0 ? e.clientY : selectionStart.y,
            width: Math.abs(width),
            height: Math.abs(height)
          });
        }
      }}
      onMouseUp={() => {
        setIsSelecting(false);
        setSelectionBox({ x: 0, y: 0, width: 0, height: 0 });
      }}
      style={{
        backgroundImage: draggedIcon ? 
          'url("https://i.imgur.com/Zk6TR5k.jpeg"), repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, transparent 1px, transparent 79px, rgba(255,255,255,0.03) 80px), repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0px, transparent 1px, transparent 79px, rgba(255,255,255,0.03) 80px)' : 
          'url("https://i.imgur.com/Zk6TR5k.jpeg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'background-image 0.3s ease',
        position: 'relative'
      }}
    >
      {/* Desktop Icons */}
      <DesktopIcon 
        id="posts"
        icon="📝"
        label="Posts"
        position={getIconPosition('posts')}
        onDoubleClick={() => openWindow('posts')}
        onPositionChange={(pos) => setIconPositions(prev => ({ ...prev, posts: pos }))}
        gridToPixels={gridToPixels}
        snapToGrid={snapToGrid}
        draggedIcon={draggedIcon}
        setDraggedIcon={setDraggedIcon}
        gridCols={gridCols}
        gridRows={gridRows}
      />

      <DesktopIcon 
        id="create"
        icon="✏️"
        label="New Post"
        position={getIconPosition('create')}
        onDoubleClick={() => openWindow('create')}
        onPositionChange={(pos) => setIconPositions(prev => ({ ...prev, create: pos }))}
        gridToPixels={gridToPixels}
        snapToGrid={snapToGrid}
        draggedIcon={draggedIcon}
        setDraggedIcon={setDraggedIcon}
        gridCols={gridCols}
        gridRows={gridRows}
      />

      {user?.isAdmin && (
        <DesktopIcon 
          id="admin"
          icon="🛠️"
          label="Admin Panel"
          position={getIconPosition('admin')}
          onDoubleClick={() => openWindow('admin')}
          onPositionChange={(pos) => setIconPositions(prev => ({ ...prev, admin: pos }))}
          gridToPixels={gridToPixels}
          snapToGrid={snapToGrid}
          draggedIcon={draggedIcon}
          setDraggedIcon={setDraggedIcon}
          gridCols={gridCols}
          gridRows={gridRows}
        />
      )}

      {!user && (
        <DesktopIcon 
          id="login"
          icon="🔐"
          label="Login"
          position={getIconPosition('login')}
          onDoubleClick={() => openWindow('login')}
          onPositionChange={(pos) => setIconPositions(prev => ({ ...prev, login: pos }))}
          gridToPixels={gridToPixels}
          snapToGrid={snapToGrid}
          draggedIcon={draggedIcon}
          setDraggedIcon={setDraggedIcon}
          gridCols={gridCols}
          gridRows={gridRows}
        />
      )}

      <DesktopIcon 
        id="settings"
        icon="⚙️"
        label="Settings"
        position={getIconPosition('settings')}
        onDoubleClick={() => openWindow('settings')}
        onPositionChange={(pos) => setIconPositions(prev => ({ ...prev, settings: pos }))}
        gridToPixels={gridToPixels}
        snapToGrid={snapToGrid}
        draggedIcon={draggedIcon}
        setDraggedIcon={setDraggedIcon}
        gridCols={gridCols}
        gridRows={gridRows}
      />

      <DesktopIcon 
        id="notepad"
        icon="📝"
        label="Notepad"
        position={getIconPosition('notepad')}
        onDoubleClick={() => openWindow('notepad')}
        onPositionChange={(pos) => setIconPositions(prev => ({ ...prev, notepad: pos }))}
        gridToPixels={gridToPixels}
        snapToGrid={snapToGrid}
        draggedIcon={draggedIcon}
        setDraggedIcon={setDraggedIcon}
        gridCols={gridCols}
        gridRows={gridRows}
      />

      <DesktopIcon 
        id="explorer"
        icon="📁"
        label="My Documents"
        position={getIconPosition('explorer')}
        onDoubleClick={() => openWindow('explorer')}
        onPositionChange={(pos) => setIconPositions(prev => ({ ...prev, explorer: pos }))}
        gridToPixels={gridToPixels}
        snapToGrid={snapToGrid}
        draggedIcon={draggedIcon}
        setDraggedIcon={setDraggedIcon}
        gridCols={gridCols}
        gridRows={gridRows}
      />

      {user && (
        <DesktopIcon 
          id="profile"
          icon="👤"
          label="My Profile"
          position={getIconPosition('profile')}
          onDoubleClick={() => openWindow('profile')}
          onPositionChange={(pos) => setIconPositions(prev => ({ ...prev, profile: pos }))}
          gridToPixels={gridToPixels}
          snapToGrid={snapToGrid}
          draggedIcon={draggedIcon}
          setDraggedIcon={setDraggedIcon}
          gridCols={gridCols}
          gridRows={gridRows}
        />
      )}

      <DesktopIcon 
        id="messages"
        icon="💬"
        label="Messages"
        position={getIconPosition('messages')}
        onDoubleClick={() => openWindow('messages')}
        onPositionChange={(pos) => setIconPositions(prev => ({ ...prev, messages: pos }))}
        gridToPixels={gridToPixels}
        snapToGrid={snapToGrid}
        draggedIcon={draggedIcon}
        setDraggedIcon={setDraggedIcon}
        gridCols={gridCols}
        gridRows={gridRows}
      />

      {/* Selection Box */}
      {isSelecting && (
        <div style={{
          position: 'absolute',
          left: selectionBox.x,
          top: selectionBox.y,
          width: selectionBox.width,
          height: selectionBox.height,
          border: '1px solid #316AC5',
          background: 'rgba(54, 97, 165, 0.49)',
          pointerEvents: 'none',
          zIndex: 999
        }} />
      )}

      {/* Windows */}
      {windows.filter(w => !minimizedWindows.has(w.id)).map(renderWindow)}

      {/* Taskbar */}
      <div className="taskbar">
        <button 
          className="start-button"
          onClick={(e) => {
            e.stopPropagation();
            setShowStartMenu(!showStartMenu);
            setShowNotifications(false);
          }}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            marginRight: '8px'
          }}
        >
          <img 
            src="/start.png" 
            alt="Start" 
            style={{
              height: '32px',
              width: 'auto',
              filter: showStartMenu ? 'brightness(0.8)' : 'none'
            }}
          />
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
            {window.type === 'notepad' && '📝 Notepad'}
            {window.type === 'explorer' && '📁 My Documents'}
            {window.type === 'profile' && '👤 My Profile'}
            {window.type === 'usersearch' && '🔍 Find Users'}
            {window.type === 'terminal' && '💻 Command Prompt'}
            {window.type === 'cv' && '📄 Resume'}
            {window.type === 'messages' && '💬 Messages'}
            {window.type === 'chat' && `💬 ${window.props.username}`}
            {window.type === 'friends' && '👥 Friends'}
          </div>
        ))}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            className="taskbar-item"
            onClick={(e) => { e.stopPropagation(); setShowNotifications(!showNotifications); }}
            style={{ 
              position: 'relative',
              background: showNotifications ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
              cursor: 'pointer'
            }}
          >
            🔔 {unreadCount > 0 && <span style={{ 
              position: 'absolute', top: '-2px', right: '-2px', background: '#ff4757', 
              color: 'white', borderRadius: '50%', width: '16px', height: '16px', 
              fontSize: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>{unreadCount}</span>}
          </div>
          <div style={{ color: 'white', fontSize: '11px' }}>
            {currentTime.toLocaleTimeString()}
          </div>
        </div>
        
        {showNotifications && (
          <div style={{
            position: 'absolute', bottom: '42px', right: '8px', width: '300px', maxHeight: '400px',
            background: 'var(--xp-gray)', border: '2px solid',
            borderColor: 'var(--xp-white) var(--xp-shadow) var(--xp-shadow) var(--xp-white)',
            boxShadow: '2px 2px 4px rgba(0,0,0,0.3)', zIndex: 2000
          }}>
            <div style={{
              background: 'linear-gradient(to bottom, var(--xp-blue), var(--xp-light-blue))',
              color: 'white', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span>🔔 Notifications</span>
              <button onClick={() => setShowNotifications(false)} style={{
                background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '12px'
              }}>✕</button>
            </div>
            <div style={{ maxHeight: '350px', overflow: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', fontSize: '11px', color: '#666' }}>
                  No notifications yet
                </div>
              ) : (
                notifications.map((notif, index) => (
                  <div key={index} style={{
                    padding: '8px', borderBottom: '1px solid #ccc',
                    background: notif.read ? 'white' : '#e6f3ff', cursor: 'pointer'
                  }} onClick={async () => {
                    if (!notif.read) {
                      try {
                        const token = localStorage.getItem('token');
                        await apiCall(`/api/notifications/${notif._id}/read`, {
                          method: 'POST'
                        });
                        setNotifications(prev => prev.map((n, i) => i === index ? { ...n, read: true } : n));
                        setUnreadCount(prev => Math.max(0, prev - 1));
                      } catch (error) {
                        console.error('Error marking notification as read:', error);
                      }
                    }
                    
                    // Open the related content
                    if (notif.postId) {
                      try {
                        const response = await apiCall(`/api/posts/${notif.postId}`);
                        if (response.ok) {
                          const post = await response.json();
                          openWindow('post', { post });
                        }
                      } catch (error) {
                        console.error('Error fetching post:', error);
                      }
                    } else if (notif.type === 'message' && notif.senderId) {
                      openWindow('chat', { userId: notif.senderId, username: notif.senderUsername });
                    } else if (notif.type === 'friend_request' || notif.type === 'friend_accepted') {
                      openWindow('friends');
                    }
                    
                    setShowNotifications(false);
                  }}>
                    <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>
                      {notif.type === 'like' && '❤️ New Like'}
                      {notif.type === 'comment' && '💬 New Comment'}
                      {notif.type === 'reply' && '↩️ New Reply'}
                      {notif.type === 'message' && '💬 New Message'}
                      {notif.type === 'friend_request' && '👥 Friend Request'}
                      {notif.type === 'friend_accepted' && '✅ Friend Accepted'}
                    </div>
                    <div style={{ fontSize: '9px', color: '#666' }}>{notif.message}</div>
                    <div style={{ fontSize: '8px', color: '#999', marginTop: '2px' }}>
                      {new Date(notif.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div style={{ padding: '4px 8px', borderTop: '1px solid #ccc', background: '#f0f0f0', display: 'flex', gap: '4px' }}>
                <button className="button" onClick={() => {
                  setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                  setUnreadCount(0);
                }} style={{ fontSize: '9px', flex: 1 }}>Mark All Read</button>
                <button className="button" onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    await apiCall('/api/notifications/clear', {
                      method: 'DELETE'
                    });
                    setNotifications([]);
                    setUnreadCount(0);
                  } catch (error) {
                    console.error('Error clearing notifications:', error);
                  }
                }} style={{ fontSize: '9px', flex: 1 }}>Clear All</button>
              </div>
            )}
          </div>
        )}
        
        {/* Start Menu */}
        {showStartMenu && (
          <div className="start-menu">
            {/* Main Panel */}
            <div className="start-menu-right">
              {/* User Section */}
              {user && (
                <div className="start-menu-section">
                  <div className="start-menu-user-info">
                    <div className="start-menu-avatar">👤</div>
                    <div>
                      <div className="start-menu-username">{user.username}</div>
                      <div className="start-menu-role">{user.isAdmin ? 'Administrator' : 'User'}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Programs Section */}
              <div className="start-menu-section">
                <div className="start-menu-item" onClick={() => { openWindow('posts'); setShowStartMenu(false); }}>
                  <div className="start-menu-icon">📝</div>
                  <div className="start-menu-text">
                    <div className="start-menu-title">Posts</div>
                    <div className="start-menu-desc">View all posts</div>
                  </div>
                </div>
                
                <div className="start-menu-item" onClick={() => { openWindow('create'); setShowStartMenu(false); }}>
                  <div className="start-menu-icon">✏️</div>
                  <div className="start-menu-text">
                    <div className="start-menu-title">New Post</div>
                    <div className="start-menu-desc">Create a new post</div>
                  </div>
                </div>
                
                <div 
                  className="start-menu-item"
                  onMouseEnter={() => {
                    if (programsMenuTimeout) clearTimeout(programsMenuTimeout);
                    setShowProgramsMenu(true);
                  }}
                  onMouseLeave={() => {
                    const timeout = setTimeout(() => setShowProgramsMenu(false), 300);
                    setProgramsMenuTimeout(timeout);
                  }}
                  style={{ position: 'relative' }}
                >
                  <div className="start-menu-icon">📁</div>
                  <div className="start-menu-text">
                    <div className="start-menu-title">Programs</div>
                    <div className="start-menu-desc">Applications</div>
                  </div>
                  <div style={{ marginLeft: 'auto', fontSize: '8px' }}>▶</div>
                  

                </div>
                
                <div className="start-menu-item" onClick={() => { openWindow('settings'); setShowStartMenu(false); }}>
                  <div className="start-menu-icon">⚙️</div>
                  <div className="start-menu-text">
                    <div className="start-menu-title">Settings</div>
                    <div className="start-menu-desc">Configure preferences</div>
                  </div>
                </div>
                
                <div className="start-menu-item" onClick={() => { openWindow('usersearch'); setShowStartMenu(false); }}>
                  <div className="start-menu-icon">🔍</div>
                  <div className="start-menu-text">
                    <div className="start-menu-title">Find Users</div>
                    <div className="start-menu-desc">Search for members</div>
                  </div>
                </div>
                
                <div className="start-menu-item" onClick={() => { openWindow('terminal'); setShowStartMenu(false); }}>
                  <div className="start-menu-icon">💻</div>
                  <div className="start-menu-text">
                    <div className="start-menu-title">Command Prompt</div>
                    <div className="start-menu-desc">Terminal interface</div>
                  </div>
                </div>
              </div>
              
              {/* Bottom Section */}
              <div className="start-menu-bottom">
                {!user ? (
                  <div className="start-menu-item" onClick={() => { openWindow('login'); setShowStartMenu(false); }}>
                    <div className="start-menu-icon">🔐</div>
                    <div className="start-menu-text">
                      <div className="start-menu-title">Login</div>
                    </div>
                  </div>
                ) : (
                  <div className="start-menu-item" onClick={() => { localStorage.removeItem('token'); setUser(null); setShowStartMenu(false); }}>
                    <div className="start-menu-icon">🚪</div>
                    <div className="start-menu-text">
                      <div className="start-menu-title">Logout</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Programs Submenu */}
        {showStartMenu && showProgramsMenu && (
          <div 
            style={{
              position: 'fixed',
              bottom: '42px',
              left: '300px',
              background: 'var(--xp-gray)',
              border: '2px solid',
              borderColor: 'var(--xp-white) var(--xp-shadow) var(--xp-shadow) var(--xp-white)',
              boxShadow: '2px 2px 4px rgba(0,0,0,0.3)',
              minWidth: '200px',
              zIndex: 3000
            }}
            onMouseEnter={() => {
              if (programsMenuTimeout) clearTimeout(programsMenuTimeout);
              setShowProgramsMenu(true);
            }}
            onMouseLeave={() => {
              const timeout = setTimeout(() => setShowProgramsMenu(false), 300);
              setProgramsMenuTimeout(timeout);
            }}
          >
            <div className="start-menu-item" onClick={() => { openWindow('notepad'); setShowStartMenu(false); setShowProgramsMenu(false); }}>
              <div className="start-menu-icon">📝</div>
              <div className="start-menu-text">
                <div className="start-menu-title">Notepad</div>
              </div>
            </div>
            
            <div className="start-menu-item" onClick={() => { openWindow('messages'); setShowStartMenu(false); setShowProgramsMenu(false); }}>
              <div className="start-menu-icon" style={{ position: 'relative' }}>
                💬
                {unreadDMCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#ff4757',
                    color: 'white',
                    borderRadius: '50%',
                    width: '14px',
                    height: '14px',
                    fontSize: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    {unreadDMCount > 9 ? '9+' : unreadDMCount}
                  </span>
                )}
              </div>
              <div className="start-menu-text">
                <div className="start-menu-title">Messages</div>
              </div>
            </div>
            
            <div className="start-menu-item" onClick={() => { openWindow('explorer'); setShowStartMenu(false); setShowProgramsMenu(false); }}>
              <div className="start-menu-icon">📁</div>
              <div className="start-menu-text">
                <div className="start-menu-title">My Documents</div>
              </div>
            </div>
            
            <div className="start-menu-item" onClick={() => { openWindow('friends'); setShowStartMenu(false); setShowProgramsMenu(false); }}>
              <div className="start-menu-icon">👥</div>
              <div className="start-menu-text">
                <div className="start-menu-title">Friends</div>
              </div>
            </div>
            
            {user?.isAdmin && (
              <div className="start-menu-item" onClick={() => { openWindow('admin'); setShowStartMenu(false); setShowProgramsMenu(false); }}>
                <div className="start-menu-icon">🛠️</div>
                <div className="start-menu-text">
                  <div className="start-menu-title">Admin Panel</div>
                </div>
              </div>
            )}
          </div>
        )}
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
  
  const showPopup = (popupData) => {
    if (typeof popupData === 'string') {
      setPopup({ message: popupData, type: 'info', title: 'Notification' });
    } else {
      setPopup(popupData);
    }
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