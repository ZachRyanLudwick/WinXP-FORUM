const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  size: {
    type: Number,
    default: 0,
  },
  type: {
    type: String,
    default: 'text/plain',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('File', fileSchema);