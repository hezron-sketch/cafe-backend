const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');
const Payment = require('../models/Payment');

// Dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      totalCustomers,
      totalMenuItems,
      totalRevenue,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'delivered' }),
      User.countDocuments({ role: 'customer' }),
      MenuItem.countDocuments(),
      Order.aggregate([
        { $match: { status: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    // Get daily revenue for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: 'delivered',
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get category statistics
    const categoryStats = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.category',
          orders: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      {
        $project: {
          category: '$_id',
          orders: 1,
          revenue: 1,
          percentage: { $multiply: [{ $divide: ['$revenue', totalRevenue[0]?.total || 1] }, 100] },
        },
      },
    ]);

    const stats = {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalCustomers,
      totalMenuItems,
      totalRevenue: totalRevenue[0]?.total || 0,
      dailyRevenue: dailyRevenue.map(item => ({
        date: item._id,
        revenue: item.revenue,
        orders: item.orders,
      })),
      categoryStats: categoryStats.map(item => ({
        category: item.category,
        orders: item.orders,
        revenue: item.revenue,
        percentage: item.percentage,
      })),
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard statistics',
    });
  }
};

// Get all orders with filters
exports.getOrders = async (req, res) => {
  try {
    const { status, paymentStatus, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (paymentStatus && paymentStatus !== 'all') filter.paymentStatus = paymentStatus;

    const orders = await Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      success: true,
      data: {
        orders,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const order = await Order.findByIdAndUpdate(
      orderId,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('user', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
    });
  }
};

// Get all menu items with filters
exports.getMenuItems = async (req, res) => {
  try {
    const { category, available, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (category && category !== 'all') filter.category = category;
    if (available !== undefined) filter.available = available === 'true';

    const items = await MenuItem.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MenuItem.countDocuments(filter);

    res.json({
      success: true,
      data: {
        items,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error getting menu items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get menu items',
    });
  }
};

// Create menu item
exports.createMenuItem = async (req, res) => {
  try {
    const menuItem = new MenuItem(req.body);
    await menuItem.save();

    res.status(201).json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create menu item',
    });
  }
};

// Update menu item
exports.updateMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const updates = { ...req.body, updatedAt: new Date() };

    const menuItem = await MenuItem.findByIdAndUpdate(itemId, updates, { new: true });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    res.json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update menu item',
    });
  }
};

// Delete menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const menuItem = await MenuItem.findByIdAndDelete(itemId);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found',
      });
    }

    res.json({
      success: true,
      message: 'Menu item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete menu item',
    });
  }
};

// Get all customers with filters
exports.getCustomers = async (req, res) => {
  try {
    const { search, verified, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { role: 'customer' };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (verified !== undefined) filter.emailVerified = verified === 'true';

    const customers = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get order statistics for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orders = await Order.find({ user: customer._id });
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const lastOrder = orders.length > 0 ? orders[0].createdAt : null;

        return {
          ...customer.toObject(),
          totalOrders,
          totalSpent,
          lastOrderDate: lastOrder,
        };
      })
    );

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: {
        customers: customersWithStats,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error getting customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get customers',
    });
  }
};

// Get all payments with filters
exports.getPayments = async (req, res) => {
  try {
    const { status, paymentMethod, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const filter = {};
    if (status && status !== 'all') filter.status = status;
    if (paymentMethod && paymentMethod !== 'all') filter.paymentMethod = paymentMethod;

    const payments = await Payment.find(filter)
      .populate('orderId', 'customerName customerEmail')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payment.countDocuments(filter);

    res.json({
      success: true,
      data: {
        payments,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error getting payments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payments',
    });
  }
}; 