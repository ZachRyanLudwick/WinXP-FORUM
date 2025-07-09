const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const auth = require('../middleware/auth');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Malicious file signatures to block
const maliciousSignatures = [
  '4d5a', // PE executable
  '7f454c46', // ELF executable
  '504b0304', // ZIP (could contain malware)
  'cafebabe', // Java class file
  'd0cf11e0a1b11ae1', // MS Office (macro risk)
  '25504446' // PDF (script risk)
];

const fileFilter = (req, file, cb) => {
  // Only allow images and plain text
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  // Block dangerous extensions
  const dangerousExts = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.jar', '.js', '.vbs', '.ps1'];
  if (dangerousExts.includes(fileExt)) {
    return cb(new Error('Dangerous file type'), false);
  }
  
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExt)) {
    cb(null, true);
  } else {
    cb(new Error('Only images allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
    files: 1, // Only 1 file at a time
    fieldSize: 1024 * 1024 // 1MB field limit
  }
});

// Upload file (authenticated users)
router.post('/', auth, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File too large (max 5MB)' });
      }
      return res.status(400).json({ message: 'Upload error: ' + err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    
    handleUpload(req, res);
  });
});

// Scan file for malicious content
const scanFile = (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const hex = buffer.toString('hex', 0, 20); // Check first 20 bytes
    
    // Check for malicious signatures
    for (const sig of maliciousSignatures) {
      if (hex.startsWith(sig.toLowerCase())) {
        return false;
      }
    }
    
    // Check for suspicious strings in text files
    const content = buffer.toString('utf8', 0, 1000);
    const suspiciousPatterns = [
      /<script/i, /javascript:/i, /vbscript:/i,
      /eval\(/i, /exec\(/i, /system\(/i
    ];
    
    return !suspiciousPatterns.some(pattern => pattern.test(content));
  } catch {
    return false;
  }
};

function handleUpload(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Security checks
    if (req.file.size > 2 * 1024 * 1024) { // Reduced to 2MB
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'File too large (max 2MB)' });
    }

    // Scan for malicious content
    if (!scanFile(req.file.path)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'File failed security scan' });
    }

    // Generate secure filename
    const hash = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(req.file.originalname);
    const newFilename = hash + ext;
    const newPath = path.join(path.dirname(req.file.path), newFilename);
    
    fs.renameSync(req.file.path, newPath);

    const isImage = req.file.mimetype.startsWith('image/');
    
    res.json({
      message: 'File uploaded successfully',
      filename: newFilename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      isImage: isImage
    });
  } catch (error) {
    if (req.file?.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Upload failed' });
  }
};

module.exports = router;