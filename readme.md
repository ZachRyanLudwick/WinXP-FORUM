# Windows XP Style Forum/Blog Website - Complete Guide

This guide will help you build a Windows XP-themed forum/blog website using Vite (React), Express.js, and MongoDB.

## Project Structure
```
winxp-forum/
├── client/                 # Vite React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── styles/
│   │   └── utils/
│   ├── package.json
│   └── vite.config.js
├── server/                 # Express.js backend
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── package.json
│   └── server.js
└── README.md
```

## Part 1: Backend Setup (Node.js + Express + MongoDB)

### Step 1: Initialize Backend
```bash
mkdir winxp-forum
cd winxp-forum
mkdir server
cd server
npm init -y
```

### Step 2: Install Backend Dependencies
```bash
npm install express mongoose cors dotenv bcryptjs jsonwebtoken multer 
npm install -D nodemon
```

### Step 3: Create server.js
```javascript
// server/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/winxp-forum', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Step 4: Create MongoDB Models
```javascript
// server/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    default: 'default-avatar.png',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
```

```javascript
// server/models/Post.js
const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tags: [{
    type: String,
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  icon: {
    type: String,
    default: 'document.png',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Post', postSchema);
```

### Step 5: Create API Routes
```javascript
// server/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    await user.save();

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
```

```javascript
// server/routes/posts.js
const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username avatar')
      .populate('comments.author', 'username avatar')
      .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create post
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, tags, icon } = req.body;

    const post = new Post({
      title,
      content,
      author: req.userId,
      tags: tags || [],
      icon: icon || 'document.png',
    });

    await post.save();
    await post.populate('author', 'username avatar');

    res.status(201).json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'username avatar')
      .populate('comments.author', 'username avatar');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add comment
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      author: req.userId,
      content,
    });

    await post.save();
    await post.populate('comments.author', 'username avatar');

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Unlike post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.userId);

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(req.userId);
    }

    await post.save();
    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
```

### Step 6: Create Auth Middleware
```javascript
// server/middleware/auth.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};
```

### Step 7: Update package.json scripts
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

## Part 2: Frontend Setup (Vite + React)

### Step 1: Create React App with Vite
```bash
cd .. # Back to root directory
npm create vite@latest client -- --template react
cd client
npm install
```

### Step 2: Install Frontend Dependencies
```bash
npm install axios react-router-dom lucide-react react-quill --legacy-peer-deps
```

### Step 3: Create Windows XP Styles
```css
/* client/src/styles/winxp.css */
@import url('https://fonts.googleapis.com/css2?family=Tahoma:wght@400;700&display=swap');

:root {
  --xp-blue: #0054e3;
  --xp-light-blue: #4d8cff;
  --xp-gray: #ece9d8;
  --xp-dark-gray: #d4d0c8;
  --xp-border: #c0c0c0;
  --xp-shadow: #404040;
  --xp-white: #ffffff;
  --xp-green: #00b04f;
  --xp-red: #ff6b6b;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Tahoma', sans-serif;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  min-height: 100vh;
  overflow-x: hidden;
}

.desktop {
  min-height: 100vh;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23003366"/><rect x="0" y="0" width="50" height="50" fill="%23004488" opacity="0.1"/><rect x="50" y="50" width="50" height="50" fill="%23004488" opacity="0.1"/></svg>') repeat;
  position: relative;
  padding: 20px;
}

.window {
  background: var(--xp-gray);
  border: 2px solid;
  border-color: var(--xp-white) var(--xp-shadow) var(--xp-shadow) var(--xp-white);
  border-radius: 0;
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  position: absolute;
  min-width: 300px;
  min-height: 200px;
}

.window-header {
  background: linear-gradient(to bottom, var(--xp-blue), var(--xp-light-blue));
  color: white;
  padding: 4px 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  font-size: 11px;
  border-bottom: 1px solid var(--xp-shadow);
}

.window-title {
  display: flex;
  align-items: center;
  gap: 4px;
}

.window-controls {
  display: flex;
  gap: 2px;
}

