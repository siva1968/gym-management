const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Member = sequelize.define('Member', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  memberId: {
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
    validate: {
      isEmail: true
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  alternatePhone: {
    type: DataTypes.STRING
  },
  dateOfBirth: {
    type: DataTypes.DATEONLY
  },
  age: {
    type: DataTypes.INTEGER
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other')
  },
  // Address as JSONB
  address: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  // Emergency contact as JSONB
  emergencyContact: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  // Physical details
  weight: {
    type: DataTypes.DECIMAL(5, 2)
  },
  height: {
    type: DataTypes.DECIMAL(5, 2)
  },
  bmi: {
    type: DataTypes.DECIMAL(4, 2)
  },
  // Membership details
  membershipType: {
    type: DataTypes.ENUM('Strength', 'Strength + Cardio', 'Cardio', 'Personal Training', 'Group Classes'),
    allowNull: false
  },
  planId: {
    type: DataTypes.UUID,
    references: {
      model: 'membership_plans',
      key: 'id'
    }
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  // Payment details
  totalFees: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  pendingAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  paymentStatus: {
    type: DataTypes.ENUM('paid', 'pending', 'overdue'),
    defaultValue: 'pending'
  },
  // Assigned trainer
  assignedTrainerId: {
    type: DataTypes.UUID,
    references: {
      model: 'trainers',
      key: 'id'
    }
  },
  // QR Code
  qrCode: {
    type: DataTypes.TEXT
  },
  // Health info
  medicalConditions: {
    type: DataTypes.TEXT
  },
  fitnessGoal: {
    type: DataTypes.STRING
  },
  // Photo
  photo: {
    type: DataTypes.STRING
  },
  // Notes
  notes: {
    type: DataTypes.TEXT
  },
  // Status
  status: {
    type: DataTypes.ENUM('active', 'expired', 'frozen', 'cancelled'),
    defaultValue: 'active'
  }
}, {
  timestamps: true,
  tableName: 'members',
  hooks: {
    // Helper function for calculations (DRY)
    beforeCreate: (member) => {
      // Calculate BMI
      if (member.weight && member.height) {
        const heightInMeters = member.height / 100;
        member.bmi = (member.weight / (heightInMeters * heightInMeters)).toFixed(2);
      }

      // Calculate pending amount
      member.pendingAmount = member.totalFees - member.paidAmount;

      // Update payment status
      if (member.pendingAmount <= 0) {
        member.paymentStatus = 'paid';
      } else if (new Date() > new Date(member.endDate)) {
        member.paymentStatus = 'overdue';
      } else {
        member.paymentStatus = 'pending';
      }
    },
    // beforeUpdate hook ensures calculations run on .update() too
    beforeUpdate: (member) => {
      // Calculate BMI
      if (member.weight && member.height) {
        const heightInMeters = member.height / 100;
        member.bmi = (member.weight / (heightInMeters * heightInMeters)).toFixed(2);
      }

      // Calculate pending amount
      member.pendingAmount = member.totalFees - member.paidAmount;

      // Update payment status
      if (member.pendingAmount <= 0) {
        member.paymentStatus = 'paid';
      } else if (new Date() > new Date(member.endDate)) {
        member.paymentStatus = 'overdue';
      } else {
        member.paymentStatus = 'pending';
      }
    }
  }
});

module.exports = Member;
