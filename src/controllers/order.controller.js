const Order = require('../models/Order');
const User = require('../models/User');
const { sendOrderNotification } = require('../services/notification.service');

exports.createOrder = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const orderData = {
      user: user._id,
      ...req.body
    };
    const order = new Order(orderData);
    await order.save();
    // Send notification
    await sendOrderNotification(user, order);
    res.status(201).json(order);
  } catch (error) {
    next(error);
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
    // Verify order belongs to user
    const user = await User.findById(req.user.uid);
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