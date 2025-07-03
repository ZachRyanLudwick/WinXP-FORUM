# Windows XP Desktop App Development Guide

## Overview
This guide shows you how to create new desktop applications for your Windows XP forum system. Each app is a React component that runs in a draggable window.

## App Structure

### 1. Create the App Component
Create a new file in `client/src/components/YourApp.jsx`:

```jsx
import React, { useState, useEffect } from 'react';

const YourApp = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/yourroute', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      setData(result);
      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="your-app">
      <h3>🎯 Your App Title</h3>
      {/* Your app content here */}
    </div>
  );
};

export default YourApp;
```

### 2. Add App to Desktop
Edit `client/src/components/Desktop.jsx`:

**Import your component:**
```jsx
import YourApp from './YourApp';
```

**Add window case in renderWindow():**
```jsx
case 'yourapp':
  return (
    <Window 
      key={id}
      {...windowProps}
      title="Your App Name"
      icon="🎯"
      initialSize={{ width: 400, height: 300 }}
    >
      <YourApp />
    </Window>
  );
```

**Add desktop icon:**
```jsx
{/* For all users */}
<div 
  className="desktop-icon"
  style={{ top: 260, left: 20 }}
  onDoubleClick={() => openWindow('yourapp')}
>
  <div className="icon-image">🎯</div>
  <span>Your App</span>
</div>

{/* For logged in users only */}
{user && (
  <div 
    className="desktop-icon"
    style={{ top: 260, left: 20 }}
    onDoubleClick={() => openWindow('yourapp')}
  >
    <div className="icon-image">🎯</div>
    <span>Your App</span>
  </div>
)}

{/* For admin users only */}
{user?.isAdmin && (
  <div 
    className="desktop-icon"
    style={{ top: 260, left: 20 }}
    onDoubleClick={() => openWindow('yourapp')}
  >
    <div className="icon-image">🎯</div>
    <span>Admin App</span>
  </div>
)}
```

**Add taskbar item:**
```jsx
{window.type === 'yourapp' && '🎯 Your App'}
```

## API Routes Setup

### 1. Create Route File
Create `server/routes/yourroute.js`:

```javascript
const express = require('express');
const auth = require('../middleware/auth');
const YourModel = require('../models/YourModel'); // If using database

const router = express.Router();

// Public route (no auth needed)
router.get('/public', async (req, res) => {
  try {
    const data = await YourModel.find();
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Protected route (auth required)
router.get('/', auth, async (req, res) => {
  try {
    const data = await YourModel.find({ user: req.userId });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create data (auth required)
router.post('/', auth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const newItem = new YourModel({
      title,
      content,
      user: req.userId
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin only route
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin (add this check)
    const user = await User.findById(req.userId);
    if (!user.isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    await YourModel.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
```

### 2. Register Route in Server
Edit `server/server.js`:

```javascript
app.use('/api/yourroute', require('./routes/yourroute'));
```

## Database Models (Optional)

Create `server/models/YourModel.js`:

```javascript
const mongoose = require('mongoose');

const yourSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('YourModel', yourSchema);
```

## Authentication Patterns

### Frontend Auth Checks
```jsx
// Check if user is logged in
const [user, setUser] = useState(null);

// Get user from localStorage token
useEffect(() => {
  const token = localStorage.getItem('token');
  if (token) {
    fetch('http://localhost:5001/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setUser(data.user));
  }
}, []);

// Conditional rendering
{user ? <LoggedInContent /> : <LoginPrompt />}
{user?.isAdmin && <AdminContent />}
```

### API Call Patterns
```jsx
// GET request
const fetchData = async () => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5001/api/yourroute', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await response.json();
  return data;
};

// POST request
const createData = async (formData) => {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5001/api/yourroute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(formData)
  });
  return response.json();
};

// DELETE request
const deleteData = async (id) => {
  const token = localStorage.getItem('token');
  await fetch(`http://localhost:5001/api/yourroute/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
};
```

## User Permission Levels

### 1. Public (No Auth)
- Anyone can access
- No token required
- Use for public content

### 2. Logged In Users
- Requires valid JWT token
- Access user-specific data
- Can create/edit own content

### 3. Admin Users
- Requires `isAdmin: true` in user model
- Can manage all content
- Access admin-only features

## CSS Styling

Add styles to `client/src/styles/winxp.css`:

```css
.your-app {
  padding: 8px;
}

