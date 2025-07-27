const admin = require('firebase-admin');

// Initialize with service account
try {
  const serviceAccount = require('../../serviceAccountKey.json');
  
  // Ensure private key is properly formatted
  if (serviceAccount.private_key) {
    // Replace literal \n with actual newlines if needed
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id
  });
  
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error.message);
  console.error('Error details:', error);
  
  // Try alternative initialization with environment variables
  try {
    console.log('Attempting alternative Firebase initialization...');
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID || 'cafe-backend-428bf'
    });
    console.log('Firebase Admin SDK initialized with application default credentials');
  } catch (altError) {
    console.error('Alternative Firebase initialization also failed:', altError.message);
    throw error; // Throw the original error
  }
}

// Test Firebase connection
const testFirebaseConnection = async () => {
  try {
    // Try to list users (this will test the connection)
    const listUsersResult = await admin.auth().listUsers(1);
    console.log('Firebase connection test successful');
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error.message);
    return false;
  }
};

// Optional: Set custom claims middleware
admin.setCustomUserClaims = async (uid, claims) => {
  await admin.auth().setCustomUserClaims(uid, claims);
};

module.exports = { admin, testFirebaseConnection };