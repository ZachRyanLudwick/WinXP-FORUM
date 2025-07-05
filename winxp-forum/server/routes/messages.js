const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ message: 'Messages API working' });
});

// Get conversations (must come before /:userId)
router.get('/conversations', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId },
        { recipient: req.userId }
      ]
    }).populate('sender recipient', 'username').sort({ createdAt: -1 });
    
    if (messages.length === 0) {
      return res.json([]);
    }
    
    const conversationMap = {};
    
    for (const message of messages) {
      const isFromMe = message.sender._id.toString() === req.userId;
      const partnerId = isFromMe ? message.recipient._id.toString() : message.sender._id.toString();
      
      if (!conversationMap[partnerId]) {
        const partnerUser = isFromMe ? message.recipient : message.sender;
        
        conversationMap[partnerId] = {
          _id: partnerId,
          otherUser: {
            _id: partnerUser._id,
            username: partnerUser.username
          },
          lastMessage: message,
          unreadCount: 0
        };
      }
    }
    
    for (const partnerId in conversationMap) {
      const unreadCount = await Message.countDocuments({
        sender: partnerId,
        recipient: req.userId,
        read: false
      });
      conversationMap[partnerId].unreadCount = unreadCount;
    }
    
    const conversations = Object.values(conversationMap);
    res.json(conversations);
  } catch (error) {
    console.error('Conversations error:', error);
    res.json([]);
  }
});

// Get unread message count (must come before /:userId)
router.get('/unread-count', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      recipient: req.userId,
      read: false
    });
    res.json({ count });
  } catch (error) {
    console.error('Unread count error:', error);
    res.json({ count: 0 });
  }
});

// Send message
router.post('/', auth, async (req, res) => {
  try {
    const { recipientId, content } = req.body;

    // Prevent self-messaging
    if (req.userId === recipientId) {
      return res.status(400).json({ message: 'Cannot send message to yourself' });
    }

    // Check if recipient allows DMs
    const User = require('../models/User');
    const recipient = await User.findById(recipientId);
    
    if (!recipient) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If general DMs are disabled, check friend-only setting
    if (!recipient.dmSettings?.allowDMs) {
      // If friend DMs are also disabled, block all messages
      if (!recipient.dmSettings?.allowDMsFromFriends) {
        return res.status(403).json({ message: 'This user has disabled direct messages' });
      }
      
      // Check if they are friends
      const Friendship = require('../models/Friendship');
      const friendship = await Friendship.findOne({
        $or: [
          { requester: req.userId, recipient: recipientId, status: 'accepted' },
          { requester: recipientId, recipient: req.userId, status: 'accepted' }
        ]
      });
      
      if (!friendship) {
        return res.status(403).json({ message: 'This user has disabled direct messages' });
      }
    }

    const message = new Message({
      sender: req.userId,
      recipient: recipientId,
      content,
    });

    await message.save();
    await message.populate('sender', 'username');
    await message.populate('recipient', 'username');

    // Create notification for recipient
    if (global.createNotification) {
      await global.createNotification(
        recipientId,
        'message',
        `New message from ${message.sender.username}`,
        req.userId,
        message.sender.username
      );
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages with specific user (must come after specific routes)
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: userId },
        { sender: userId, recipient: req.userId }
      ]
    })
    .populate('sender', 'username')
    .populate('recipient', 'username')
    .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.post('/:userId/read', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    await Message.updateMany(
      {
        sender: userId,
        recipient: req.userId,
        read: false
      },
      { read: true }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;