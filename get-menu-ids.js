require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('./src/models/MenuItem');

async function getMenuItems() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const menuItems = await MenuItem.find({}, '_id name price category');
    
    console.log('\n=== Available Menu Items ===');
    console.log('Use these IDs in your order JSON:');
    console.log('');
    
    menuItems.forEach(item => {
      console.log(`ID: ${item._id}`);
      console.log(`Name: ${item.name}`);
      console.log(`Price: $${item.price}`);
      console.log(`Category: ${item.category}`);
      console.log('---');
    });
    
    console.log('\n=== Sample Order JSON ===');
    console.log('Copy this and replace the menuItemId with one from above:');
    console.log('');
    console.log(JSON.stringify({
      "items": [
        {
          "menuItemId": menuItems[0]?._id || "REPLACE_WITH_ACTUAL_ID",
          "name": menuItems[0]?.name || "Item Name",
          "price": menuItems[0]?.price || 0,
          "quantity": 1,
          "specialInstructions": "Extra hot"
        }
      ],
      "totalAmount": menuItems[0]?.price || 0,
      "serviceType": "takeaway",
      "paymentMethod": "cash"
    }, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

getMenuItems(); 