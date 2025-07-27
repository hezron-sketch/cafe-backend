const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const menuRoutes = require('./menu.routes');
const orderRoutes = require('./order.routes');
const cartRoutes = require('./cart.routes');
const loyaltyRoutes = require('./loyalty.routes');

// Mount all routes
router.use('/auth', authRoutes);
router.use('/menu', menuRoutes);
router.use('/orders', orderRoutes);
router.use('/cart', cartRoutes);
router.use('/loyalty', loyaltyRoutes);

module.exports = router; 