const express = require('express');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Download file with proper error handling
router.get('/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, '../uploads', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  
  // Check if file is not empty
  const stats = fs.statSync(filePath);
  if (stats.size === 0) {
    return res.status(404).json({ message: 'File is empty or corrupted' });
  }
  
  // Send file
  res.download(filePath, (err) => {
    if (err) {
      console.error('Download error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Download failed' });
      }
    }
  });
});

module.exports = router;