const Order = require('../models/Order');
const User = require('../models/User');
const Cart = require('../models/Cart');
const MenuItem = require('../models/MenuItem');
const { sendOrderNotification } = require('../services/notification.service');
const mpesaService = require('../services/mpesa.service');

exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    const { items, serviceType, deliveryAddress, paymentMethod, promoCode } = req.body;

    // Validate that order is created from cart
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must be created from cart with valid items'
      });
    }

    // Validate each cart item
    for (const item of items) {
      if (!item.menuItemId || !item.name || !item.price || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: 'Each cart item must have menuItemId, name, price, and quantity'
        });
      }
      if (item.quantity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Item quantity must be at least 1'
        });
      }
    }

    // Calculate total amount from cart items
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = serviceType === 'delivery' ? 200 : 0; // Default delivery fee
    const discountApplied = promoCode ? 0 : 0; // Apply discount logic here
    const totalAmount = subtotal + deliveryFee - discountApplied;

    // Validate delivery address for delivery orders
    if (serviceType === 'delivery' && (!deliveryAddress || !deliveryAddress.street)) {
      return res.status(400).json({
        success: false,
        message: 'Delivery address is required for delivery orders'
      });
    }

    // Validate payment method
    if (!paymentMethod || !['mpesa', 'card', 'cash'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Valid payment method is required (mpesa, card, or cash)'
      });
    }

    // Handle M-Pesa payment
    if (paymentMethod === 'mpesa') {
      const { mpesaPhoneNumber } = req.body;
      
      if (!mpesaPhoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'M-Pesa phone number is required for M-Pesa payments'
        });
      }

      // Create order with pending payment status
      const orderData = {
        user: user._id,
        items,
        totalAmount,
        deliveryFee,
        serviceType,
        deliveryAddress: serviceType === 'delivery' ? deliveryAddress : undefined,
        paymentMethod,
        promoCode,
        discountApplied,
        orderStatus: 'pending_payment',
        mpesaPhoneNumber
      };

      const order = new Order(orderData);
      await order.save();

      // Initiate STK Push
      const stkResult = await mpesaService.initiateSTKPush(
        mpesaPhoneNumber,
        totalAmount,
        order._id,
        `Payment for order #${order._id}`
      );

      if (!stkResult.success) {
        // If STK push fails, delete the order and return error
        await Order.findByIdAndDelete(order._id);
        return res.status(400).json({
          success: false,
          message: 'Failed to initiate M-Pesa payment',
          error: stkResult.error
        });
      }

      // Update order with STK push details
      order.mpesaCheckoutRequestID = stkResult.data.CheckoutRequestID;
      order.mpesaMerchantRequestID = stkResult.data.MerchantRequestID;
      await order.save();

      return res.status(201).json({
        success: true,
        message: 'Order created and M-Pesa STK push initiated',
        data: {
          order,
          mpesa: {
            checkoutRequestID: stkResult.data.CheckoutRequestID,
            merchantRequestID: stkResult.data.MerchantRequestID,
            customerMessage: stkResult.data.CustomerMessage,
            responseCode: stkResult.data.ResponseCode
          }
        }
      });
    }

    // Handle other payment methods (card, cash)
    const orderData = {
      user: user._id,
      items,
      totalAmount,
      deliveryFee,
      serviceType,
      deliveryAddress: serviceType === 'delivery' ? deliveryAddress : undefined,
      paymentMethod,
      promoCode,
      discountApplied,
      orderStatus: 'pending'
    };

    const order = new Order(orderData);
    await order.save();

    // Send notification
    await sendOrderNotification(user, order);

    res.status(201).json({
      success: true,
      message: 'Order created successfully from cart',
      data: order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

exports.getUserOrders = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone');
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Get user from database
    const user = await User.findById(req.user.uid);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify order belongs to user
    if (order.user.toString() !== user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    res.json(order);
  } catch (error) {
    next(error);
  }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only admin or staff can update status
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    order.orderStatus = status;
    await order.save();

    // Send status update notification
    const user = await User.findById(order.user);
    await sendOrderNotification(user, order);

    res.json(order);
  } catch (error) {
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone');

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Get user from database
    const user = await User.findById(req.user.uid);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify order belongs to user
    if (order.user.toString() !== user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Only allow cancellation if order is not completed or cancelled
    if (['completed', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    order.orderStatus = 'cancelled';
    await order.save();

    // Send cancellation notification
    await sendOrderNotification(user, order);

    res.json(order);
  } catch (error) {
    next(error);
  }
};

exports.rateOrder = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify order belongs to user
    const user = await User.findById(req.user.uid);
    if (order.user.toString() !== user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Only allow rating for completed orders
    if (order.orderStatus !== 'completed') {
      return res.status(400).json({ message: 'Can only rate completed orders' });
    }

    order.rating = rating;
    order.review = review;
    await order.save();

    res.json(order);
  } catch (error) {
    next(error);
  }
};

exports.getOrderStats = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const stats = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { orderStatus: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      statusBreakdown: stats,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    next(error);
  }
};

exports.getPendingOrders = async (req, res, next) => {
  try {
    if (!['admin', 'staff'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const orders = await Order.find({ orderStatus: 'pending' })
      .sort({ createdAt: 1 })
      .populate('user', 'name email phone');

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

exports.assignOrder = async (req, res, next) => {
  try {
    const { staffId } = req.body;
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify staff exists
    const staff = await User.findOne({ _id: staffId, role: 'staff' });
    if (!staff) {
      return res.status(404).json({ message: 'Staff member not found' });
    }

    order.assignedTo = staffId;
    await order.save();

    // Send assignment notification
    await sendOrderNotification(staff, order);

    res.json(order);
  } catch (error) {
    next(error);
  }
};

exports.updateOrder = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate('user', 'name email phone');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
};

exports.deleteOrder = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }

    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Cart-related functions
exports.getCart = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      // Create empty cart if it doesn't exist
      cart = new Cart({ 
        user: userId, 
        items: [] 
      });
      await cart.save();
    }

    res.json({
      success: true,
      message: 'Cart retrieved successfully',
      data: {
        items: cart.items,
        subtotal: cart.subtotal,
        deliveryFee: 0, // Default delivery fee
        total: cart.subtotal,
        itemCount: cart.itemCount
      }
    });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve cart',
      error: error.message
    });
  }
};

