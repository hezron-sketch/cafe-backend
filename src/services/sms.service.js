// SMS Service for OTP verification
// You can integrate with services like Twilio, Africa's Talking, etc.

const sendSmsOtp = async (phoneNumber, otp) => {
  try {
    // For development/testing, we'll just log the OTP
    // In production, integrate with actual SMS service
    console.log(`📱 SMS OTP sent to ${phoneNumber}: ${otp}`);
    
    // Example integration with Twilio (uncomment and configure)
    /*
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = require('twilio')(accountSid, authToken);
    
    await client.messages.create({
      body: `Your Cafe X verification code is: ${otp}. Valid for 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    */
    
    // Example integration with Africa's Talking (uncomment and configure)
    /*
    const AfricasTalking = require('africastalking');
    const africastalking = AfricasTalking({
      apiKey: process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME
    });
    
    await africastalking.SMS.send({
      to: phoneNumber,
      message: `Your Cafe X verification code is: ${otp}. Valid for 10 minutes.`
    });
    */
    
    return true;
  } catch (error) {
    console.error('Error sending SMS OTP:', error);
    return false;
  }
};

const sendSmsWelcome = async (phoneNumber, userName) => {
  try {
    console.log(`📱 Welcome SMS sent to ${phoneNumber} for user: ${userName}`);
    
    // Example integration with actual SMS service
    /*
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const client = require('twilio')(accountSid, authToken);
    
    await client.messages.create({
      body: `Welcome to Cafe X, ${userName}! Your account has been successfully created.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    */
    
    return true;
  } catch (error) {
    console.error('Error sending welcome SMS:', error);
    return false;
  }
};

module.exports = {
  sendSmsOtp,
  sendSmsWelcome
}; 