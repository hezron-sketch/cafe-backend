const { admin } = require('../config/firebase');
const User = require('../models/User');

const sendOrderNotification = async (userId, orderId, status = 'confirmed') => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.fcmToken) return;

    let message = {};
    const statusMessages = {
      'confirmed': 'Your order has been confirmed!',
      'preparing': 'Your order is being prepared',
      'ready': 'Your order is ready for pickup',
      'out-for-delivery': 'Your order is on the way!',
      'delivered': 'Your order has been delivered'
    };

    if (status === 'confirmed') {
      message = {
        notification: {
          title: 'Order Confirmed',
          body: statusMessages[status]
        },
        data: {
          orderId: orderId.toString(),
          type: 'order-update',
          status
        },
        token: user.fcmToken
      };
    } else if (statusMessages[status]) {
      message = {
        notification: {
          title: 'Order Update',
          body: statusMessages[status]
        },
        data: {
          orderId: orderId.toString(),
          type: 'order-update',
          status
        },
        token: user.fcmToken
      };
    }

    if (message.token) {
      await admin.messaging().send(message);
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

module.exports = { sendOrderNotification };