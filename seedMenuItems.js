require('dotenv').config();
const mongoose = require('mongoose');
const MenuItem = require('./src/models/MenuItem');

const sampleMenuItems = [
  {
    name: "Espresso",
    description: "Strong black coffee",
    price: 3.5,
    category: "drink",
    dietaryTags: ["vegan"],
    preparationTime: 5,
    imageUrl: "/public/images/food.jpg",
  },
  {
    name: "Cappuccino",
    description: "Espresso with steamed milk and foam",
    price: 4.5,
    category: "drink",
    dietaryTags: ["vegetarian"],
    preparationTime: 7,
    imageUrl: "https://example.com/cappuccino.jpg",
  },
  {
    name: "Avocado Toast",
    description: "Sourdough bread with mashed avocado and toppings",
    price: 8.5,
    category: "main",
    dietaryTags: ["vegetarian", "vegan"],
    preparationTime: 10,
    imageUrl: "https://example.com/avocado-toast.jpg",
  },
  {
    name: "Chicken Caesar Salad",
    description:
      "Romaine lettuce with grilled chicken, croutons and Caesar dressing",
    price: 10.5,
    category: "main",
    preparationTime: 12,
    imageUrl: "https://example.com/caesar-salad.jpg",
  },
  {
    name: "Chocolate Cake",
    description: "Rich chocolate cake with ganache",
    price: 6.0,
    category: "dessert",
    dietaryTags: ["vegetarian"],
    isFeatured: true,
    preparationTime: 2,
    imageUrl: "https://example.com/chocolate-cake.jpg",
  },
  {
    name: "Iced Latte",
    description: "Espresso with cold milk over ice",
    price: 4.75,
    category: "drink",
    dietaryTags: ["vegetarian"],
    preparationTime: 5,
    imageUrl: "https://example.com/iced-latte.jpg",
  },
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing items
    await MenuItem.deleteMany({});
    console.log('Cleared existing menu items');
    
    // Insert sample items
    await MenuItem.insertMany(sampleMenuItems);
    console.log('Successfully seeded menu items');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();