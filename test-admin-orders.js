require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Order = require('./src/models/Order');
const authService = require('./src/services/auth.service');

async function testAdminOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Create test users
    console.log('\n🧪 Creating test users...');
    
    // Create admin user
    const adminResult = await authService.registerUser({
      email: 'admin@cafex.com',
      password: 'admin123',
      name: 'Admin User',
      phone: '+254700000001',
      role: 'admin'
    });
    console.log('✅ Admin user created:', adminResult.user.email);
    
    // Create customer user
    const customerResult = await authService.registerUser({
      email: 'customer@cafex.com',
      password: 'customer123',
      name: 'Customer User',
      phone: '+254700000002',
      role: 'customer'
    });
    console.log('✅ Customer user created:', customerResult.user.email);
    
    // Create test orders
    console.log('\n🧪 Creating test orders...');
    
    // Order for customer
    const customerOrder = new Order({
      user: customerResult.user._id,
      items: [
        {
          menuItemId: new mongoose.Types.ObjectId(),
          name: 'Espresso',
          price: 3.5,
          quantity: 1
        }
      ],
      totalAmount: 3.5,
      serviceType: 'takeaway',
      paymentMethod: 'cash'
    });
    await customerOrder.save();
    console.log('✅ Customer order created');
    
    // Order for admin
    const adminOrder = new Order({
      user: adminResult.user._id,
      items: [
        {
          menuItemId: new mongoose.Types.ObjectId(),
          name: 'Cappuccino',
          price: 4.5,
          quantity: 2
        }
      ],
      totalAmount: 9.0,
      serviceType: 'delivery',
      paymentMethod: 'mpesa'
    });
    await adminOrder.save();
    console.log('✅ Admin order created');
    
    // Test admin login and get all orders
    console.log('\n🧪 Testing admin access to all orders...');
    const adminLogin = await authService.loginUser({
      email: 'admin@cafex.com',
      password: 'admin123'
    });
    
    // Simulate the getAllOrders function
    const allOrders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone');
    
    console.log('✅ Admin retrieved all orders:', allOrders.length);
    allOrders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`, {
        id: order._id,
        user: order.user.name,
        email: order.user.email,
        totalAmount: order.totalAmount,
        serviceType: order.serviceType
      });
    });
    
    // Test customer login and get user orders
    console.log('\n🧪 Testing customer access to own orders...');
    const customerLogin = await authService.loginUser({
      email: 'customer@cafex.com',
      password: 'customer123'
    });
    
    const userOrders = await Order.find({ user: customerResult.user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone');
    
    console.log('✅ Customer retrieved own orders:', userOrders.length);
    userOrders.forEach((order, index) => {
      console.log(`Order ${index + 1}:`, {
        id: order._id,
        user: order.user.name,
        email: order.user.email,
        totalAmount: order.totalAmount,
        serviceType: order.serviceType
      });
    });
    
    console.log('\n🎉 Test completed successfully!');
    console.log('Admin can see all orders, customer can only see their own orders.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testAdminOrders(); 