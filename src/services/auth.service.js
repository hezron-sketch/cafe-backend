const jwt = require('jsonwebtoken');
const User = require('../models/User');
const admin = require('../config/firebase');

const generateToken = (uid) => {
  return jwt.sign({ uid }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
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
  let firebaseUser;
    try {
      // 1. Create Firebase user
      const firebaseUser = await admin.auth().createUser({
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

      // 3. Generate JWT
      const token = generateToken(firebaseUser.uid);

      return { token, user };
    } catch (error) {
      // Clean up Firebase user if MongoDB save fails
      if (firebaseUser) {
        await admin.auth().deleteUser(firebaseUser.uid);
      }
      throw error;
    }
  }
const loginUser = async (idToken) => {
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
};

module.exports = {
  generateToken,
  verifyFirebaseToken,
  registerUser,
  loginUser
};

// const jwt = require('jsonwebtoken');
// const admin = require('../config/firebase');

// const generateToken = (uid) => {
//   return jwt.sign({ uid }, process.env.JWT_SECRET, {
//     expiresIn: process.env.JWT_EXPIRES_IN || '1d'
//   });
// };

// const verifyFirebaseToken = async (idToken) => {
//   try {
//     if (!idToken) {
//       throw new Error('No ID token provided');
//     }
//     return await admin.auth().verifyIdToken(idToken);
//   } catch (error) {
//     console.error('Firebase token verification failed:', error.message);
//     throw error;
//   }
// };

// module.exports = {
//   generateToken,
//   verifyFirebaseToken
// };