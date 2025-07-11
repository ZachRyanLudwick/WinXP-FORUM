const express = require('express');
const { body, validationResult, param } = require('express-validator');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Get bookmarked posts (must be before /:id route)
router.get('/bookmarks', auth, async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.userId).populate({
            path: 'bookmarks',
            populate: { path: 'author', select: 'username avatar' }
        });
        res.json(user.bookmarks || []);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// get posts (admin posts only)
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find({ isCommunity: { $ne: true } })
            .populate('author', 'username avatar')
            .populate('comments.author', 'username avatar')
            .populate('comments.replies.author', 'username avatar');
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get community posts
router.get('/community', async (req, res) => {
    try {
        const posts = await Post.find({ isCommunity: true })
            .populate('author', 'username avatar')
            .populate('comments.author', 'username avatar');
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create community post (any user)
router.post('/community', [
    auth,
    body('title').isLength({ min: 1, max: 200 }).trim().escape(),
    body('content').isLength({ min: 1, max: 50000 }).trim(),
    body('category').optional().isLength({ max: 50 }).trim().escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    try {
        const { title, content, tags, category, icon } = req.body;

        const post = new Post({
            title,
            content,
            author: req.userId,
            tags: tags || [],
            category: category || 'general',
            icon: icon || 'community.png',
            isCommunity: true
        });

        await post.save();
        await post.populate('author', 'username avatar');

        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create post (admin creates regular post, non-admin creates community post)
router.post('/', [
    auth,
    body('title').isLength({ min: 1, max: 200 }).trim().escape(),
    body('content').isLength({ min: 1, max: 50000 }).trim(),
    body('category').optional().isLength({ max: 50 }).trim().escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    try {
        const { title, content, tags, category, icon, attachments } = req.body;
        const User = require('../models/User');
        const user = await User.findById(req.userId);

        const post = new Post({
            title,
            content,
            author: req.userId,
            tags: tags || [],
            category: category || 'general',
            icon: icon || (user.isAdmin ? 'document.png' : 'community.png'),
            attachments: user.isAdmin ? (attachments || []) : [],
            isCommunity: !user.isAdmin
        });

        await post.save();
        await post.populate('author', 'username avatar');

        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: 'server error' });
    }
});

// get single post
router.get('/:id', [
    param('id').isMongoId().withMessage('Invalid post ID')
], async (req,res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: 'Invalid post ID' });
    }
    try {
        const post = await Post.findById(req.params.id)
            .populate('author', 'username avatar')
            .populate('comments.author', 'username avatar')
            .populate('comments.replies.author', 'username avatar');

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'server error' });
    }
});

// add comment
router.post('/:id/comments', [
    auth,
    param('id').isMongoId(),
    body('content').isLength({ min: 1, max: 10000 }).trim()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ message: errors.array()[0].msg });
    }
    try {
        const { content } = req.body;
        const post = await Post.findById(req.params.id);

        if (!post){ 
            return res.status(404).json({ message: ' Post not found '});
        }

        post.comments.push({
            author: req.userId,
            content,
        });

        await post.save();
        await post.populate('comments.author', 'username avatar');
        await post.populate('comments.replies.author', 'username avatar');
        
        // Create notification for post author
        await global.createNotification(
            post.author,
            'comment',
            `commented on your post "${post.title}"`,
            req.userId,
            null,
            post._id
        );

        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'server error '});
    }
});

// like unlike

router.post('/:id/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if(!post) {
            return res.status(404).json({message: 'post not found'});
        }

        const likeIndex = post.likes.indexOf(req.userId);

        if (likeIndex > -1) {
            post.likes.splice(likeIndex, 1);
            // Remove notification when unliking
            await global.removeNotification(post.author, req.userId, 'like', post._id);
        } else {
            post.likes.push(req.userId);
            // Create notification for post author
            await global.createNotification(
                post.author,
                'like',
                `liked your post "${post.title}"`,
                req.userId,
                null,
                post._id
            );
        }

        await post.save();
        res.json(post);
    } catch (error) {
        return res.status(400).json({ message: 'Server Error' });
    }
});

// Bookmark/Unbookmark post
router.post('/:id/bookmark', auth, async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.userId);
        if (!user.bookmarks) user.bookmarks = [];

        const bookmarkIndex = user.bookmarks.indexOf(req.params.id);
        if (bookmarkIndex > -1) {
            user.bookmarks.splice(bookmarkIndex, 1);
        } else {
            user.bookmarks.push(req.params.id);
        }

        await user.save();
        res.json({ bookmarked: bookmarkIndex === -1 });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});



// Like/Unlike comment
router.post('/:id/comments/:commentId/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        
        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });
        
        const likeIndex = comment.likes.indexOf(req.userId);
        if (likeIndex > -1) {
            comment.likes.splice(likeIndex, 1);
            // Remove notification when unliking comment
            await global.removeNotification(comment.author, req.userId, 'like', post._id);
        } else {
            comment.likes.push(req.userId);
            // Create notification for comment author
            await global.createNotification(
                comment.author,
                'like',
                `liked your comment on "${post.title}"`,
                req.userId,
                null,
                post._id
            );
        }
        
        await post.save();
        await post.populate('comments.author', 'username avatar');
        await post.populate('comments.replies.author', 'username avatar');
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Reply to comment
router.post('/:id/comments/:commentId/reply', auth, async (req, res) => {
    try {
        const { content } = req.body;
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        
        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });
        
        comment.replies.push({
            author: req.userId,
            content
        });
        
        await post.save();
        await post.populate('comments.author', 'username avatar');
        await post.populate('comments.replies.author', 'username avatar');
        
        // Create notification for comment author
        await global.createNotification(
            comment.author,
            'reply',
            `replied to your comment on "${post.title}"`,
            req.userId,
            null,
            post._id
        );
        
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Like/Unlike reply
router.post('/:id/comments/:commentId/replies/:replyId/like', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ message: 'Post not found' });
        
        const comment = post.comments.id(req.params.commentId);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });
        
        const reply = comment.replies.id(req.params.replyId);
        if (!reply) return res.status(404).json({ message: 'Reply not found' });
        
        const likeIndex = reply.likes.indexOf(req.userId);
        if (likeIndex > -1) {
            reply.likes.splice(likeIndex, 1);
            await global.removeNotification(reply.author, req.userId, 'like', post._id);
        } else {
            reply.likes.push(req.userId);
            await global.createNotification(
                reply.author,
                'like',
                `liked your reply on "${post.title}"`,
                req.userId,
                null,
                post._id
            );
        }
        
        await post.save();
        await post.populate('comments.author', 'username avatar');
        await post.populate('comments.replies.author', 'username avatar');
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Pin/Unpin post (admin only)
router.post('/:id/pin', auth, async (req, res) => {
    try {
        const User = require('../models/User');
        const user = await User.findById(req.userId);
        if (!user.isAdmin) {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.pinned) {
            // Unpinning
            post.pinned = false;
        } else {
            // Pinning - first unpin any existing pinned post in the same section
            await Post.updateMany(
                { 
                    isCommunity: post.isCommunity,
                    pinned: true 
                },
                { pinned: false }
            );
            post.pinned = true;
        }
        
        await post.save();
        res.json({ pinned: post.pinned });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete post (admin or post owner)
router.delete('/:id', [
    auth,
    param('id').isMongoId()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }
        
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        const User = require('../models/User');
        const user = await User.findById(req.userId);
        
        // Only admin or post owner can delete
        if (!user.isAdmin && post.author.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;