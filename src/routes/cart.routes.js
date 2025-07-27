const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All cart routes require authentication
router.use(authMiddleware.authenticate);

// Get user's cart
router.get('/', cartController.getCart);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update cart item quantity
router.put('/update', cartController.updateCartItem);

// Remove item from cart
router.delete('/remove/:menuItemId', cartController.removeFromCart);

// Clear cart
router.delete('/clear', cartController.clearCart);

// Apply promo code
router.post('/promo', cartController.applyPromoCode);

// Update delivery fee
router.put('/delivery-fee', cartController.updateDeliveryFee);

module.exports = router; 