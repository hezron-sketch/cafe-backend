const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Customer routes
router.post('/', authMiddleware, orderController.createOrder);
router.get('/', authMiddleware, orderController.getUserOrders);
router.get('/:id', authMiddleware, orderController.getOrderById);

// Admin/Staff routes
router.put(
  '/:id/status', 
  authMiddleware, 
  roleMiddleware(['admin', 'staff']), 
  orderController.updateOrderStatus
);

module.exports = router;