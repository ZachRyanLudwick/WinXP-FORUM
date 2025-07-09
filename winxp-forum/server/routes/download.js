const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Serve file (images directly, others as download)
router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  
  // Check if file is not empty
  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    return res.status(404).json({ message: 'File is empty or corrupted' });
  }
  
  // Check if it's an image
  const ext = path.extname(filename).toLowerCase();
  const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  if (imageExts.includes(ext)) {
    // Serve image directly
    res.sendFile(filePath);
  } else {
    // Force download for other files
    res.download(filePath, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ message: 'Download failed' });
        }
      }
    });
  }
});

module.exports = router;