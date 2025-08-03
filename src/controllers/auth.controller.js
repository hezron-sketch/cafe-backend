const User = require('../models/User');
const { generateToken } = require('../services/auth.service');
const authService = require('../services/auth.service');

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const result = await authService.loginUser({ email, password });

    res.json({
      token: result.token,
      user: {
        _id: result.user._id,
        email: result.user.email,
        name: result.user.name,
        phone: result.user.phone,
        role: result.user.role,
        phoneVerified: result.user.phoneVerified,
        emailVerified: result.user.emailVerified
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({ message: error.message || 'Login failed' });
  }
};

exports.getMe = async (req, res, next) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({
        message: 'Not authenticated'
      });
    }
    const user = await User.findById(req.user.uid)
      .select('-__v -password');
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    res.status(200).json({
      _id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      phoneVerified: user.phoneVerified,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
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
      _id: result.user._id,
      email: result.user.email,
      name: result.user.name,
      phone: result.user.phone,
      role: result.user.role,
      addresses: result.user.addresses,
      phoneVerified: result.user.phoneVerified,
      emailVerified: result.user.emailVerified,
      createdAt: result.user.createdAt
    };

    res.status(201).json({
      success: true,
      token: result.token,
      user: userResponse,
      message: 'Registration successful. Please verify your phone number and email.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.message === 'Email already in use') {
      return res.status(409).json({
        success: false,
        message: 'Email already in use'
      });
    }
    res.status(400).json({
      success: false,
      message: error.message || 'Registration failed'
    });
  }
};

// Send phone OTP
exports.sendPhoneOtp = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const result = await authService.sendPhoneOtp(userId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Send phone OTP error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Verify phone OTP
exports.verifyPhoneOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const userId = req.user.uid;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }

    const result = await authService.verifyPhoneOtp(userId, otp);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Verify phone OTP error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Send email OTP
exports.sendEmailOtp = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const result = await authService.sendEmailOtp(userId);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Send email OTP error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// Verify email OTP
exports.verifyEmailOtp = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const userId = req.user.uid;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }

    const result = await authService.verifyEmailOtp(userId, otp);
    
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    console.error('Verify email OTP error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};