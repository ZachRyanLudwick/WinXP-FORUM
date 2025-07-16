# XPloitHUB - Cybersecurity Forum & Research Platform

A Windows XP-themed cybersecurity forum and research platform that combines nostalgic computing aesthetics with modern web technologies. Built for security researchers, ethical hackers, and cybersecurity enthusiasts.

## 🎯 Overview

XPloitHUB is a full-stack web application that recreates the classic Windows XP desktop experience while providing a modern platform for cybersecurity discussions, research sharing, and community building. The platform features both desktop and mobile interfaces, with the desktop version offering an immersive retro computing experience.

## ✨ Key Features

### Desktop Experience
- **Authentic Windows XP Interface** - Complete with draggable windows, taskbar, and classic styling
- **Multi-Window Management** - Open multiple posts, profiles, and tools simultaneously
- **Desktop Icons & Start Menu** - Navigate like a real Windows XP system
- **Windowed Applications** - Post viewer, profile manager, friends system, and more

### Content & Communication
- **Rich Text Posts** - Full markdown support with code blocks, images, and file attachments
- **Research File Sharing** - Upload and share security tools, documents, and research files
- **Threaded Comments** - Nested discussions with likes and replies
- **User Profiles** - Detailed profiles with karma system and activity tracking
- **Friends System** - Send friend requests, manage connections, and view friend activities

### Mobile Experience
- **Mobile-Optimized Interface** - Responsive design for smartphones and tablets
- **Touch-Friendly Navigation** - Bottom navigation bar with key features
- **Markdown Rendering** - Full support for formatted content on mobile
- **File Downloads** - Access and download research files on mobile devices

### Security & Moderation
- **User Authentication** - Secure JWT-based login system
- **Admin Controls** - Post pinning, user management, and content moderation
- **Rank System** - User progression based on community contributions
- **Bookmark System** - Save and organize important posts

## 🛠 Technology Stack

### Frontend
- **React 18** - Modern UI framework
- **Vite** - Fast build tool and development server
- **Lucide React** - Icon library
- **Custom CSS** - Authentic Windows XP styling

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - Authentication tokens
- **Multer** - File upload handling
- **bcryptjs** - Password hashing

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- MongoDB (local or cloud)
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd XP-BLOG
```

2. **Install backend dependencies**
```bash
cd winxp-forum/server
npm install
```

3. **Install frontend dependencies**
```bash
cd ../client
npm install
```

4. **Environment setup**
```bash
# In server directory, create .env file
cd ../server
echo "MONGODB_URI=mongodb://localhost:27017/winxp-forum
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000" > .env
```

5. **Start MongoDB**
```bash
# If using local MongoDB
sudo service mongod start

# Or with Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

6. **Run the application**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

7. **Access the application**
- Desktop: http://localhost:5173
- Mobile: Same URL on mobile device

## 📁 Project Structure

```
winxp-forum/
├── client/                 # React frontend
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Desktop.jsx       # Main desktop interface
│   │   │   ├── MobileApp.jsx     # Mobile interface
│   │   │   ├── PostViewer.jsx    # Post display component
│   │   │   ├── Window.jsx        # Draggable window component
│   │   │   └── XPPopup.jsx       # Windows XP-style popups
│   │   ├── styles/        # CSS stylesheets
│   │   │   └── winxp.css         # Windows XP theme
│   │   ├── utils/         # Utility functions
│   │   │   ├── api.js            # API communication
│   │   │   └── rankUtils.jsx     # User ranking system
│   │   └── App.jsx        # Main app component
│   ├── package.json
│   └── vite.config.js
├── server/                # Express.js backend
│   ├── models/           # MongoDB schemas
│   │   ├── User.js              # User model
│   │   └── Post.js              # Post model
│   ├── routes/           # API endpoints
│   │   ├── auth.js              # Authentication routes
│   │   ├── posts.js             # Post management
│   │   ├── profile.js           # User profiles
│   │   └── friends.js           # Friends system
│   ├── middleware/       # Express middleware
│   │   └── auth.js              # JWT authentication
│   ├── uploads/          # File storage
│   ├── package.json
│   └── server.js         # Main server file
└── README.md
```

## 🔧 Configuration

### Environment Variables

**Server (.env)**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/winxp-forum

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Server
PORT=5000
NODE_ENV=development

# File Upload (Optional)
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,txt,zip
```

### Database Configuration

The application automatically creates necessary indexes and collections. For production:

```javascript
// Add to server.js after MongoDB connection
const Post = require('./models/Post');
const User = require('./models/User');

// Create indexes for better performance
Post.createIndex({ title: 'text', content: 'text' });
Post.createIndex({ createdAt: -1 });
Post.createIndex({ author: 1 });
User.createIndex({ username: 1 });
User.createIndex({ email: 1 });
```

### Vite Configuration

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

## 📡 API Documentation

### Authentication Endpoints

**POST /api/auth/register**
```json
{
  "username": "string",
  "email": "string", 
  "password": "string"
}
```

**POST /api/auth/login**
```json
{
  "email": "string",
  "password": "string"
}
```

### Post Management

**GET /api/posts** - Get all posts
**GET /api/posts/community** - Get community posts
**GET /api/posts/:id** - Get specific post
**POST /api/posts** - Create new post (auth required)
**POST /api/posts/:id/like** - Like/unlike post (auth required)
**POST /api/posts/:id/comments** - Add comment (auth required)
**POST /api/posts/:id/bookmark** - Bookmark post (auth required)

### User Profiles

**GET /api/profile** - Get own profile (auth required)
**GET /api/profile/user/:id** - Get user profile
**GET /api/profile/search/:query** - Search users

### Friends System

**GET /api/friends** - Get friends list (auth required)
**GET /api/friends/requests** - Get friend requests (auth required)
**POST /api/friends/request** - Send friend request (auth required)
**POST /api/friends/accept/:id** - Accept friend request (auth required)
**DELETE /api/friends/:id** - Remove friend (auth required)

## 🎨 Customization

### Adding New Window Types

1. Create component in `client/src/components/`
2. Add to Desktop.jsx window rendering logic
3. Add desktop icon and taskbar integration

### Custom Themes

Modify `client/src/styles/winxp.css` CSS variables:
```css
:root {
  --xp-blue: #0054e3;
  --xp-gray: #ece9d8;
  --xp-border: #c0c0c0;
  /* Add custom colors */
}
```

### File Upload Configuration

Modify `server/middleware/upload.js` for custom file handling:
```javascript
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    // Custom file type validation
  }
});
```

## 🚀 Deployment

### Production Build

```bash
# Build frontend
cd client
npm run build

# The build files will be in client/dist/
```

### Environment Setup

**Production Environment Variables:**
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/winxp-forum
JWT_SECRET=production-secret-key
PORT=5000
```

### Deployment Options

**Heroku:**
```bash
heroku create your-app-name
heroku addons:create mongolab:sandbox
heroku config:set JWT_SECRET=your-secret
git push heroku main
```

**Digital Ocean/VPS:**
```bash
# Install dependencies
npm install -g pm2

# Start with PM2
pm2 start server/server.js --name "winxp-forum"
pm2 startup
pm2 save
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Follow existing code style and structure
- Test both desktop and mobile interfaces
- Ensure Windows XP theme consistency
- Add appropriate error handling
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Windows XP design inspiration from Microsoft
- React and Node.js communities
- MongoDB for database solutions
- All contributors and testers

---

**XPloitHUB** - Where nostalgia meets modern cybersecurity research.