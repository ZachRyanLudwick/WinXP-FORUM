const express = require('express');
const Friendship = require('../models/Friendship');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Send friend request
router.post('/request', auth, async (req, res) => {
  try {
    const { recipientId } = req.body;

    if (req.userId === recipientId) {
      return res.status(400).json({ message: 'Cannot send friend request to yourself' });
    }

    // Check if friendship already exists
    const existingFriendship = await Friendship.findOne({
      $or: [
        { requester: req.userId, recipient: recipientId },
        { requester: recipientId, recipient: req.userId }
      ]
    });

    if (existingFriendship) {
      return res.status(400).json({ message: 'Friend request already exists' });
    }

    const friendship = new Friendship({
      requester: req.userId,
      recipient: recipientId,
    });

    await friendship.save();
    await friendship.populate('requester recipient', 'username');

    // Create notification
    if (global.createNotification) {
      await global.createNotification(
        recipientId,
        'friend_request',
        `${friendship.requester.username} sent you a friend request`,
        req.userId,
        friendship.requester.username
      );
    }

    res.status(201).json(friendship);
  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept friend request
router.post('/accept/:friendshipId', auth, async (req, res) => {
  try {
    const friendship = await Friendship.findById(req.params.friendshipId);

    if (!friendship || friendship.recipient.toString() !== req.userId) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    friendship.status = 'accepted';
    await friendship.save();
    await friendship.populate('requester recipient', 'username');

    // Create notification for requester
    if (global.createNotification) {
      await global.createNotification(
        friendship.requester._id,
        'friend_accepted',
        `${friendship.recipient.username} accepted your friend request`,
        req.userId,
        friendship.recipient.username
      );
    }

    res.json(friendship);
  } catch (error) {
    console.error('Accept friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Decline friend request
router.post('/decline/:friendshipId', auth, async (req, res) => {
  try {
    const friendship = await Friendship.findById(req.params.friendshipId);

    if (!friendship || friendship.recipient.toString() !== req.userId) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    friendship.status = 'declined';
    await friendship.save();

    res.json({ message: 'Friend request declined' });
  } catch (error) {
    console.error('Decline friend request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get friends list
router.get('/', auth, async (req, res) => {
  try {
    const friendships = await Friendship.find({
      $or: [
        { requester: req.userId, status: 'accepted' },
        { recipient: req.userId, status: 'accepted' }
      ]
    }).populate('requester recipient', 'username');

    const friends = friendships.map(friendship => {
      const friend = friendship.requester._id.toString() === req.userId ? 
        friendship.recipient : friendship.requester;
      return {
        _id: friend._id,
        username: friend.username,
        friendshipId: friendship._id
      };
    });

    res.json(friends);
  } catch (error) {
    console.error('Get friends error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get pending friend requests
router.get('/requests', auth, async (req, res) => {
  try {
    const requests = await Friendship.find({
      recipient: req.userId,
      status: 'pending'
    }).populate('requester', 'username');

    res.json(requests);
  } catch (error) {
    console.error('Get friend requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove friend
router.delete('/:friendshipId', auth, async (req, res) => {
  try {
    const friendship = await Friendship.findById(req.params.friendshipId);

    if (!friendship) {
      return res.status(404).json({ message: 'Friendship not found' });
    }

    // Check if user is part of this friendship
    if (friendship.requester.toString() !== req.userId && 
        friendship.recipient.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Friendship.findByIdAndDelete(req.params.friendshipId);
    res.json({ message: 'Friend removed' });
  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;