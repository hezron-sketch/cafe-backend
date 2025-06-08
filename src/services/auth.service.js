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

const registerUser = async (userData) => {
  // Create Firebase user
  const firebaseUser = await admin.auth().createUser({
    email: userData.email,
    password: userData.password,
    displayName: userData.name
  });
  
  // Create local user
  const user = new User({
    firebaseUid: firebaseUser.uid,
    email: userData.email,
    name: userData.name,
    phone: userData.phone
  });
  
  await user.save();
  
  return {
    token: generateToken(firebaseUser.uid),
    user: user.toObject()
  };
};

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