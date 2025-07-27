const Loyalty = require('../models/Loyalty');
const User = require('../models/User');
const Order = require('../models/Order');

// Get user's loyalty info
exports.getLoyaltyInfo = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    let loyalty = await Loyalty.findOne({ user: userId });
    
    if (!loyalty) {
      loyalty = new Loyalty({ user: userId });
      await loyalty.save();
    }
    
    res.json({
      success: true,
      data: loyalty
    });
  } catch (error) {
    next(error);
  }
};

// Get available rewards
exports.getRewards = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const loyalty = await Loyalty.findOne({ user: userId });
    
    if (!loyalty) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty account not found'
      });
    }
    
    // Available rewards based on points
    const availableRewards = [
      {
        name: 'Free Coffee',
        description: 'Get a free coffee of your choice',
        pointsRequired: 50,
        discountType: 'free_item',
        discountValue: 0
      },
      {
        name: '$5 Off',
        description: 'Get $5 off your next order',
        pointsRequired: 100,
        discountType: 'fixed',
        discountValue: 5
      },
      {
        name: '10% Off',
        description: 'Get 10% off your next order',
        pointsRequired: 200,
        discountType: 'percentage',
        discountValue: 10
      },
      {
        name: 'Free Delivery',
        description: 'Free delivery on your next order',
        pointsRequired: 75,
        discountType: 'fixed',
        discountValue: 0
      }
    ];
    
    res.json({
      success: true,
      data: {
        loyalty,
        availableRewards
      }
    });
  } catch (error) {
    next(error);
  }
};

// Redeem reward
exports.redeemReward = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { rewardName } = req.body;
    
    const loyalty = await Loyalty.findOne({ user: userId });
    if (!loyalty) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty account not found'
      });
    }
    
    // Find the reward
    const rewards = [
      { name: 'Free Coffee', pointsRequired: 50 },
      { name: '$5 Off', pointsRequired: 100 },
      { name: '10% Off', pointsRequired: 200 },
      { name: 'Free Delivery', pointsRequired: 75 }
    ];
    
    const reward = rewards.find(r => r.name === rewardName);
    if (!reward) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reward'
      });
    }
    
    // Check if user has enough points
    if (loyalty.points < reward.pointsRequired) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points'
      });
    }
    
    // Redeem the reward
    loyalty.redeemPoints(reward.pointsRequired, `Redeemed: ${rewardName}`);
    await loyalty.save();
    
    res.json({
      success: true,
      message: `Reward "${rewardName}" redeemed successfully`,
      data: loyalty
    });
  } catch (error) {
    next(error);
  }
};

// Get loyalty transactions
exports.getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const loyalty = await Loyalty.findOne({ user: userId }).populate('transactions.orderId');
    
    if (!loyalty) {
      return res.status(404).json({
        success: false,
        message: 'Loyalty account not found'
      });
    }
    
    res.json({
      success: true,
      data: loyalty.transactions
    });
  } catch (error) {
    next(error);
  }
};

// Process loyalty points after order completion
exports.processOrderPoints = async (orderId, userId, orderAmount) => {
  try {
    let loyalty = await Loyalty.findOne({ user: userId });
    if (!loyalty) {
      loyalty = new Loyalty({ user: userId });
    }
    
    // Calculate points earned (1 point per $1 spent)
    const pointsEarned = loyalty.calculatePointsFromOrder(orderAmount);
    
    // Add points and update spending
    loyalty.addPoints(pointsEarned, orderId, `Points earned from order #${orderId}`);
    loyalty.updateSpending(orderAmount);
    
    await loyalty.save();
    
    return {
      pointsEarned,
      newTotal: loyalty.points,
      newTier: loyalty.tier
    };
  } catch (error) {
    console.error('Error processing loyalty points:', error);
    throw error;
  }
};

// Get loyalty leaderboard (admin only)
exports.getLeaderboard = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: Admins only'
      });
    }
    
    const leaderboard = await Loyalty.find()
      .populate('user', 'name email')
      .sort({ points: -1, totalSpent: -1 })
      .limit(10);
    
    res.json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    next(error);
  }
}; 