const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');

// Get user's cart
exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    let cart = await Cart.findOne({ user: userId }).populate('items.menuItemId');
    
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }
    
    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// Add item to cart
exports.addToCart = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { menuItemId, quantity = 1, specialInstructions } = req.body;
    
    // Validate menu item exists
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }
    
    // Get or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }
    
    // Add item to cart
    const itemData = {
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity,
      specialInstructions,
      imageUrl: menuItem.imageUrl
    };
    
    cart.addItem(itemData);
    await cart.save();
    
    res.json({
      success: true,
      message: 'Item added to cart',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { menuItemId, quantity } = req.body;
    
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    cart.updateItemQuantity(menuItemId, quantity);
    await cart.save();
    
    res.json({
      success: true,
      message: 'Cart updated',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { menuItemId } = req.params;
    
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    cart.removeItem(menuItemId);
    await cart.save();
    
    res.json({
      success: true,
      message: 'Item removed from cart',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// Clear cart
exports.clearCart = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    cart.clearCart();
    await cart.save();
    
    res.json({
      success: true,
      message: 'Cart cleared',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// Apply promo code to cart
exports.applyPromoCode = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { promoCode } = req.body;
    
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    // Simple promo code logic (you can enhance this)
    let discountAmount = 0;
    if (promoCode === 'SAVE10') {
      discountAmount = cart.totalAmount * 0.1; // 10% discount
    } else if (promoCode === 'SAVE5') {
      discountAmount = 5; // $5 discount
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid promo code'
      });
    }
    
    cart.promoCode = promoCode;
    cart.discountAmount = discountAmount;
    cart.calculateTotal();
    await cart.save();
    
    res.json({
      success: true,
      message: 'Promo code applied',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// Update delivery fee
exports.updateDeliveryFee = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { deliveryFee } = req.body;
    
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }
    
    cart.deliveryFee = deliveryFee;
    cart.calculateTotal();
    await cart.save();
    
    res.json({
      success: true,
      message: 'Delivery fee updated',
      data: cart
    });
  } catch (error) {
    next(error);
  }
}; 