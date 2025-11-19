const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const createAdminUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elite-arena-gym', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@elitearena.com' });

    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = new User({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@elitearena.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'owner',
      phone: '1234567890',
      isActive: true
    });

    await admin.save();

    console.log('Admin user created successfully');
    console.log('Email:', admin.email);
    console.log('Default Password: Admin@123');
    console.log('Please change the password after first login');

    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdminUser();
