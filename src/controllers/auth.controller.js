const admin = require('../config/firebase');
const User = require('../models/User');
const { generateToken } = require('../services/auth.service');

exports.login = async (req, res, next) => {
  res.json ({message: 'login successfull'})
  try {
    const { idToken } = req.body;
    
    // Validate the token exists
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ 
        message: 'ID token is required and must be a string' 
      });
    }

    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Token verification error:', error.message);
      return res.status(401).json({ 
        message: 'Invalid or expired token',
        error: error.message 
      });
    }

    const firebaseUid = decodedToken.uid;
    
    // Get or create user in local DB
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      const firebaseUser = await admin.auth().getUser(firebaseUid);
      user = new User({
        firebaseUid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || ''
      });
      await user.save();
    }
    
    // Generate JWT
    const token = await generateToken(firebaseUid);
    
    res.json({ 
      token, 
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};