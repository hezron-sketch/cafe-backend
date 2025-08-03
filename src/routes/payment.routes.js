const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// All payment routes require authentication
router.use(authMiddleware.authenticate);

// Initiate M-Pesa payment
router.post('/mpesa/initiate', paymentController.initiateMpesaPayment);

// Check payment status
router.get('/status/:paymentId', paymentController.checkPaymentStatus);

// Get payment history
router.get('/history', paymentController.getPaymentHistory);

// M-Pesa callback (no auth required as it's called by M-Pesa)
router.post('/mpesa/callback', paymentController.mpesaCallback);

module.exports = router; 