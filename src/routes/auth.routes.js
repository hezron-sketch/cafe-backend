const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller'); 
const authMiddleware = require('../middlewares/auth.middleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', authMiddleware.authenticate, authController.getMe);

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