const mongoose = require('mongoose');
const { Schema } = mongoose;

const cartItemSchema = new Schema({
  menuItemId: {
    type: Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  specialInstructions: String,
  imageUrl: String
});

const cartSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  totalAmount: {
    type: Number,
    default: 0
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0
  },
  promoCode: String,
  estimatedDeliveryTime: Date,
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
cartSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Calculate total amount
cartSchema.methods.calculateTotal = function() {
  const itemsTotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  this.totalAmount = itemsTotal + this.deliveryFee - this.discountAmount;
  return this.totalAmount;
};

// Add item to cart
cartSchema.methods.addItem = function(itemData) {
  const existingItem = this.items.find(item => 
    item.menuItemId.toString() === itemData.menuItemId.toString()
  );

  if (existingItem) {
    existingItem.quantity += itemData.quantity;
  } else {
    this.items.push(itemData);
  }

  this.calculateTotal();
  return this;
};

// Remove item from cart
cartSchema.methods.removeItem = function(menuItemId) {
  this.items = this.items.filter(item => 
    item.menuItemId.toString() !== menuItemId.toString()
  );
  this.calculateTotal();
  return this;
};

// Update item quantity
cartSchema.methods.updateItemQuantity = function(menuItemId, quantity) {
  const item = this.items.find(item => 
    item.menuItemId.toString() === menuItemId.toString()
  );
  
  if (item) {
    if (quantity <= 0) {
      this.removeItem(menuItemId);
    } else {
      item.quantity = quantity;
    }
    this.calculateTotal();
  }
  
  return this;
};

// Clear cart
cartSchema.methods.clearCart = function() {
  this.items = [];
  this.totalAmount = 0;
  this.deliveryFee = 0;
  this.discountAmount = 0;
  this.promoCode = null;
  return this;
};

module.exports = mongoose.model('Cart', cartSchema); 