# M-Pesa Integration Setup Guide

## Overview
This guide explains how to set up M-Pesa STK Push integration for the cafe ordering system.

## Prerequisites
1. Safaricom Developer Account
2. M-Pesa API credentials
3. Valid business shortcode
4. Passkey from Safaricom

## Environment Variables

Add these variables to your `.env` file:

```env
# M-Pesa Configuration
MPESA_BASE_URL=https://sandbox.safaricom.co.ke
MPESA_CONSUMER_KEY=your_mpesa_consumer_key_here
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret_here
MPESA_PASSKEY=your_mpesa_passkey_here
MPESA_SHORTCODE=your_mpesa_shortcode_here
MPESA_CALLBACK_URL=https://your-domain.com/api/orders/mpesa/callback
```

## API Endpoints

### 1. Create Order with M-Pesa Payment
```http
POST /api/orders
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "items": [...],
  "serviceType": "delivery",
  "paymentMethod": "mpesa",
  "mpesaPhoneNumber": "0712345678",
  "deliveryAddress": {...}
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order created and M-Pesa STK push initiated",
  "data": {
    "order": {...},
    "mpesa": {
      "checkoutRequestID": "ws_CO_123456789",
      "merchantRequestID": "12345-12345678-1",
      "customerMessage": "Success. Request accepted for processing",
      "responseCode": "0"
    }
  }
}
```

### 2. M-Pesa Callback (Webhook)
```http
POST /api/orders/mpesa/callback
Content-Type: application/json

{
  "Body": {
    "stkCallback": {
      "CheckoutRequestID": "ws_CO_123456789",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          {"Name": "Amount", "Value": 100},
          {"Name": "MpesaReceiptNumber", "Value": "QK12345678"},
          {"Name": "TransactionDate", "Value": "20250104123456"},
          {"Name": "PhoneNumber", "Value": "254712345678"}
        ]
      }
    }
  }
}
```

### 3. Verify Payment Status
```http
GET /api/orders/mpesa/verify/:checkoutRequestID
Authorization: Bearer <jwt_token>
```

## Order Status Flow

1. **pending_payment** - Order created, waiting for M-Pesa payment
2. **pending** - Payment received, order confirmed
3. **confirmed** - Restaurant confirmed order
4. **preparing** - Food being prepared
5. **out-for-delivery** - Order on the way
6. **delivered** - Order completed
7. **cancelled** - Order cancelled

## M-Pesa Fields in Order Model

```javascript
// M-Pesa payment fields
mpesaPhoneNumber: { type: String },
mpesaCheckoutRequestID: { type: String },
mpesaMerchantRequestID: { type: String },
mpesaTransactionID: { type: String },
mpesaTransactionDate: { type: String },
mpesaAmount: { type: Number },
mpesaResultCode: { type: Number },
mpesaResultDesc: { type: String }
```

## Testing

### Sandbox Testing
1. Use sandbox URLs and credentials
2. Test with sandbox phone numbers
3. Use test amounts (1 KES minimum)

### Production Setup
1. Replace sandbox URLs with production URLs
2. Use real M-Pesa credentials
3. Configure proper callback URLs
4. Test with real phone numbers

## Error Handling

Common M-Pesa errors:
- `BUSY` - System busy, retry later
- `TIMEOUT` - Request timeout
- `INVALID_AMOUNT` - Amount not allowed
- `INVALID_PHONE_NUMBER` - Invalid phone format
- `INSUFFICIENT_FUNDS` - Insufficient M-Pesa balance

## Security Considerations

1. **Phone Number Validation**: Ensure proper Kenyan phone number format
2. **Amount Validation**: M-Pesa requires integer amounts
3. **Callback Verification**: Verify callback authenticity
4. **Error Handling**: Handle all possible M-Pesa response codes
5. **Logging**: Log all M-Pesa transactions for audit

## Integration Steps

1. **Setup Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your M-Pesa credentials
   ```

2. **Install Dependencies**
   ```bash
   npm install axios crypto
   ```

3. **Test Integration**
   ```bash
   # Test with sandbox credentials first
   curl -X POST /api/orders \
     -H "Authorization: Bearer <token>" \
     -d '{
       "items": [...],
       "paymentMethod": "mpesa",
       "mpesaPhoneNumber": "254708374149"
     }'
   ```

4. **Monitor Callbacks**
   ```bash
   # Check server logs for callback processing
   tail -f logs/app.log
   ```

## Troubleshooting

### Common Issues

1. **Access Token Errors**
   - Check consumer key and secret
   - Verify API endpoint URLs

2. **STK Push Failures**
   - Validate phone number format
   - Check amount (must be integer)
   - Verify shortcode and passkey

3. **Callback Issues**
   - Ensure callback URL is accessible
   - Check server logs for errors
   - Verify callback data structure

4. **Payment Verification**
   - Use correct checkout request ID
   - Check payment status timing

## Support

For M-Pesa API issues:
- Safaricom Developer Portal: https://developer.safaricom.co.ke
- M-Pesa API Documentation: https://developer.safaricom.co.ke/docs
- Support Email: apisupport@safaricom.co.ke 