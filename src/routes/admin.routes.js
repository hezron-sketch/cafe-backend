const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/role.middleware');
const adminController = require('../controllers/admin.controller');

// Apply authentication and admin role middleware to all routes
router.use(authMiddleware.authenticate);
router.use(isAdmin);

// Dashboard statistics
router.get('/dashboard', adminController.getDashboardStats);

// Order management
router.get('/orders', adminController.getOrders);
router.put('/orders/:orderId/status', adminController.updateOrderStatus);

// Menu management
router.get('/menu', adminController.getMenuItems);
router.post('/menu', adminController.createMenuItem);
router.put('/menu/:itemId', adminController.updateMenuItem);
router.delete('/menu/:itemId', adminController.deleteMenuItem);

// Customer management
router.get('/customers', adminController.getCustomers);

// Payment management
router.get('/payments', adminController.getPayments);

module.exports = router; 