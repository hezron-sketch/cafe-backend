const mongoose = require('mongoose');
const { Schema } = mongoose;

const loyaltyTransactionSchema = new Schema({
  type: {
    type: String,
    enum: ['earned', 'redeemed', 'expired'],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  orderId: {
    type: Schema.Types.ObjectId,
    ref: 'Order'
  },
  description: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const rewardSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  pointsRequired: {
    type: Number,
    required: true
  },
  discountType: {
    type: String,
    enum: ['percentage', 'fixed', 'free_item'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: Date
});

const loyaltySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  transactions: [loyaltyTransactionSchema],
  rewards: [rewardSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamps on save
loyaltySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate tier based on total spent
loyaltySchema.methods.calculateTier = function() {
  if (this.totalSpent >= 1000) {
    this.tier = 'platinum';
  } else if (this.totalSpent >= 500) {
    this.tier = 'gold';
  } else if (this.totalSpent >= 200) {
    this.tier = 'silver';
  } else {
    this.tier = 'bronze';
  }
  return this.tier;
};

// Add points
loyaltySchema.methods.addPoints = function(points, orderId, description) {
  this.points += points;
  this.transactions.push({
    type: 'earned',
    points,
    orderId,
    description
  });
  return this;
};

// Redeem points
loyaltySchema.methods.redeemPoints = function(points, description) {
  if (this.points < points) {
    throw new Error('Insufficient points');
  }
  this.points -= points;
  this.transactions.push({
    type: 'redeemed',
    points: -points,
    description
  });
  return this;
};

// Calculate points from order amount (1 point per $1 spent)
loyaltySchema.methods.calculatePointsFromOrder = function(orderAmount) {
  return Math.floor(orderAmount);
};

// Update total spent and tier
loyaltySchema.methods.updateSpending = function(orderAmount) {
  this.totalSpent += orderAmount;
  this.calculateTier();
  return this;
};

module.exports = mongoose.model('Loyalty', loyaltySchema); 