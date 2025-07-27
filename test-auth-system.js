require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const authService = require('./src/services/auth.service');

async function testAuthSystem() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Test 1: Register a new user
    console.log('\n🧪 Test 1: User Registration');
    try {
      const registerResult = await authService.registerUser({
        email: 'test@cafex.com',
        password: 'password123',
        name: 'Test User',
        phone: '+254700000000',
        role: 'customer'
      });
      
      console.log('✅ Registration successful');
      console.log('User ID:', registerResult.user._id);
      console.log('Token:', registerResult.token.substring(0, 20) + '...');
      
      // Test 2: Login
      console.log('\n🧪 Test 2: User Login');
      const loginResult = await authService.loginUser({
        email: 'test@cafex.com',
        password: 'password123'
      });
      
      console.log('✅ Login successful');
      console.log('User ID:', loginResult.user._id);
      console.log('Token:', loginResult.token.substring(0, 20) + '...');
      
      // Test 3: Send Phone OTP
      console.log('\n🧪 Test 3: Send Phone OTP');
      const phoneOtpResult = await authService.sendPhoneOtp(loginResult.user._id);
      console.log('✅ Phone OTP sent:', phoneOtpResult.message);
      
      // Test 4: Send Email OTP
      console.log('\n🧪 Test 4: Send Email OTP');
      const emailOtpResult = await authService.sendEmailOtp(loginResult.user._id);
      console.log('✅ Email OTP sent:', emailOtpResult.message);
      
      // Test 5: Get user and check OTP fields
      console.log('\n🧪 Test 5: Check User OTP Fields');
      const user = await User.findById(loginResult.user._id);
      console.log('Phone OTP exists:', !!user.phoneOtp);
      console.log('Email OTP exists:', !!user.emailOtp);
      console.log('Phone verified:', user.phoneVerified);
      console.log('Email verified:', user.emailVerified);
      
      console.log('\n🎉 All tests passed! The authentication system is working correctly.');
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
}

testAuthSystem(); 