const express = require('express');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user notifications
router.get('/', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.userId })
            .populate('sender', 'username')
            .sort({ createdAt: -1 })
            .limit(50);
        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark notification as read
router.post('/:id/read', auth, async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.userId },
            { read: true }
        );
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get notification settings
router.get('/settings', auth, async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.userId);
        res.json(user.notificationSettings || { likes: true, comments: true, replies: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update notification settings
router.put('/settings', auth, async (req, res) => {
    try {
        const User = require('../models/User');
        await User.findByIdAndUpdate(req.userId, {
            notificationSettings: req.body
        });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Clear all notifications
router.delete('/clear', auth, async (req, res) => {
    try {
        await Notification.deleteMany({ recipient: req.userId });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create notification (internal use)
const createNotification = async (recipientId, type, message, senderId = null, senderUsername = null, postId = null) => {
    try {
        if (senderId && recipientId.toString() === senderId.toString()) return; // Don't notify self
        
        // Check user notification preferences
        const User = require('../models/User');
        const recipient = await User.findById(recipientId);
        const settings = recipient.notificationSettings || { likes: true, comments: true, replies: true, messages: true };
        
        // Map notification types to settings
        const typeMap = {
            'like': 'likes',
            'comment': 'comments', 
            'reply': 'replies',
            'message': 'messages'
        };
        
        if (settings[typeMap[type]] === false) return; // User disabled this notification type
        
        const notification = new Notification({
            recipient: recipientId,
            sender: senderId,
            type,
            message,
            postId,
            senderId: senderId,
            senderUsername: senderUsername
        });
        await notification.save();
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

// Remove notification (internal use)
const removeNotification = async (recipientId, senderId, type, postId) => {
    try {
        await Notification.findOneAndDelete({
            recipient: recipientId,
            sender: senderId,
            type,
            postId
        });
    } catch (error) {
        console.error('Error removing notification:', error);
    }
};

module.exports = { router, createNotification, removeNotification };