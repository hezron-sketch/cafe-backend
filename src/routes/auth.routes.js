const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller'); 
const authMiddleware = require('../middlewares/auth.middleware');

// Public routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Protected routes
router.get('/me', authMiddleware.authenticate, authController.getMe);

// OTP Verification routes (protected)
router.post('/send-phone-otp', authMiddleware.authenticate, authController.sendPhoneOtp);
router.post('/verify-phone-otp', authMiddleware.authenticate, authController.verifyPhoneOtp);
router.post('/send-email-otp', authMiddleware.authenticate, authController.sendEmailOtp);
router.post('/verify-email-otp', authMiddleware.authenticate, authController.verifyEmailOtp);

// Admin routes
router.get('/admin/orders', 
  authMiddleware.authenticate, 
  authMiddleware.isAdmin, 
  (req, res) => {
    // Temporary route handler - replace with your controller
    res.json({ message: 'Admin orders accessed successfully' });
  }
);

module.exports = router;