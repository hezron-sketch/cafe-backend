require('dotenv').config();
const mongoose = require('mongoose');
const Order = require('./src/models/Order');
const User = require('./src/models/User');
const MenuItem = require('./src/models/MenuItem');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB for seeding'))
  .catch(err => console.error('MongoDB connection error:', err));

// Sample data generation functions
const getRandomItems = async (count) => {
  const items = await MenuItem.aggregate([{ $sample: { size: count } }]);
  return items.map(item => ({
    menuItemId: item._id,
    name: item.name,
    price: item.price,
    quantity: Math.floor(Math.random() * 3) + 1 // 1-3 quantity
  }));
};

const calculateTotal = (items) => {
  return items.reduce((total, item) => total + (item.price * item.quantity), 0);
};

const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Order status timeline generator
const generateStatusTimeline = (baseDate) => {
  const timeline = {};
  const statuses = ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered'];
  
  statuses.forEach((status, index) => {
    timeline[status] = new Date(baseDate.getTime() + (index * 30 * 60 * 1000));
  });
  
  return timeline;
};

// Main seeding function
const seedOrders = async () => {
  try {
    // Clear existing orders
    await Order.deleteMany({});
    console.log('Cleared existing orders');

    // Get test customer
    const customer = await User.findOne({ email: 'customer@cafe.com' });
    if (!customer) {
      throw new Error('Test customer not found. Seed users first.');
    }

    // Get some menu items
    const menuItems = await MenuItem.find().limit(10);
    if (menuItems.length < 3) {
      throw new Error('Not enough menu items. Seed menu items first.');
    }

    // Generate sample orders
    const orders = [];
    const statuses = ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'];
    const serviceTypes = ['delivery', 'takeaway', 'dine-in'];
    const paymentMethods = ['mpesa', 'card', 'cash'];

    for (let i = 0; i < 20; i++) {
      const orderDate = randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date());
      const items = await getRandomItems(Math.floor(Math.random() * 3) + 1); // 1-3 items
      const totalAmount = calculateTotal(items);
      
      const orderData = {
        user: customer._id,
        items,
        totalAmount,
        deliveryFee: Math.random() > 0.5 ? 100 : 0,
        serviceType: serviceTypes[Math.floor(Math.random() * serviceTypes.length)],
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        paymentStatus: Math.random() > 0.2 ? 'completed' : 'pending',
        orderStatus: statuses[Math.floor(Math.random() * statuses.length)],
        statusTimeline: generateStatusTimeline(orderDate),
        createdAt: orderDate,
        updatedAt: orderDate
      };

      // Add delivery address if service is delivery
      if (orderData.serviceType === 'delivery') {
        orderData.deliveryAddress = {
          street: `${Math.floor(Math.random() * 100) + 1} Main Street`,
          city: 'Nairobi',
          coordinates: {
            lat: -1.2921 + (Math.random() * 0.02 - 0.01),
            lng: 36.8219 + (Math.random() * 0.02 - 0.01)
          }
        };
      }

      // Apply promo code randomly
      if (Math.random() > 0.7) {
        orderData.promoCode = `DISCOUNT${Math.floor(Math.random() * 20) + 1}`;
        orderData.discountApplied = Math.floor(totalAmount * 0.1); // 10% discount
      }

      orders.push(orderData);
    }

    // Insert orders
    const createdOrders = await Order.insertMany(orders);
    console.log(`Successfully seeded ${createdOrders.length} orders`);

    // Create some recent orders for better testing
    const recentItems = await getRandomItems(2);
    const recentOrder = new Order({
      user: customer._id,
      items: recentItems,
      totalAmount: calculateTotal(recentItems),
      serviceType: 'delivery',
      deliveryAddress: {
        street: '123 Test Street',
        city: 'Nairobi',
        coordinates: { lat: -1.2921, lng: 36.8219 }
      },
      paymentMethod: 'mpesa',
      paymentStatus: 'completed',
      orderStatus: 'preparing',
      statusTimeline: generateStatusTimeline(new Date()),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    await recentOrder.save();
    console.log('Added one recent order for testing');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding orders:', error);
    process.exit(1);
  }
};

seedOrders();