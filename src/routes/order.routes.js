const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { isAdmin } = require('../middlewares/role.middleware');

// Cart routes (must be authenticated)
router.get('/cart', authMiddleware.authenticate, orderController.getCart);
router.post('/cart/add', authMiddleware.authenticate, orderController.addToCart);
router.delete('/cart/remove/:menuItemId', authMiddleware.authenticate, orderController.removeFromCart);
router.put('/cart/update/:menuItemId', authMiddleware.authenticate, orderController.updateCartItem);
router.delete('/cart/clear', authMiddleware.authenticate, orderController.clearCart);

// Order routes (orders can only be created from cart)
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
  isAdmin,
  orderController.getOrderStats
);

router.get(
  '/admin/pending',
  authMiddleware.authenticate,
  isAdmin,
  orderController.getPendingOrders
);

router.put(
  '/:id/status',
  authMiddleware.authenticate,
  isAdmin,
  orderController.updateOrderStatus
);

router.put(
  '/:id/assign',
  authMiddleware.authenticate,
  isAdmin,
  orderController.assignOrder
);

router.put(
  '/:id',
  authMiddleware.authenticate,
  isAdmin,
  orderController.updateOrder
);

router.delete(
  '/:id',
  authMiddleware.authenticate,
  isAdmin,
  orderController.deleteOrder
);

// M-Pesa payment routes
router.post('/mpesa/callback', orderController.handleMpesaCallback);
router.get('/mpesa/verify/:checkoutRequestID', orderController.verifyMpesaPayment);

module.exports = router;