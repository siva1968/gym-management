const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Expense = sequelize.define('Expense', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('Rent', 'Equipment', 'Utilities', 'Salaries', 'Marketing', 'Maintenance', 'Supplies', 'Other'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'upi', 'card', 'net-banking', 'cheque'),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  receipt: {
    type: DataTypes.STRING,
    comment: 'File path for receipt image'
  },
  vendor: {
    type: DataTypes.STRING
  },
  isRecurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  recurringPeriod: {
    type: DataTypes.ENUM('daily', 'weekly', 'monthly', 'quarterly', 'yearly')
  },
  addedById: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  tableName: 'expenses',
  indexes: [
    { fields: ['date'] },
    { fields: ['category'] }
  ]
});

module.exports = Expense;
