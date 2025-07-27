const express = require('express');
const router = express.Router();
const loyaltyController = require('../controllers/loyalty.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All loyalty routes require authentication
router.use(authMiddleware.authenticate);

// Get user's loyalty info
router.get('/', loyaltyController.getLoyaltyInfo);

// Get available rewards
router.get('/rewards', loyaltyController.getRewards);

// Redeem reward
router.post('/redeem', loyaltyController.redeemReward);

// Get loyalty transactions
router.get('/transactions', loyaltyController.getTransactions);

// Get loyalty leaderboard (admin only)
router.get('/leaderboard', loyaltyController.getLeaderboard);

module.exports = router; 