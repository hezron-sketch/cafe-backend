const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    select: false // Never return password in queries
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  name: { 
    type: String,
    trim: true,
    required: true
  },
  phone: { 
    type: String,
    validate: {
      validator: function(v) {
        return /^\+[\d]{10,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  // OTP Verification fields
  phoneVerified: {
    type: Boolean,
    default: false
  },
  phoneOtp: {
    code: String,
    expiresAt: Date
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailOtp: {
    code: String,
    expiresAt: Date
  },
  role: { 
    type: String, 
    enum: ['customer', 'admin', 'staff'], 
    default: 'customer' 
  },
  addresses: [{
    type: {
      label: { type: String, enum: ['home', 'work', 'other'] },
      street: String,
      city: String,
      postalCode: String,
      coordinates: {
        lat: Number,
        lng: Number
      },
      isDefault: Boolean
    }
  }],
  favorites: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'MenuItem' 
  }],
  isActive: {
    type: Boolean,
    default: true,
    select: false
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Update timestamps on save
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now() - 1000; // Ensure token is created after
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if password changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to create password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

// Instance method to generate OTP
userSchema.methods.generateOtp = function(type = 'phone') {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  if (type === 'phone') {
    this.phoneOtp = {
      code: otp,
      expiresAt: expiresAt
    };
  } else if (type === 'email') {
    this.emailOtp = {
      code: otp,
      expiresAt: expiresAt
    };
  }
  
  return otp;
};

// Instance method to verify OTP
userSchema.methods.verifyOtp = function(code, type = 'phone') {
  if (type === 'phone') {
    if (!this.phoneOtp || !this.phoneOtp.code || !this.phoneOtp.expiresAt) {
      return false;
    }
    if (new Date() > this.phoneOtp.expiresAt) {
      return false;
    }
    if (this.phoneOtp.code !== code) {
      return false;
    }
    this.phoneVerified = true;
    this.phoneOtp = undefined;
    return true;
  } else if (type === 'email') {
    if (!this.emailOtp || !this.emailOtp.code || !this.emailOtp.expiresAt) {
      return false;
    }
    if (new Date() > this.emailOtp.expiresAt) {
      return false;
    }
    if (this.emailOtp.code !== code) {
      return false;
    }
    this.emailVerified = true;
    this.emailOtp = undefined;
    return true;
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);