const admin = require('../config/firebase');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Check if user exists in our database
    const user = await User.findOne({ firebaseUid: decodedToken.uid });
    if (!user) {
      return res.status(401).json({ message: 'User not registered' });
    }
    
    // Attach complete user information
    req.user = {
      uid: decodedToken.uid,
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