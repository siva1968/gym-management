const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MembershipPlan = sequelize.define('MembershipPlan', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  duration: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: { value: 1, unit: 'months' }
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  features: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  membershipType: {
    type: DataTypes.ENUM('Strength', 'Strength + Cardio', 'Cardio', 'Personal Training', 'Group Classes'),
    allowNull: false
  },
  discount: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true,
  tableName: 'membership_plans'
});

// Instance method for final price calculation
MembershipPlan.prototype.getFinalPrice = function() {
  return parseFloat(this.price) - (parseFloat(this.price) * parseFloat(this.discount) / 100);
};

module.exports = MembershipPlan;
