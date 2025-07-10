const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const rateLimit = require('express-rate-limit');

const xss = require('xss');
const hpp = require('hpp');
// const mongoSanitize = require('express-mongo-sanitize');
// const { validateInput } = require('./middleware/validation');
require('dotenv').config();
const { createNotification, removeNotification } = require('./routes/notifications');

// Make notification functions globally available
global.createNotification = createNotification;
global.removeNotification = removeNotification;

const app = express();

// Trust proxy for X-Forwarded-For headers (nginx/cloudflare)
app.set('trust proxy', true);

const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Static files - serve uploads directory FIRST
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
  }
}));

// CORS configuration
app.use(cors({
  origin: CORS_ORIGIN.split(',').map(url => url.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP'
});
app.use(limiter);

// Prevent HTTP Parameter Pollution
// app.use(hpp());

// Prevent NoSQL injection attacks - disabled for Express 5 compatibility
// app.use(mongoSanitize());



// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// XSS sanitization middleware
app.use((req, res, next) => {
  if (req.body) {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
});

// mongodb connection
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.log('MongoDB connection error:', err);
});



// API rate limiting for sensitive routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 attempts per 15 minutes
  message: 'Too many authentication attempts'
});

// Global validation middleware - disabled temporarily
// app.use('/api', validateInput);

// Routes
app.use('/api/auth', authLimiter, require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/files', require('./routes/files'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/notifications', require('./routes/notifications').router);
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/download', require('./routes/download'));

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Client URL: ${CLIENT_URL}`);
    console.log(`CORS Origin: ${CORS_ORIGIN}`);
});