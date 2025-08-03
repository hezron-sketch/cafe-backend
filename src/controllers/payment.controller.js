const Payment = require('../models/Payment');
const Order = require('../models/Order');
const mpesaService = require('../services/mpesa.service');

// Initiate M-Pesa payment
exports.initiateMpesaPayment = async (req, res, next) => {
  try {
    const { orderId, phoneNumber } = req.body;
    const userId = req.user.uid;

    // Validate required fields
    if (!orderId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order ID and phone number are required'
      });
    }

    // Validate phone number format (Kenyan format)
    const phoneRegex = /^(?:\+254|254|0)?([17]\d{8})$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format. Use Kenyan format (e.g., 0712345678)'
      });
    }

    // Format phone number to 254 format
    const formattedPhone = phoneNumber.replace(/^(?:\+254|254|0)/, '254');

    // Get order details
    const order = await Order.findById(orderId).populate('items.menuItemId');
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only pay for your own orders'
      });
    }

    if (order.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Order is already paid'
      });
    }

    // Calculate total amount
    const totalAmount = order.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Check if payment already exists
    const existingPayment = await Payment.findOne({ orderId, status: { $in: ['pending', 'processing'] } });
    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Payment already in progress for this order'
      });
    }

    // Create payment record
    const payment = new Payment({
      orderId,
      userId,
      amount: totalAmount,
      paymentMethod: 'mpesa',
      status: 'pending'
    });

    // Initiate STK push
    const stkResponse = await mpesaService.initiateSTKPush(
      formattedPhone,
      totalAmount,
      `ORDER_${orderId}`
    );

    // Update payment with M-Pesa details
    payment.mpesaDetails = {
      phoneNumber: formattedPhone,
      checkoutRequestId: stkResponse.checkoutRequestId,
      merchantRequestId: stkResponse.merchantRequestId
    };

    await payment.save();

    res.json({
      success: true,
      message: 'STK push sent successfully',
      data: {
        paymentId: payment._id,
        checkoutRequestId: stkResponse.checkoutRequestId,
        customerMessage: stkResponse.customerMessage,
        amount: totalAmount
      }
    });

  } catch (error) {
    console.error('M-Pesa payment initiation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate payment'
    });
  }
};

// Check payment status
exports.checkPaymentStatus = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user.uid;

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only check your own payments'
      });
    }

    // If payment is still pending, check with M-Pesa
    if (payment.status === 'pending' && payment.mpesaDetails.checkoutRequestId) {
      try {
        const statusResponse = await mpesaService.checkPaymentStatus(
          payment.mpesaDetails.checkoutRequestId
        );

        // Update payment status based on M-Pesa response
        if (statusResponse.resultCode === '0') {
          payment.status = 'completed';
          payment.mpesaDetails.resultCode = statusResponse.resultCode;
          payment.mpesaDetails.resultDesc = statusResponse.resultDesc;
        } else if (statusResponse.resultCode === '1032') {
          payment.status = 'cancelled';
          payment.mpesaDetails.resultCode = statusResponse.resultCode;
          payment.mpesaDetails.resultDesc = statusResponse.resultDesc;
        }

        await payment.save();
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        status: payment.status,
        amount: payment.amount,
        paymentMethod: payment.paymentMethod,
        mpesaDetails: payment.mpesaDetails,
        createdAt: payment.createdAt
      }
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to check payment status'
    });
  }
};

// M-Pesa callback
exports.mpesaCallback = async (req, res, next) => {
  try {
    const callbackData = req.body;
    
    // Process the callback data
    const processedData = mpesaService.processCallback(callbackData);
    
    // Find payment by checkout request ID
    const payment = await Payment.findOne({
      'mpesaDetails.checkoutRequestId': processedData.checkoutRequestId
    });

    if (!payment) {
      console.error('Payment not found for checkout request ID:', processedData.checkoutRequestId);
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Update payment with callback data
    payment.mpesaDetails.resultCode = processedData.resultCode;
    payment.mpesaDetails.resultDesc = processedData.resultDesc;
    payment.mpesaDetails.transactionId = processedData.transactionId;
    payment.mpesaDetails.transactionDate = processedData.transactionDate;

    // Update payment status based on result code
    if (processedData.resultCode === '0') {
      payment.status = 'completed';
      
      // Update order payment status to completed
      await Order.findByIdAndUpdate(payment.orderId, { paymentStatus: 'completed' });
    } else {
      payment.status = 'failed';
    }

    await payment.save();

    res.json({ message: 'Callback processed successfully' });

  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({ message: 'Callback processing failed' });
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { page = 1, limit = 10 } = req.query;

    const payments = await Payment.find({ userId })
      .populate('orderId')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Payment.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        payments,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
        totalPayments: count
      }
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get payment history'
    });
  }
}; 