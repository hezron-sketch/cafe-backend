const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const menuRoutes = require('./menu.routes');
const orderRoutes = require('./order.routes');
const cartRoutes = require('./cart.routes');
const loyaltyRoutes = require('./loyalty.routes');
const paymentRoutes = require('./payment.routes');
const adminRoutes = require('./admin.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Mount all routes
router.use('/auth', authRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/loyalty', loyaltyRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);

module.exports = router; 