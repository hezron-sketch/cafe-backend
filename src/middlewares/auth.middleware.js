const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Find user by id from JWT payload
    const user = await User.findById(decoded.uid);
    if (!user) {
      return res.status(401).json({ message: 'User not registered' });
    }
    req.user = {
      uid: user._id,
      role: user.role,
      id: user._id,
      email: user.email
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      message: 'Unauthorized', 
      error: error.message 
    });
  }
};

// Admin-specific middleware
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ 
    message: 'Forbidden: Admin access required' 
  });
};

module.exports = {
  authenticate,
  isAdmin
};