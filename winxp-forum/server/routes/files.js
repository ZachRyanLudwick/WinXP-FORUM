const express = require('express');
const File = require('../models/File');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user files
router.get('/', auth, async (req, res) => {
  try {
    const files = await File.find({ owner: req.userId }).sort({ updatedAt: -1 });
    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create/Save file
router.post('/', auth, async (req, res) => {
  try {
    const { name, content } = req.body;
    
    // Check if file exists
    let file = await File.findOne({ name, owner: req.userId });
    
    if (file) {
      // Update existing file
      file.content = content;
      file.size = content.length;
      await file.save();
    } else {
      // Create new file
      file = new File({
        name,
        content,
        owner: req.userId,
        size: content.length,
      });
      await file.save();
    }
    
    res.json(file);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single file
router.get('/:id', auth, async (req, res) => {
  try {
    const file = await File.findOne({ _id: req.params.id, owner: req.userId });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.json(file);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Rename file
router.put('/:id/rename', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const file = await File.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { name },
      { new: true }
    );
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.json(file);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete file
router.delete('/:id', auth, async (req, res) => {
  try {
    const file = await File.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    res.json({ message: 'File deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;