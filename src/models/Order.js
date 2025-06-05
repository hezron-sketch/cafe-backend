const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderItemSchema = new Schema({
  menuItemId: { 
    type: Schema.Types.ObjectId, 
    ref: 'MenuItem', 
    required: true 
  },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  specialInstructions: { type: String }
});

const orderSchema = new Schema({
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [orderItemSchema],
  totalAmount: { type: Number, required: true },
  deliveryFee: { type: Number, default: 0 },
  serviceType: { 
    type: String, 
    enum: ['delivery', 'takeaway', 'dine-in'], 
    required: true 
  },
  deliveryAddress: {
    type: {
      street: String,
      city: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    required: function() { return this.serviceType === 'delivery'; }
  },
  paymentMethod: { 
    type: String, 
    enum: ['mpesa', 'card', 'cash'], 
    required: true 
  },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
  },
  orderStatus: { 
    type: String, 
    enum: ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  promoCode: { type: String },
  discountApplied: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update timestamp on save
orderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Order', orderSchema);