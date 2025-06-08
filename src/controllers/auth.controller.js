const admin = require('../config/firebase');
const User = require('../models/User');
const { generateToken } = require('../services/auth.service');
const authService = require('../services/auth.service');

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

exports.register = async (req, res, next) => {
  try {
    const { email, password, name, phone, role = 'customer', addresses } = req.body;

    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password and name are required'
      });
    }

    const result = await authService.registerUser({
      email,
      password,
      name,
      phone,
      role,
      addresses
    });

    // Filter sensitive data from response
    const userResponse = {
      id: result.user._id,
      email: result.user.email,
      name: result.user.name,
      phone: result.user.phone,
      role: result.user.role,
      addresses: result.user.addresses,
      createdAt: result.user.createdAt
    };

    res.status(201).json({
      success: true,
      token: result.token,
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle specific errors
    if (error.code === 'auth/email-already-exists') {
      return res.status(409).json({
        success: false,
        message: 'Email already in use'
      });
    }
    
    next(error);
  }
};