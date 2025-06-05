const admin = require('firebase-admin');

// Initialize with service account
const serviceAccount = require('../../serviceAccountKey.json'); // Path to your downloaded JSON

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL
});

// Optional: Set custom claims middleware
admin.setCustomUserClaims = async (uid, claims) => {
    await admin.auth().setCustomUserClaims(uid, claims);
};

module.exports = admin;