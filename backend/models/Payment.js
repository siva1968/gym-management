const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  memberId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'members',
      key: 'id'
    }
  },
  memberIdString: {
    type: DataTypes.STRING,
    allowNull: false
  },
  memberName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'upi', 'card', 'net-banking', 'cheque'),
    allowNull: false
  },
  transactionId: {
    type: DataTypes.STRING
  },
  planId: {
    type: DataTypes.UUID,
    references: {
      model: 'membership_plans',
      key: 'id'
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    unique: true
  },
  status: {
    type: DataTypes.ENUM('completed', 'pending', 'failed', 'refunded'),
    defaultValue: 'completed'
  },
  notes: {
    type: DataTypes.TEXT
  },
  receivedById: {
    type: DataTypes.UUID,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  tableName: 'payments',
  hooks: {
    beforeCreate: async (payment) => {
      if (!payment.invoiceNumber) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');

        // Create sequence if it doesn't exist (idempotent)
        await sequelize.query(`
          CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1;
        `);

        // Get next value atomically (race-condition-free)
        const [results] = await sequelize.query(`SELECT nextval('invoice_number_seq') as num;`);
        const num = results[0].num;

        payment.invoiceNumber = `INV-${year}${month}-${String(num).padStart(5, '0')}`;
      }
    }
  }
});

module.exports = Payment;
