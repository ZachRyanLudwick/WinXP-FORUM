const express = require('express');
const Post = require('../models/Post');
const auth = require('../middleware/auth');

const router = express.Router();

// get posts
router.get('/', async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'username avatar')
            .populate('comments.author', 'username avatar')
            .sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create post
router.post('/', auth, async (req, res) => {
    try {
        const { title, content, tags, icon } = req.body;

        const post = new Post({
            title,
            content,
            author: req.userId,
            tags: tags || [],
            icon: icon || 'document.png',
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
            .populate('comments.author', 'username avatar');

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
        } else {
            post.likes.push(req.userId);
        }

        await post.save();
        res.json(post);
    } catch (error) {
        return res.status(400).json({ message: 'Server Error' });
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