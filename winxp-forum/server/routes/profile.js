const express = require('express');
const User = require('../models/User');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user profile with stats
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's posts
    const posts = await Post.find({ author: userId })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 });

    // Calculate karma
    let postLikes = 0;
    let commentLikes = 0;
    let replyLikes = 0;
    let totalComments = 0;
    let totalReplies = 0;

    posts.forEach(post => {
      postLikes += post.likes.length;
      post.comments.forEach(comment => {
        if (comment.author.toString() === userId) {
          totalComments++;
          commentLikes += comment.likes.length;
        }
        comment.replies.forEach(reply => {
          if (reply.author.toString() === userId) {
            totalReplies++;
            replyLikes += reply.likes.length;
          }
        });
      });
    });

    // Update user karma
    await User.findByIdAndUpdate(userId, {
      karma: {
        postLikes,
        commentLikes,
        replyLikes,
        postsCreated: posts.length,
        commentsCreated: totalComments,
        repliesCreated: totalReplies
      }
    });

    const totalKarma = postLikes + commentLikes + replyLikes;

    res.json({
      user,
      posts,
      stats: {
        totalKarma,
        postLikes,
        commentLikes,
        replyLikes,
        postsCreated: posts.length,
        commentsCreated: totalComments,
        repliesCreated: totalReplies
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific user profile
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's posts
    const posts = await Post.find({ author: userId })
      .populate('author', 'username avatar')
      .sort({ createdAt: -1 });

    // Calculate karma
    let postLikes = 0;
    let commentLikes = 0;
    let replyLikes = 0;
    let totalComments = 0;
    let totalReplies = 0;

    posts.forEach(post => {
      postLikes += post.likes.length;
      post.comments.forEach(comment => {
        if (comment.author.toString() === userId) {
          totalComments++;
          commentLikes += comment.likes.length;
        }
        comment.replies.forEach(reply => {
          if (reply.author.toString() === userId) {
            totalReplies++;
            replyLikes += reply.likes.length;
          }
        });
      });
    });

    // Update user karma
    await User.findByIdAndUpdate(userId, {
      karma: {
        postLikes,
        commentLikes,
        replyLikes,
        postsCreated: posts.length,
        commentsCreated: totalComments,
        repliesCreated: totalReplies
      }
    });

    const totalKarma = postLikes + commentLikes + replyLikes;

    res.json({
      user,
      posts,
      stats: {
        totalKarma,
        postLikes,
        commentLikes,
        replyLikes,
        postsCreated: posts.length,
        commentsCreated: totalComments,
        repliesCreated: totalReplies
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users
router.get('/search/:query', auth, async (req, res) => {
  try {
    const { query } = req.params;
    
    const users = await User.find({
      username: { $regex: query, $options: 'i' }
    }).select('username avatar isAdmin createdAt').limit(10);
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;