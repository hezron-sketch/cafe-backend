const admin = require('../config/firebase');
const User = require('../models/User');
const { generateToken } = require('../services/auth.service');
const authService = require('../services/auth.service');

exports.login = async (req, res, next) => {
  try {
    const { idToken } = req.body;
    
    // Validate the token exists
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ 
        message: 'ID token is required and must be a string' 
      });
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    
    // Get or create user in local DB
    let user = await User.findOne({ firebaseUid });
    if (!user) {
      const firebaseUser = await admin.auth().getUser(firebaseUid);
      user = new User({
        firebaseUid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || '',
        role: 'customer' // Default role
      });
      await user.save();
    }
    
    // Generate JWT with role information
    const token = await generateToken({
      uid: firebaseUid,
      role: user.role
    });
    
    res.json({ 
      token, 
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role // Make sure this is populated
      }
    });
  } catch (error) {
    next(error);
  }
};

// exports.login = async (req, res, next) => {
//   try {
//     const { idToken } = req.body;
    
//     if (!idToken) {
//       return res.status(400).json({ 
//         message: 'ID token is required' 
//       });
//     }

//     const decodedToken = await admin.auth().verifyIdToken(idToken);
//     const firebaseUid = decodedToken.uid;
    
//     let user = await User.findOne({ firebaseUid });
//     if (!user) {
//       const firebaseUser = await admin.auth().getUser(firebaseUid);
//       user = new User({
//         firebaseUid,
//         email: firebaseUser.email,
//         name: firebaseUser.displayName || ''
//       });
//       await user.save();
//     }
    
//     const token = await generateToken(firebaseUid);
    
//     res.json({ 
//       token, 
//       user: {
//         id: user._id,
//         email: user.email,
//         name: user.name,
//         role: user.role
//       }
//     });
//   } catch (error) {
//     next(error); // Let error handler middleware deal with it
//   }
// };


// exports.login = async (req, res, next) => {
//   try {
//     const { email, password } = req.body;
    
//     if (!email || !password) {
//       return res.status(400).json({ message: 'Email and password are required' });
//     }

//     // Sign in with Firebase using email/password
//     const auth = getAuth();
//     const userCredential = await signInWithEmailAndPassword(auth, email, password);
//     const user = userCredential.user;
//     const idToken = await user.getIdToken();

//     // Rest of your existing login logic...
//     res.json({ token: idToken, user: userData });
    
//   } catch (error) {
//     next(error);
//   }
// };

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

exports.getMe = async (req, res, next) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    const user = await User.findOne({ firebaseUid: req.user.uid })
      .select('-__v -password')
      .populate('favorites', 'name price imageUrl');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};