.your-app h3 {
  font-size: 12px;
  margin-bottom: 12px;
  color: var(--xp-blue);
}

.your-app-item {
  background: var(--xp-white);
  border: 1px solid var(--xp-border);
  padding: 8px;
  margin-bottom: 4px;
}

.your-app-button {
  background: var(--xp-gray);
  border: 1px solid;
  border-color: var(--xp-white) var(--xp-shadow) var(--xp-shadow) var(--xp-white);
  padding: 4px 12px;
  cursor: pointer;
  font-size: 11px;
}
```

## Example: Creating a "Calculator" App

### 1. Component (`Calculator.jsx`)
```jsx
import React, { useState } from 'react';

const Calculator = () => {
  const [display, setDisplay] = useState('0');
  const [operation, setOperation] = useState(null);
  const [previousValue, setPreviousValue] = useState(null);

  const inputNumber = (num) => {
    setDisplay(display === '0' ? num : display + num);
  };

  const calculate = () => {
    const current = parseFloat(display);
    const previous = parseFloat(previousValue);
    
    switch (operation) {
      case '+': setDisplay((previous + current).toString()); break;
      case '-': setDisplay((previous - current).toString()); break;
      case '*': setDisplay((previous * current).toString()); break;
      case '/': setDisplay((previous / current).toString()); break;
    }
    
    setOperation(null);
    setPreviousValue(null);
  };

  return (
    <div className="calculator">
      <div className="calc-display">{display}</div>
      <div className="calc-buttons">
        {[1,2,3,4,5,6,7,8,9,0].map(num => (
          <button key={num} onClick={() => inputNumber(num.toString())}>
            {num}
          </button>
        ))}
        <button onClick={() => { setOperation('+'); setPreviousValue(display); setDisplay('0'); }}>+</button>
        <button onClick={calculate}>=</button>
      </div>
    </div>
  );
};

export default Calculator;
```

### 2. Add to Desktop
```jsx
// In Desktop.jsx
case 'calculator':
  return (
    <Window 
      key={id}
      {...windowProps}
      title="Calculator"
      icon="🧮"
      initialSize={{ width: 200, height: 250 }}
    >
      <Calculator />
    </Window>
  );

// Desktop icon
<div 
  className="desktop-icon"
  style={{ top: 20, left: 100 }}
  onDoubleClick={() => openWindow('calculator')}
>
  <div className="icon-image">🧮</div>
  <span>Calculator</span>