.window-button {
  width: 16px;
  height: 14px;
  background: var(--xp-gray);
  border: 1px solid;
  border-color: var(--xp-white) var(--xp-shadow) var(--xp-shadow) var(--xp-white);
  cursor: pointer;
  font-size: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.window-button:hover {
  background: var(--xp-dark-gray);
}

.window-button:active {
  border-color: var(--xp-shadow) var(--xp-white) var(--xp-white) var(--xp-shadow);
}

.window-content {
  padding: 8px;
  height: calc(100% - 30px);
  overflow: auto;
  background: var(--xp-white);
  border: 1px inset var(--xp-border);
  margin: 2px;
}

.taskbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(to bottom, var(--xp-blue), var(--xp-light-blue));
  border-top: 1px solid var(--xp-border);
  display: flex;
  align-items: center;
  padding: 0 4px;
  z-index: 1000;
}

.start-button {
  background: var(--xp-green);
  color: white;
  border: 1px solid;
  border-color: var(--xp-white) var(--xp-shadow) var(--xp-shadow) var(--xp-white);
  border-radius: 3px;
  padding: 4px 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 11px;
  margin-right: 8px;
}

.start-button:hover {
  background: #00c95a;
}

.taskbar-item {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid transparent;
  padding: 4px 8px;
  margin: 0 2px;
  cursor: pointer;
  font-size: 11px;
  border-radius: 2px;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.taskbar-item:hover {
  background: rgba(255, 255, 255, 0.2);
}

.taskbar-item.active {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
}

.desktop-icon {
  position: absolute;
  width: 64px;
  height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  padding: 4px;
  border-radius: 2px;
  color: white;
  text-align: center;
  font-size: 10px;
}

.desktop-icon:hover {
  background: rgba(255, 255, 255, 0.1);
}

.desktop-icon.selected {
  background: rgba(255, 255, 255, 0.2);
  border: 1px dotted white;
}

.icon-image {
  width: 32px;
  height: 32px;
  margin-bottom: 4px;
  background: var(--xp-gray);
  border: 1px solid var(--xp-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-size: 11px;
  font-weight: bold;
}

.form-input {
  width: 100%;
  padding: 2px 4px;
  border: 1px inset var(--xp-border);
  font-family: inherit;
  font-size: 11px;
}

.form-input:focus {
  outline: none;
  border: 1px solid var(--xp-blue);
}

.button {
  background: var(--xp-gray);
  border: 1px solid;
  border-color: var(--xp-white) var(--xp-shadow) var(--xp-shadow) var(--xp-white);
  padding: 4px 12px;
  cursor: pointer;
  font-family: inherit;
  font-size: 11px;
}

.button:hover {
  background: var(--xp-dark-gray);
}

.button:active {
  border-color: var(--xp-shadow) var(--xp-white) var(--xp-white) var(--xp-shadow);
}

.button.primary {
  background: var(--xp-blue);
  color: white;
}

.button.primary:hover {
  background: var(--xp-light-blue);
}

.post-list {
  display: grid;
  gap: 8px;
  padding: 8px;
}

.post-item {
  background: var(--xp-white);
  border: 1px solid var(--xp-border);
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.post-item:hover {
  background: #e6f3ff;
}

.post-icon {
  width: 24px;
  height: 24px;
  background: var(--xp-gray);
  border: 1px solid var(--xp-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.post-info {
  flex: 1;
}

.post-title {
  font-weight: bold;
  font-size: 11px;
  margin-bottom: 2px;
}

.post-meta {
  font-size: 10px;
  color: #666;
}

.context-menu {
  position: absolute;
  background: var(--xp-gray);
  border: 1px solid var(--xp-border);
  box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-width: 120px;
}

.context-menu-item {
  padding: 4px 12px;
  cursor: pointer;
  font-size: 11px;
  border-bottom: 1px solid var(--xp-border);
}

.context-menu-item:hover {
  background: var(--xp-blue);
  color: white;
}

.context-menu-item:last-child {
  border-bottom: none;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  font-size: 11px;
  color: #666;
}

.error {
  color: var(--xp-red);
  font-size: 11px;
  margin-top: 4px;
}

.success {
  color: var(--xp-green);
  font-size: 11px;
  margin-top: 4px;
}

/* Scrollbar styling */
::-webkit-scrollbar {
  width: 16px;
  height: 16px;
}

::-webkit-scrollbar-track {
  background: var(--xp-gray);
  border: 1px inset var(--xp-border);
}

::-webkit-scrollbar-thumb {
  background: var(--xp-dark-gray);
  border: 1px solid;
  border-color: var(--xp-white) var(--xp-shadow) var(--xp-shadow) var(--xp-white);
}

::-webkit-scrollbar-thumb:hover {
  background: #b8b8b8;
}

::-webkit-scrollbar-corner {
  background: var(--xp-gray);
}
```

### Step 4: Create Main Components

```jsx
// client/src/components/Window.jsx
import React, { useState } from 'react';
import { X, Minus, Square } from 'lucide-react';

const Window = ({ 
  title, 
  children, 
  onClose, 
  onMinimize, 
  icon = '📄',
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 600, height: 400 },
  isActive = true,
  zIndex = 1
}) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
  }, [isDragging, dragOffset]);

  return (
    <div 
      className={`window ${isActive ? 'active' : ''}`}
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: zIndex
      }}
    >
      <div 
        className="window-header"
        onMouseDown={handleMouseDown}
      >
        <div className="window-title">
          <span>{icon}</span>
          <span>{title}</span>
        </div>
        <div className="window-controls">
          <button className="window-button" onClick={onMinimize}>
            <Minus size={8} />
          </button>
          <button className="window-button">
            <Square size={6} />
          </button>
          <button className="window-button" onClick={onClose}>
            <X size={8} />
          </button>
        </div>
      </div>
      <div className="window-content">
        {children}
      </div>
    </div>
  );
};

export default Window;
```

```jsx
// client/src/components/Desktop.jsx
import React, { useState, useEffect } from 'react';
import Window from './Window';
import PostList from './PostList';
import PostViewer from './PostViewer';
import CreatePost from './CreatePost';
import Login from './Login';

const Desktop = () => {
  const [windows, setWindows] = useState([]);
  const [nextId, setNextId] = useState(1);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and get user info
      fetch('/api/auth/me', {
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
      key: id,
      onClose: () => closeWindow(id),
      onMinimize: () => minimizeWindow(id),
      initialPosition: position,
      zIndex,
    };

    switch (type) {
      case 'posts':
        return (
          <Window 
            {...windowProps}
            title="My Posts"
            icon="📝"
          >
            <PostList onOpenPost={(post) => openWindow('post', { post })} />
          </Window>
        );
      
      case 'post':
        return (
          <Window 
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
            {...windowProps}
            title="Login"
            icon="🔐"
            initialSize={{ width: 300, height: 250 }}
          >
            <Login onLogin={setUser} onClose={() => closeWindow(id)} />
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
        <span>My Posts</span>
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
            {window.type === 'posts' && '📝 My Posts'}
            {window.type === 'post' && `📄 ${window.props.post?.title || 'Post'}`}
            {window.type === 'create' && '✏️ New Post'}
            {window.type === 'login' && '🔐 Login'}
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
```

### Step 5: Create Feature Components

```jsx
// client/src/components/PostList.jsx
import React, { useState, useEffect } from 'react';
import { File, MessageCircle, Heart } from 'lucide-react';

const PostList = ({ onOpenPost }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading posts...</div>;
  }

  const getPostIcon = (icon) => {
    const icons = {
      'document.png': '📄',
      'image.png': '🖼️',
      'code.png': '💻',
      'idea.png': '💡',
      'question.png': '❓'
    };
    return icons[icon] || '📄';
  };

  return (
    <div className="post-list">
      {posts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          No posts yet. Create your first post!
        </div>
      ) : (
        posts.map(post => (
          <div 
            key={post._id}
            className="post-item"
            onDoubleClick={() => onOpenPost(post)}
          >
            <div className="post-icon">
              {getPostIcon(post.icon)}
            </div>
            <div className="post-info">
              <div className="post-title">{post.title}</div>
              <div className="post-meta">
                By {post.author.username} • {new Date(post.createdAt).toLocaleDateString()} • 
                <Heart size={10} style={{ margin: '0 2px' }} />
                {post.likes.length} • 
                <MessageCircle size={10} style={{ margin: '0 2px' }} />
                {post.comments.length}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
```jsx
// client/src/components/PostViewer.jsx
import React, { useState } from 'react';
import { Heart, MessageCircle, Send } from 'lucide-react';

const PostViewer = ({ post }) => {
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);

  const handleLike = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setLiked(!liked);
        setLikeCount(prev => liked ? prev - 1 : prev + 1);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${post._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment })
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setComments(updatedPost.comments);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Post Header */}
      <div style={{ 
        padding: '12px', 
        borderBottom: '1px solid var(--xp-border)',
        background: 'var(--xp-gray)'
      }}>
        <h2 style={{ fontSize: '14px', marginBottom: '8px' }}>{post.title}</h2>
        <div style={{ fontSize: '10px', color: '#666' }}>
          By {post.author.username} • {new Date(post.createdAt).toLocaleDateString()}
        </div>
        <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
          <button 
            className={`button ${liked ? 'primary' : ''}`}
            onClick={handleLike}
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <Heart size={12} />
            {likeCount}
          </button>
          <button 
            className="button"
            style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <MessageCircle size={12} />
            {comments.length}
          </button>
        </div>
      </div>

      {/* Post Content */}
      <div style={{ 
        padding: '12px', 
        flex: 1, 
        overflow: 'auto',
        borderBottom: '1px solid var(--xp-border)'
      }}>
        <div style={{ 
          whiteSpace: 'pre-wrap', 
          lineHeight: '1.4',
          fontSize: '11px'
        }}>
          {post.content}
        </div>
      </div>

      {/* Comments Section */}
      <div style={{ height: '200px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          flex: 1, 
          overflow: 'auto', 
          padding: '8px',
          borderBottom: '1px solid var(--xp-border)'
        }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', marginBottom: '8px' }}>
            Comments ({comments.length})
          </div>
          {comments.map((comment, index) => (
            <div key={index} style={{ 
              marginBottom: '8px', 
              padding: '6px',
              background: 'var(--xp-gray)',
              border: '1px solid var(--xp-border)'
            }}>
              <div style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>
                {comment.author.username}
              </div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>
                {new Date(comment.createdAt).toLocaleDateString()}
              </div>
              <div style={{ fontSize: '11px' }}>{comment.content}</div>
            </div>
          ))}
        </div>

        {/* Add Comment Form */}
        <form onSubmit={handleAddComment} style={{ padding: '8px', background: 'var(--xp-gray)' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              type="text"
              className="form-input"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              style={{ flex: 1 }}
            />
            <button type="submit" className="button primary">
              <Send size={12} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostViewer;
```

```jsx
// client/src/components/CreatePost.jsx
import React, { useState } from 'react';

const CreatePost = ({ onPostCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    icon: 'document.png'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const iconOptions = [
    { value: 'document.png', label: '📄 Document', emoji: '📄' },
    { value: 'image.png', label: '🖼️ Image', emoji: '🖼️' },
    { value: 'code.png', label: '💻 Code', emoji: '💻' },
    { value: 'idea.png', label: '💡 Idea', emoji: '💡' },
    { value: 'question.png', label: '❓ Question', emoji: '❓' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        })
      });

      if (response.ok) {
        onPostCreated();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to create post');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="form-group">
          <label>Title:</label>
          <input
            type="text"
            name="title"
            className="form-input"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Icon:</label>
          <select
            name="icon"
            className="form-input"
            value={formData.icon}
            onChange={handleChange}
          >
            {iconOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Tags (comma-separated):</label>
          <input
            type="text"
            name="tags"
            className="form-input"
            value={formData.tags}
            onChange={handleChange}
            placeholder="javascript, tutorial, beginner"
          />
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label>Content:</label>
          <textarea
            name="content"
            className="form-input"
            value={formData.content}
            onChange={handleChange}
            required
            style={{ 
              height: '100%', 
              minHeight: '150px',
              resize: 'none',
              fontFamily: 'monospace'
            }}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <button 
            type="submit" 
            className="button primary"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Post'}
          </button>
          <button 
            type="button" 
            className="button"
            onClick={() => setFormData({ title: '', content: '', tags: '', icon: 'document.png' })}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePost;
```

```jsx
// client/src/components/Login.jsx
import React, { useState } from 'react';

const Login = ({ onLogin, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        onLogin(data.user);
        onClose();
      } else {
        setError(data.message || 'Authentication failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '16px', textAlign: 'center' }}>
        <button 
          className={`button ${isLogin ? 'primary' : ''}`}
          onClick={() => setIsLogin(true)}
          style={{ marginRight: '8px' }}
        >
          Login
        </button>
        <button 
          className={`button ${!isLogin ? 'primary' : ''}`}
          onClick={() => setIsLogin(false)}
        >
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {!isLogin && (
          <div className="form-group">
            <label>Username:</label>
            <input
              type="text"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              required={!isLogin}
            />
          </div>
        )}

        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            name="email"
            className="form-input"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Password:</label>
          <input
            type="password"
            name="password"
            className="form-input"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button 
          type="submit" 
          className="button primary"
          disabled={loading}
          style={{ width: '100%' }}
        >
          {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
        </button>
      </form>
    </div>
  );
};

export default Login;
```

### Step 6: Create Main App Component

```jsx
// client/src/App.jsx
import React from 'react';
import Desktop from './components/Desktop';
import './styles/winxp.css';

function App() {
  return (
    <div className="App">
      <Desktop />
    </div>
  );
}

export default App;
```

### Step 7: Update Vite Configuration

```javascript
// client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
})
```

### Step 8: Update Package.json Scripts

```json
// client/package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

## Part 3: Running the Application

### Step 1: Set up Environment Variables

Create `.env` file in the server directory:
```
MONGODB_URI=mongodb://localhost:27017/winxp-forum
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
```

### Step 2: Start MongoDB
Make sure MongoDB is running on your system:
```bash
# If using MongoDB service
sudo service mongod start

# Or if using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 3: Start the Backend
```bash
cd server
npm run dev
```

### Step 4: Start the Frontend
```bash
cd client
npm run dev
```

## Part 4: Additional Features to Add

### Custom Icons
To add custom icons for different post types:

1. Create an `icons` folder in `client/public/`
2. Add your custom icon files (PNG format recommended)
3. Update the icon selection in `CreatePost.jsx`

### Database Indexing
Add indexes to improve performance:

```javascript
// Add to server.js after MongoDB connection
const Post = require('./models/Post');
const User = require('./models/User');

// Create indexes
Post.createIndex({ title: 'text', content: 'text' });
Post.createIndex({ createdAt: -1 });
Post.createIndex({ author: 1 });
User.createIndex({ username: 1 });
User.createIndex({ email: 1 });
```

### Search Functionality
Add search route to `server/routes/posts.js`:

```javascript
// Search posts
router.get('/search', async (req, res) => {
  try {
    const { q, tag } = req.query;
    let query = {};

    if (q) {
      query.$text = { $search: q };
    }

    if (tag) {
      query.tags = tag;
    }

    const posts = await Post.find(query)
      .populate('author', 'username avatar')
      .sort({ score: { $meta: 'textScore' } })
      .limit(20);

    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});
```

### File Upload Support
Add file upload functionality:

```bash
# Install multer for file uploads
cd server
npm install multer
```

```javascript
// server/middleware/upload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Images only!');
    }
  }
});

module.exports = upload;
```

## Part 5: Deployment

### Using Heroku

1. **Prepare for deployment:**
```bash
# In root directory
echo "node_modules" >> .gitignore
echo ".env" >> .gitignore
```

2. **Create Heroku app:**
```bash
heroku create your-app-name
heroku addons:create mongolab:sandbox
```

3. **Set environment variables:**
```bash
heroku config:set JWT_SECRET=your-secret-key
heroku config:set NODE_ENV=production
```

4. **Create Procfile:**
```
web: cd server && npm start
```

5. **Deploy:**
```bash
git add .
git commit -m "Initial commit"
git push heroku main
```

### Using Digital Ocean or VPS

1. **Install Node.js and MongoDB on server**
2. **Clone your repository**
3. **Install dependencies and build:**
```bash
cd server && npm install
cd ../client && npm install && npm run build
```
4. **Use PM2 for process management:**
```bash
npm install -g pm2
pm2 start server/server.js --name "winxp-forum"
pm2 startup
pm2 save
```

## Troubleshooting

### Common Issues:

1. **CORS errors:** Make sure your backend CORS configuration allows your frontend URL
2. **Database connection:** Verify MongoDB is running and connection string is correct
3. **Authentication issues:** Check JWT_SECRET is set and tokens are being sent correctly
4. **File upload errors:** Ensure uploads directory exists and has proper permissions

### Performance Tips:

1. **Use pagination for posts**
2. **Implement lazy loading for images**
3. **Add caching headers for static assets**
4. **Use MongoDB connection pooling**
5. **Implement proper error boundaries in React**

This complete guide should get you up and running with a Windows XP-styled forum/blog application. The interface mimics the classic Windows XP look with draggable windows, taskbar, and desktop icons, while providing modern web functionality underneath.