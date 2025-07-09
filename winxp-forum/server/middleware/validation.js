const validator = require('validator');

// Input validation middleware
const validateInput = (req, res, next) => {
  // Sanitize common fields
  if (req.body.email) {
    req.body.email = validator.normalizeEmail(req.body.email);
    if (!validator.isEmail(req.body.email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
  }

  // Validate URLs if present
  if (req.body.url && !validator.isURL(req.body.url)) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // Remove null bytes and control characters
  for (let key in req.body) {
    if (typeof req.body[key] === 'string') {
      req.body[key] = req.body[key].replace(/\0/g, '');
    }
  }

  next();
};

module.exports = { validateInput };