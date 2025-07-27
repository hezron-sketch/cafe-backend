require('dotenv').config();
const { admin } = require('./src/config/firebase');
const mongoose = require('mongoose');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

const seedUsers = [
  {
    email: 'mtuhalff@gmail.com',
    password: 'AdminPass123',
    name: 'Cafe Admin',
    phone: '+254700000001',
    role: 'admin',
    addresses: [{
      label: 'work',
      street: '123 Admin Street',
      city: 'Nairobi',
      postalCode: '00100',
      coordinates: { lat: -1.2921, lng: 36.8219 },
      isDefault: true
    }]
  },
  {
    email: 'staff@cafe.com',
    password: 'StaffPass123',
    name: 'Cafe Staff',
    phone: '+254700000002',
    role: 'staff',
    addresses: [{
      label: 'work',
      street: '456 Staff Avenue',
      city: 'Nairobi',
      postalCode: '00100',
      coordinates: { lat: -1.3021, lng: 36.8319 }
    }]
  },
  {
    email: 'customer@cafe.com',
    password: 'CustomerPass123',
    name: 'Regular Customer',
    phone: '+254700000003',
    role: 'customer',
    addresses: [
      {
        label: 'home',
        street: '789 Customer Lane',
        city: 'Nairobi',
        postalCode: '00100',
        coordinates: { lat: -1.2821, lng: 36.8119 },
        isDefault: true
      },
      {
        label: 'work',
        street: '321 Office Road',
        city: 'Nairobi',
        postalCode: '00200',
        coordinates: { lat: -1.2721, lng: 36.8019 }
      }
    ]
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing MongoDB users (but keep Firebase users)
    await User.deleteMany({});
    console.log('Cleared existing MongoDB users');

    // Seed new users
    for (const userData of seedUsers) {
      try {
        let firebaseUser;
        
        // Check if Firebase user already exists
        try {
          firebaseUser = await admin.auth().getUserByEmail(userData.email);
          console.log(`Firebase user ${userData.email} already exists, updating...`);
          
          // Update existing Firebase user
          await admin.auth().updateUser(firebaseUser.uid, {
            email: userData.email,
            password: userData.password,
            displayName: userData.name
          });
        } catch (error) {
          if (error.code === 'auth/user-not-found') {
            // Create new Firebase user if doesn't exist
            firebaseUser = await admin.auth().createUser({
              email: userData.email,
              password: userData.password,
              displayName: userData.name
            });
            console.log(`Created new Firebase user: ${userData.email}`);
          } else {
            throw error;
          }
        }

        // Hash the password for MongoDB storage
        const hashedPassword = await bcrypt.hash(userData.password, 12);

        // Create/update MongoDB user with all fields
        const user = await User.findOneAndUpdate(
          { email: userData.email },
          {
            firebaseUid: firebaseUser.uid,
            email: userData.email,
            password: hashedPassword,
            name: userData.name,
            phone: userData.phone,
            role: userData.role,
            addresses: userData.addresses,
            passwordChangedAt: new Date(Date.now() - 1000),
            isActive: true
          },
          { 
            upsert: true, 
            new: true,
            setDefaultsOnInsert: true 
          }
        );

        // Set custom claims for role-based access
        await admin.auth().setCustomUserClaims(firebaseUser.uid, { 
          role: userData.role 
        });

        console.log(`Successfully processed user: ${userData.email} (${userData.role})`);
      } catch (error) {
        console.error(`Error processing user ${userData.email}:`, error.message);
        // Continue with next user even if one fails
      }
    }

    console.log('Database seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedDatabase();