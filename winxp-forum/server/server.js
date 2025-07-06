const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const xss = require('xss');
const hpp = require('hpp');
require('dotenv').config();
const { createNotification, removeNotification } = require('./routes/notifications');

// Make notification functions globally available
global.createNotification = createNotification;
global.removeNotification = removeNotification;

const app = express();
const PORT = process.env.PORT || 5001;

// Temporarily disabled security for development

// CORS configuration for development
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Temporarily disabled sanitization for development

// mongodb connection
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.log('MongoDB connection error:', err);
});

// Static files
// Removed direct static serving - now handled by download route

// Routes without rate limiting
app.use('/api/auth', require('./routes/auth'));
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
    console.log(`server running on ${PORT}`);
});