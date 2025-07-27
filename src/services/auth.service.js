const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendWelcomeEmail, sendOtpEmail } = require('./email.service');
const { sendSmsOtp, sendSmsWelcome } = require('./sms.service');

const generateToken = (uid) => {
  return jwt.sign({ uid }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
};

const registerUser = async ({ email, password, name, phone, role, addresses }) => {
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Email already in use');
    }

    // Create MongoDB user
    const user = new User({
      email,
      password, // Will be hashed by the pre-save middleware
      name,
      phone,
      role: role || 'customer',
      addresses: addresses || []
    });

    await user.save();

    // Send welcome email
    await sendWelcomeEmail(user);

    // Send welcome SMS if phone number is provided
    if (phone) {
      await sendSmsWelcome(phone, name);
    }

    // Generate JWT using user's MongoDB _id
    const token = generateToken(user._id.toString());

    return { token, user };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

const loginUser = async ({ email, password }) => {
  try {
    // Find user by email and select password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check password
    const isMatch = await user.correctPassword(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT using user's MongoDB _id
    const token = generateToken(user._id.toString());

    return { token, user };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

const sendPhoneOtp = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (!user.phone) {
      throw new Error('Phone number not provided');
    }

    // Generate OTP
    const otp = user.generateOtp('phone');
    await user.save();

    // Send OTP via SMS
    await sendSmsOtp(user.phone, otp);

    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error sending phone OTP:', error);
    throw error;
  }
};

const verifyPhoneOtp = async (userId, otp) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = user.verifyOtp(otp, 'phone');
    if (!isValid) {
      throw new Error('Invalid or expired OTP');
    }

    await user.save();
    return { success: true, message: 'Phone number verified successfully' };
  } catch (error) {
    console.error('Error verifying phone OTP:', error);
    throw error;
  }
};

const sendEmailOtp = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate OTP
    const otp = user.generateOtp('email');
    await user.save();

    // Send OTP via email
    await sendOtpEmail(user, otp);

    return { success: true, message: 'OTP sent successfully' };
  } catch (error) {
    console.error('Error sending email OTP:', error);
    throw error;
  }
};

const verifyEmailOtp = async (userId, otp) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = user.verifyOtp(otp, 'email');
    if (!isValid) {
      throw new Error('Invalid or expired OTP');
    }

    await user.save();
    return { success: true, message: 'Email verified successfully' };
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    throw error;
  }
};

module.exports = {
  generateToken,
  registerUser,
  loginUser,
  sendPhoneOtp,
  verifyPhoneOtp,
  sendEmailOtp,
  verifyEmailOtp
};