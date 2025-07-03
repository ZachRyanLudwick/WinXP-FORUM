const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tags: [{
        type: String,
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    comments: [{
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        content: String,
        createdAt: {
            type: Date,
            default: Date.now,
        },
    }],
    icon: {
        type: String,
        default: 'document.png'
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Post', postSchema);