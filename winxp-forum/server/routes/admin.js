const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const adminAuth = require('../middleware/adminAuth');
const router = express.Router();

// Get admin dashboard stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [userCount, postCount, todayUsers, todayPosts] = await Promise.all([
      User.countDocuments(),
      Post.countDocuments(),
      User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) } }),
      Post.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) } })
    ]);

    const recentActivity = await Post.find()
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      totalUsers: userCount,
      totalPosts: postCount,
      todayUsers,
      todayPosts,
      recentActivity
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users with pagination
router.get('/users', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = search ? {
      $or: [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle user admin status
router.put('/users/:id/admin', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isAdmin = !user.isAdmin;
    await user.save();

    res.json({ message: `User ${user.isAdmin ? 'promoted to' : 'demoted from'} admin`, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Ban/unban user
router.put('/users/:id/ban', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isBanned = !user.isBanned;
    await user.save();

    res.json({ message: `User ${user.isBanned ? 'banned' : 'unbanned'}`, user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user
router.delete('/users/:id', adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Delete user's posts
    await Post.deleteMany({ author: req.params.id });
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'User and their posts deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all posts with pagination
router.get('/posts', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const query = search ? {
      $or: [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ]
    } : {};

    const posts = await Post.find(query)
      .populate('author', 'username')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Post.countDocuments(query);

    res.json({
      posts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete post
router.delete('/posts/:id', adminAuth, async (req, res) => {
  try {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// System settings
router.get('/settings', adminAuth, async (req, res) => {
  try {
    // Return current system settings (you can store these in DB)
    res.json({
      siteName: 'WinXP Forum',
      allowRegistration: true,
      requireEmailVerification: false,
      maxFileSize: 5242880, // 5MB
      allowedFileTypes: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt']
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;