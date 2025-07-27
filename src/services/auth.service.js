const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { admin, testFirebaseConnection } = require('../config/firebase');
const { sendWelcomeEmail, sendOtpEmail } = require('./email.service');
const { sendSmsOtp, sendSmsWelcome } = require('./sms.service');

const generateToken = (uid) => {
  return jwt.sign({ uid }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
};

const verifyFirebaseToken = async (idToken) => {
  try {
    if (!idToken) {
      throw new Error('No ID token provided');
    }
    return await admin.auth().verifyIdToken(idToken);
  } catch (error) {
    console.error('Firebase token verification failed:', error.message);
    throw error;
  }
};

const registerUser = async ({ email, password, name, phone, role, addresses }) => {
  let firebaseUser = null;
  
  try {
    // Test Firebase connection first
    const isConnected = await testFirebaseConnection();
    if (!isConnected) {
      throw new Error('Firebase connection failed');
    }
    
    // 1. Create Firebase user
    firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // 2. Create MongoDB user
    const user = new User({
      firebaseUid: firebaseUser.uid,
      email,
      password, // Note: Only store hashed passwords in production
      name,
      phone,
      role: role || 'customer',
      addresses: addresses || []
    });

    await user.save();

    // 3. Send welcome email
    await sendWelcomeEmail(user);

    // 4. Send welcome SMS if phone number is provided
    if (phone) {
      await sendSmsWelcome(phone, name);
    }

    // 5. Generate JWT
    const token = generateToken(firebaseUser.uid);

    return { token, user };
  } catch (error) {
    console.error('Registration error:', error);
    
    // Clean up Firebase user if MongoDB save fails
    if (firebaseUser && firebaseUser.uid) {
      try {
        await admin.auth().deleteUser(firebaseUser.uid);
      } catch (deleteError) {
        console.error('Failed to delete Firebase user:', deleteError.message);
      }
    }
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

const loginUser = async (idToken) => {
  try {
    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    
    // Get or create user
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
    
    return {
      token: generateToken(firebaseUid),
      user: user.toObject()
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

module.exports = {
  generateToken,
  verifyFirebaseToken,
  registerUser,
  sendPhoneOtp,
  verifyPhoneOtp,
  sendEmailOtp,
  verifyEmailOtp,
  loginUser
};