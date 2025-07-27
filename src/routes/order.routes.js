const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const roleMiddleware = require('../middlewares/role.middleware');

// Customer routes
router.post('/', authMiddleware.authenticate, orderController.createOrder);
router.get('/user', authMiddleware.authenticate, orderController.getUserOrders);
router.get('/:id', authMiddleware.authenticate, orderController.getOrderById);
router.post('/:id/cancel', authMiddleware.authenticate, orderController.cancelOrder);
router.post('/:id/rate', authMiddleware.authenticate, orderController.rateOrder);

// Admin/Staff routes - Get all orders (admin only)
router.get(
  '/',
  authMiddleware.authenticate,
  (req, res, next) => {
    // If user is admin, get all orders, otherwise get user's orders
    if (req.user.role === 'admin') {
      return orderController.getAllOrders(req, res, next);
    } else {
      return orderController.getUserOrders(req, res, next);
    }
  }
);

router.get(
  '/admin/stats',
  authMiddleware.authenticate,
  roleMiddleware('admin'),
  orderController.getOrderStats
);

router.get(
  '/admin/pending',
  authMiddleware.authenticate,
  roleMiddleware(['admin', 'staff']),
  orderController.getPendingOrders
);

router.put(
  '/:id/status',
  authMiddleware.authenticate,
  roleMiddleware(['admin', 'staff']),
  orderController.updateOrderStatus
);

router.put(
  '/:id/assign',
  authMiddleware.authenticate,
  roleMiddleware(['admin', 'staff']),
  orderController.assignOrder
);

router.put(
  '/:id',
  authMiddleware.authenticate,
  roleMiddleware('admin'),
  orderController.updateOrder
);

router.delete(
  '/:id',
  authMiddleware.authenticate,
  roleMiddleware('admin'),
  orderController.deleteOrder
);

module.exports = router;