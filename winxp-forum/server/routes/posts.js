const express = require('express');
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

// get posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'username avatar')
            .populate('comments.author', 'username avatar')
            .populate('comments.replies.author', 'username avatar')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create post (admin only)
router.post('/', adminAuth, async (req, res) => {
    try {
        const { title, content, tags, category, icon, attachments } = req.body;

        const post = new Post({
            title,
            content,
            author: req.userId,
            tags: tags || [],
            category: category || 'general',
            icon: icon || 'document.png',
            attachments: attachments || [],
        });

        await post.save();
        await post.populate('author', 'username avatar');

        res.status(201).json(post);
    } catch (error) {
        res.status(500).json({ message: 'server error' });
    }
});

// get single post
router.get('/:id', async (req,res) => {
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

router.post('/:id/comments', auth, async (req, res) => {
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
            req.userId,
            'comment',
            `commented on your post "${post.title}"`,
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
                req.userId,
                'like',
                `liked your post "${post.title}"`,
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
                req.userId,
                'like',
                `liked your comment on "${post.title}"`,
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
            req.userId,
            'reply',
            `replied to your comment on "${post.title}"`,
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
                req.userId,
                'like',
                `liked your reply on "${post.title}"`,
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

// Delete post (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }
        
        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;