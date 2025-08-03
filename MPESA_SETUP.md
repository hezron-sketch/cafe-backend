# M-Pesa Integration Setup

This guide explains how to set up M-Pesa mobile payment integration for the cafe backend.

## Prerequisites

1. M-Pesa Developer Account (https://developer.safaricom.co.ke/)
2. Business Short Code (BSC)
3. Consumer Key and Secret
4. Passkey

## Environment Variables

Add the following variables to your `.env` file:

```env
# M-Pesa Configuration
MPESA_BASE_URL=https://sandbox.safaricom.co.ke
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASSKEY=your_mpesa_passkey_here
MPESA_CONSUMER_KEY=your_consumer_key_here
MPESA_CONSUMER_SECRET=your_consumer_secret_here
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa/callback
```

## Getting M-Pesa Credentials

1. **Register for M-Pesa Developer Account**
   - Go to https://developer.safaricom.co.ke/
   - Create an account and verify your email

2. **Create an App**
   - Log in to your developer account
   - Create a new app for your cafe
   - Note down the Consumer Key and Consumer Secret

3. **Get Business Short Code**
   - Apply for a Business Short Code through Safaricom
   - This is your unique merchant code

4. **Generate Passkey**
   - Use the M-Pesa API to generate your passkey
   - This is used for API authentication

## Testing

### Sandbox Environment
- Use the sandbox URL: `https://sandbox.safaricom.co.ke`
- Test with sandbox phone numbers provided by Safaricom
- Use test Business Short Code: `174379`

### Production Environment
- Use the production URL: `https://api.safaricom.co.ke`
- Use your actual Business Short Code
- Use real phone numbers

## API Endpoints

### Initiate Payment
```
POST /api/payments/mpesa/initiate
{
  "orderId": "order_id",
  "phoneNumber": "0712345678"
}
```

### Check Payment Status
```
GET /api/payments/status/:paymentId
```

### Payment History
```
GET /api/payments/history?page=1&limit=10
```

### M-Pesa Callback
```
POST /api/payments/mpesa/callback
```

## Flutter App Integration

The Flutter app includes:
- Payment screen with M-Pesa integration
- Phone number validation
- Payment status tracking
- Error handling

## Testing the Integration

1. Start the backend server
2. Run the Flutter app
3. Create an order
4. Navigate to payment screen
5. Enter a test phone number
6. Tap "Pay with M-Pesa"
7. Check for STK push notification

## Troubleshooting

### Common Issues

1. **Invalid Credentials**
   - Verify your Consumer Key and Secret
   - Check Business Short Code format

2. **Phone Number Format**
   - Use Kenyan format: 0712345678
   - Remove +254 prefix

3. **Callback URL**
   - Ensure your server is accessible
   - Use HTTPS for production

4. **Network Issues**
   - Check internet connectivity
   - Verify firewall settings

### Error Codes

- `0`: Success
- `1032`: User cancelled
- `1037`: Request timeout
- `1038`: Invalid transaction
- `1039`: Invalid amount
- `1040`: Invalid phone number

## Security Considerations

1. **Environment Variables**
   - Never commit credentials to version control
   - Use secure environment variable management

2. **HTTPS**
   - Always use HTTPS in production
   - Secure your callback URL

3. **Input Validation**
   - Validate phone numbers
   - Sanitize all inputs

4. **Error Handling**
   - Log errors securely
   - Don't expose sensitive information

## Production Deployment

1. **SSL Certificate**
   - Install valid SSL certificate
   - Update callback URL to HTTPS

2. **Database**
   - Use production database
   - Backup payment records

3. **Monitoring**
   - Monitor payment success rates
   - Set up error alerts

4. **Compliance**
   - Follow M-Pesa terms of service
   - Implement proper logging 