const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  firebaseUid: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String },
  phone: { type: String },
  role: { 
    type: String, 
    enum: ['customer', 'admin', 'staff'], 
    default: 'customer' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field on save
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);