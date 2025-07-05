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
        replies: { type: Boolean, default: true },
        messages: { type: Boolean, default: true }
    },
    dmSettings: {
        allowDMs: { type: Boolean, default: true },
        allowDMsFromFriends: { type: Boolean, default: true }
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    isBanned: {
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
    karma: {
        postLikes: { type: Number, default: 0 },
        commentLikes: { type: Number, default: 0 },
        replyLikes: { type: Number, default: 0 },
        postsCreated: { type: Number, default: 0 },
        commentsCreated: { type: Number, default: 0 },
        repliesCreated: { type: Number, default: 0 }
    },
    rank: {
        type: String,
        enum: ['Newbie', 'Member', 'Expert', 'Elite', 'Legend'],
        default: 'Newbie'
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('User', userSchema);