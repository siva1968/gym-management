const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Trainer = sequelize.define('Trainer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  trainerId: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other')
  },
  address: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  // Professional details
  specialization: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  experience: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  },
  certifications: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  // Employment details
  joiningDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  employmentType: {
    type: DataTypes.ENUM('full-time', 'part-time', 'contract'),
    defaultValue: 'full-time'
  },
  // Shift timings
  shiftTimings: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  // Salary details
  salaryType: {
    type: DataTypes.ENUM('fixed', 'commission', 'mixed'),
    defaultValue: 'fixed'
  },
  baseSalary: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    }
  },
  maxCapacity: {
    type: DataTypes.INTEGER,
    defaultValue: 20
  },
  // Status
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Photo
  photo: {
    type: DataTypes.STRING
  },
  // Bio
  bio: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  tableName: 'trainers'
});

module.exports = Trainer;
