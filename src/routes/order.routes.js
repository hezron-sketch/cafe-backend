const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Customer routes
router.post('/', authMiddleware.authenticate, orderController.createOrder);
router.get('/user', authMiddleware.authenticate, orderController.getUserOrders);
router.get('/', authMiddleware.authenticate, orderController.getUserOrders);
router.get('/:id', authMiddleware.authenticate, orderController.getOrderById);

// Admin/Staff routes
router.get(
  '/admin/all',
  authMiddleware.authenticate,
  roleMiddleware('admin'),
  orderController.getAllOrders
);

router.put(
  '/:id/status', 
  authMiddleware.authenticate, 
  roleMiddleware(['admin', 'staff']), 
  orderController.updateOrderStatus
);

module.exports = router;