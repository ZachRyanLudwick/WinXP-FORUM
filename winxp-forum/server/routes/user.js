const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Save icon positions
router.post('/icon-positions', auth, async (req, res) => {
  try {
    const { positions } = req.body;
    
    await User.findByIdAndUpdate(req.userId, {
      iconPositions: positions
    });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get icon positions
router.get('/icon-positions', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('iconPositions');
    
    res.json({ 
      positions: user.iconPositions || {
        posts: { x: 0, y: 0 },
        create: { x: 0, y: 1 },
        admin: { x: 0, y: 2 },
        login: { x: 1, y: 0 },
        settings: { x: 1, y: 1 }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;