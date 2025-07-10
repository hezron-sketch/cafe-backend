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

exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Verify order belongs to user
    if (order.user.toString() !== req.user.uid && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Only allow cancellation if order is not completed or cancelled
    if (['completed', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Cannot cancel this order' });
    }

    order.orderStatus = 'cancelled';
    await order.save();

    // Send cancellation notification
    const user = await User.findById(order.user);
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
    if (order.user.toString() !== req.user.uid) {
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