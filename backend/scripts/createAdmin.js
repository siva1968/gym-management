const dotenv = require('dotenv');
const { sequelize, testConnection } = require('../config/database');
const User = require('../models/User');

dotenv.config();

const createAdminUser = async () => {
  try {
    await testConnection();
    console.log('Connected to PostgreSQL');

    // Sync the User model (create table if not exists)
    await User.sync();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ where: { email: 'admin@elitearena.com' } });

    if (existingAdmin) {
      console.log('Admin user already exists');
      await sequelize.close();
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      name: 'Admin',
      email: process.env.ADMIN_EMAIL || 'admin@elitearena.com',
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'owner',
      phone: '1234567890',
      isActive: true
    });

    console.log('Admin user created successfully');
    console.log('Email:', admin.email);
    console.log('Default Password: Admin@123');
    console.log('Please change the password after first login');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  }
};

createAdminUser();
