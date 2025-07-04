const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        default: 'default-avatar.png',
    },
    notificationSettings: {
        likes: { type: Boolean, default: true },
        comments: { type: Boolean, default: true },
        replies: { type: Boolean, default: true }
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    bookmarks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
    }],
    iconPositions: {
        type: Object,
        default: {}
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', userSchema);