</div>
```

## Quick Reference

### Desktop Icon Positions
- `{ top: 20, left: 20 }` - Top left
- `{ top: 100, left: 20 }` - Below first icon
- `{ top: 20, left: 100 }` - Right of first icon

### Window Sizes
- Small: `{ width: 300, height: 200 }`
- Medium: `{ width: 500, height: 400 }`
- Large: `{ width: 700, height: 500 }`

### Common Icons
- 📝 Posts, 🔐 Login, ✏️ Create, 🛠️ Admin
- 🧮 Calculator, 📊 Charts, 🎮 Games
- 📁 Files, ⚙️ Settings, 📧 Mail

## App Window Content Examples

### Forum-Style Layouts

#### Thread List Layout
```jsx
const ForumApp = () => {
  const [threads, setThreads] = useState([]);

  return (
    <div className="forum-app">
      <div className="forum-header">
        <h3>💬 Forum Threads</h3>
        <button className="button primary">New Thread</button>
      </div>
      
      <div className="thread-list">
        {threads.map(thread => (
          <div key={thread.id} className="thread-item">
            <div className="thread-icon">💬</div>
            <div className="thread-info">
              <div className="thread-title">{thread.title}</div>
              <div className="thread-meta">
                by {thread.author} • {thread.replies} replies • {thread.lastPost}
              </div>
            </div>
            <div className="thread-stats">
              <div>{thread.views} views</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

#### Chat/Message Layout
```jsx
const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  return (
    <div className="chat-app">
      <div className="chat-header">
        <span>💬 Live Chat</span>
        <span className="user-count">5 users online</span>
      </div>
      
      <div className="chat-messages">
        {messages.map(msg => (
          <div key={msg.id} className="chat-message">
            <span className="chat-user">{msg.user}:</span>
            <span className="chat-text">{msg.text}</span>
            <span className="chat-time">{msg.time}</span>
          </div>
        ))}
      </div>
      
      <div className="chat-input">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="form-input"
        />
        <button className="button primary">Send</button>
      </div>
    </div>
  );
};
```

### Common UI Components

#### Tabs Layout
```jsx
const TabbedApp = () => {
  const [activeTab, setActiveTab] = useState('tab1');

  return (
    <div className="tabbed-app">
      <div className="tab-header">
        <button 
          className={`tab-button ${activeTab === 'tab1' ? 'active' : ''}`}
          onClick={() => setActiveTab('tab1')}
        >
          📝 Posts
        </button>
        <button 
          className={`tab-button ${activeTab === 'tab2' ? 'active' : ''}`}
          onClick={() => setActiveTab('tab2')}
        >
          👥 Users
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'tab1' && <PostsContent />}
        {activeTab === 'tab2' && <UsersContent />}
      </div>
    </div>
  );
};
```

#### Data Table Layout
```jsx
const TableApp = () => {
  const [data, setData] = useState([]);
  const [sortBy, setSortBy] = useState('name');

  return (
    <div className="table-app">
      <div className="table-header">
        <h3>📊 Data Table</h3>
        <input 
          type="text" 
          placeholder="Search..." 
          className="form-input search-input"
        />
      </div>
      
      <div className="data-table">
        <div className="table-row table-header-row">
          <div className="table-cell" onClick={() => setSortBy('name')}>Name ↕️</div>
          <div className="table-cell" onClick={() => setSortBy('date')}>Date ↕️</div>
          <div className="table-cell">Actions</div>
        </div>
        
        {data.map(item => (
          <div key={item.id} className="table-row">
            <div className="table-cell">{item.name}</div>
            <div className="table-cell">{item.date}</div>
            <div className="table-cell">
              <button className="button small">Edit</button>
              <button className="button small danger">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

#### Form Layout
```jsx
const FormApp = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    content: '',
    tags: []
  });

  return (
    <div className="form-app">
      <div className="form-header">
        <h3>📝 Create New Item</h3>
      </div>
      
      <form className="app-form">
        <div className="form-row">
          <div className="form-group half">
            <label>Title</label>
            <input 
              type="text" 
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div className="form-group half">
            <label>Category</label>
            <select className="form-input">
              <option>General</option>
              <option>Tech</option>
              <option>Gaming</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Content</label>
          <textarea 
            className="form-input"
            rows="6"
            value={formData.content}
            onChange={(e) => setFormData({...formData, content: e.target.value})}
          />
        </div>
        
        <div className="form-group">
          <label>Tags</label>
          <input 
            type="text" 
            className="form-input"
            placeholder="Separate with commas"
          />
        </div>
        
        <div className="form-actions">
          <button type="submit" className="button primary">Create</button>
          <button type="button" className="button">Cancel</button>
        </div>
      </form>
    </div>
  );
};
```

#### Card Grid Layout
```jsx
const CardApp = () => {
  const [items, setItems] = useState([]);

  return (
    <div className="card-app">
      <div className="card-header">
        <h3>🎴 Card Gallery</h3>
        <div className="view-controls">
          <button className="button small">Grid</button>
          <button className="button small">List</button>
        </div>
      </div>
      
      <div className="card-grid">
        {items.map(item => (
          <div key={item.id} className="card">
            <div className="card-icon">{item.icon}</div>
            <div className="card-title">{item.title}</div>
            <div className="card-description">{item.description}</div>
            <div className="card-actions">
              <button className="button small">View</button>
              <button className="button small">Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### CSS for App Layouts

Add these styles to `winxp.css`:

```css
/* Forum Layouts */
.forum-header, .chat-header, .table-header, .form-header, .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid var(--xp-border);
  margin-bottom: 8px;
}

.thread-list, .chat-messages {
  max-height: 300px;
  overflow-y: auto;
  border: 1px inset var(--xp-border);
  background: var(--xp-white);
}

.thread-item, .chat-message {
  display: flex;
  align-items: center;
  padding: 6px;
  border-bottom: 1px solid #eee;
}

.thread-item:hover {
  background: #e6f3ff;
}

/* Tab Layout */
.tab-header {
  display: flex;
  border-bottom: 1px solid var(--xp-border);
}

.tab-button {
  background: var(--xp-gray);
  border: 1px solid var(--xp-border);
  border-bottom: none;
  padding: 4px 12px;
  cursor: pointer;
  font-size: 11px;
}

.tab-button.active {
  background: var(--xp-white);
  border-bottom: 1px solid var(--xp-white);
  margin-bottom: -1px;
}

.tab-content {
  padding: 8px;
  background: var(--xp-white);
  border: 1px solid var(--xp-border);
  border-top: none;
}

/* Table Layout */
.data-table {
  border: 1px solid var(--xp-border);
  background: var(--xp-white);
}

.table-row {
  display: flex;
  border-bottom: 1px solid #eee;
}

.table-header-row {
  background: var(--xp-gray);
  font-weight: bold;
}

.table-cell {
  flex: 1;
  padding: 6px;
  border-right: 1px solid #eee;
}

.table-cell:last-child {
  border-right: none;
}

/* Form Layout */
.form-row {
  display: flex;
  gap: 8px;
}

.form-group.half {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--xp-border);
}

/* Card Layout */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
  padding: 8px;
}

.card {
  background: var(--xp-white);
  border: 1px solid var(--xp-border);
  padding: 8px;
  text-align: center;
}

.card:hover {
  background: #f0f0f0;
}

.card-icon {
  font-size: 24px;
  margin-bottom: 4px;
}

.card-title {
  font-weight: bold;
  font-size: 11px;
  margin-bottom: 4px;
}

.card-description {
  font-size: 10px;
  color: #666;
  margin-bottom: 8px;
}

.card-actions {
  display: flex;
  gap: 4px;
  justify-content: center;
}

/* Utility Classes */
.button.small {
  padding: 2px 6px;
  font-size: 10px;
}

.button.danger {
  background: var(--xp-red);
  color: white;
}

.search-input {
  width: 200px;
}

.user-count {
  font-size: 10px;
  color: #666;
}

.chat-input {
  display: flex;
  gap: 4px;
  padding: 8px;
  border-top: 1px solid var(--xp-border);
}

.chat-input input {
  flex: 1;
}
```

### Interactive Elements

#### Dropdown Menu
```jsx
const [showMenu, setShowMenu] = useState(false);

<div className="dropdown">
  <button onClick={() => setShowMenu(!showMenu)}>Menu ▼</button>
  {showMenu && (
    <div className="dropdown-menu">
      <div className="dropdown-item">Option 1</div>
      <div className="dropdown-item">Option 2</div>
    </div>
  )}
</div>
```

#### Modal Dialog
```jsx
const [showModal, setShowModal] = useState(false);

{showModal && (
  <div className="modal-overlay">
    <div className="modal">
      <div className="modal-header">
        <span>Dialog Title</span>
        <button onClick={() => setShowModal(false)}>×</button>
      </div>
      <div className="modal-content">
        Modal content here
      </div>
    </div>
  </div>
)}
```

#### Progress Bar
```jsx
const [progress, setProgress] = useState(45);

<div className="progress-bar">
  <div className="progress-fill" style={{width: `${progress}%`}}></div>
  <span className="progress-text">{progress}%</span>
</div>
```

This system allows you to create unlimited desktop applications with proper authentication, API integration, and Windows XP styling.