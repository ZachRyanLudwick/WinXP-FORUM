const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { createNotification, removeNotification } = require('./routes/notifications');

// Make notification functions globally available
global.createNotification = createNotification;
global.removeNotification = removeNotification;

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());

// mongodb connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
});

mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.log('MongoDB connection error:', err);
});

// Static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/files', require('./routes/files'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/notifications', require('./routes/notifications').router);
app.use('/api/user', require('./routes/user'));

app.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
});