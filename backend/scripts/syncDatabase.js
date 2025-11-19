const dotenv = require('dotenv');
const { sequelize, testConnection } = require('../config/database');
const db = require('../models');

dotenv.config();

const syncDatabase = async () => {
  try {
    await testConnection();
    console.log('Connected to PostgreSQL');

    // Sync all models (create/update tables)
    console.log('Syncing database...');

    // Use { alter: true } to update existing tables without dropping data
    // Use { force: true } to drop and recreate all tables (WARNING: deletes all data)
    const syncOptions = process.argv.includes('--force')
      ? { force: true }
      : { alter: true };

    await sequelize.sync(syncOptions);

    if (syncOptions.force) {
      console.log('✅ Database synced with force (all tables recreated)');
    } else {
      console.log('✅ Database synced (tables updated)');
    }

    console.log('\nAll tables synced successfully:');
    console.log('- users');
    console.log('- members');
    console.log('- trainers');
    console.log('- membership_plans');
    console.log('- attendances');
    console.log('- payments');
    console.log('- expenses');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error syncing database:', error);
    process.exit(1);
  }
};

syncDatabase();