exports.addToCart = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { menuItemId, quantity = 1, specialInstructions } = req.body;

    if (!menuItemId) {
      return res.status(400).json({
        success: false,
        message: 'menuItemId is required'
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    // Fetch menu item details from database
    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    if (!menuItem.available) {
      return res.status(400).json({
        success: false,
        message: 'This menu item is currently unavailable'
      });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => 
      item.menuItemId.toString() === menuItemId.toString()
    );

    if (existingItemIndex !== -1) {
      // Update existing item quantity
      cart.items[existingItemIndex].quantity += quantity;
      if (specialInstructions) {
        cart.items[existingItemIndex].specialInstructions = specialInstructions;
      }
    } else {
      // Add new item with details from database
      cart.items.push({
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: parseInt(quantity),
        specialInstructions: specialInstructions || ''
      });
    }

    await cart.save();

    res.json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        menuItemId: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: parseInt(quantity),
        specialInstructions: specialInstructions || ''
      }
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to cart',
      error: error.message
    });
  }
};

exports.removeFromCart = async (req, res, next) => {
  try {
    const { menuItemId } = req.params;

    if (!menuItemId) {
      return res.status(400).json({
        success: false,
        message: 'menuItemId is required'
      });
    }

    const userId = req.user.uid;
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found for this user'
      });
    }

    // Remove item from cart
    cart.items = cart.items.filter(item => 
      item.menuItemId.toString() !== menuItemId.toString()
    );

    await cart.save();

    res.json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart',
      error: error.message
    });
  }
};

exports.updateCartItem = async (req, res, next) => {
  try {
    const { menuItemId } = req.params;
    const { quantity, specialInstructions } = req.body;

    if (!menuItemId) {
      return res.status(400).json({
        success: false,
        message: 'menuItemId is required'
      });
    }

    if (quantity !== undefined && quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const userId = req.user.uid;
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found for this user'
      });
    }

    const itemIndex = cart.items.findIndex(item => 
      item.menuItemId.toString() === menuItemId.toString()
    );
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    // Update item
    if (quantity !== undefined) {
      cart.items[itemIndex].quantity = parseInt(quantity);
    }
    if (specialInstructions !== undefined) {
      cart.items[itemIndex].specialInstructions = specialInstructions;
    }

    await cart.save();

    res.json({
      success: true,
      message: 'Cart item updated successfully',
      data: {
        menuItemId,
        quantity: cart.items[itemIndex].quantity,
        specialInstructions: cart.items[itemIndex].specialInstructions
      }
    });
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cart item',
      error: error.message
    });
  }
};

exports.clearCart = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found for this user'
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear cart',
      error: error.message
    });
  }
};

exports.handleMpesaCallback = async (req, res, next) => {
  try {
    const callbackData = req.body;
    console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2));

    // Extract callback data
    const {
      Body: {
        stkCallback: {
          CheckoutRequestID,
          ResultCode,
          ResultDesc,
          CallbackMetadata
        }
      }
    } = callbackData;

    // Find order by checkout request ID
    const order = await Order.findOne({ mpesaCheckoutRequestID: CheckoutRequestID });
    if (!order) {
      console.error('Order not found for checkout request ID:', CheckoutRequestID);
      return res.status(404).json({ message: 'Order not found' });
    }

    // Extract transaction details
    let transactionDetails = {};
    if (CallbackMetadata && CallbackMetadata.Item) {
      CallbackMetadata.Item.forEach(item => {
        transactionDetails[item.Name] = item.Value;
      });
    }

    // Update order based on result
    if (ResultCode === 0) {
      // Payment successful
      order.orderStatus = 'pending';
      order.paymentStatus = 'paid';
      order.mpesaTransactionID = transactionDetails.MpesaReceiptNumber;
      order.mpesaTransactionDate = transactionDetails.TransactionDate;
      order.mpesaAmount = transactionDetails.Amount;
      order.mpesaPhoneNumber = transactionDetails.PhoneNumber;
      
      await order.save();
      
      // Send notification
      const user = await User.findById(order.user);
      await sendOrderNotification(user, order);

      console.log(`Payment successful for order ${order._id}: ${transactionDetails.MpesaReceiptNumber}`);
    } else {
      // Payment failed
      order.orderStatus = 'cancelled';
      order.paymentStatus = 'failed';
      order.mpesaResultCode = ResultCode;
      order.mpesaResultDesc = ResultDesc;
      
      await order.save();
      
      console.log(`Payment failed for order ${order._id}: ${ResultDesc}`);
    }

    res.json({ 
      success: true, 
      message: 'Callback processed successfully',
      orderId: order._id,
      resultCode: ResultCode
    });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process callback',
      error: error.message 
    });
  }
};

exports.verifyMpesaPayment = async (req, res, next) => {
  try {
    const { checkoutRequestID } = req.params;
    
    if (!checkoutRequestID) {
      return res.status(400).json({
        success: false,
        message: 'Checkout request ID is required'
      });
    }

    const result = await mpesaService.verifyPayment(checkoutRequestID);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: 'Failed to verify payment',
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Payment verification completed',
      data: result.data
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};