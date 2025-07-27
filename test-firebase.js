require('dotenv').config();
const { admin, testFirebaseConnection } = require('./src/config/firebase');

async function testFirebase() {
  try {
    console.log('Testing Firebase connection...');
    const isConnected = await testFirebaseConnection();
    
    if (isConnected) {
      console.log('✅ Firebase connection successful!');
      
      // Try to create a test user
      try {
        const testUser = await admin.auth().createUser({
          email: 'test@example.com',
          password: 'testpassword123',
          displayName: 'Test User'
        });
        console.log('✅ Test user created successfully:', testUser.uid);
        
        // Clean up - delete the test user
        await admin.auth().deleteUser(testUser.uid);
        console.log('✅ Test user deleted successfully');
        
      } catch (userError) {
        console.error('❌ Test user creation failed:', userError.message);
      }
      
    } else {
      console.log('❌ Firebase connection failed');
    }
  } catch (error) {
    console.error('❌ Firebase test failed:', error.message);
  }
}

testFirebase(); 