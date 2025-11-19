const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Attendance = sequelize.define('Attendance', {
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
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  checkInTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  checkOutTime: {
    type: DataTypes.DATE
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: 'Duration in minutes'
  },
  checkInMethod: {
    type: DataTypes.ENUM('qr-code', 'manual', 'rfid'),
    defaultValue: 'manual'
  },
  notes: {
    type: DataTypes.TEXT
  }
}, {
  timestamps: true,
  tableName: 'attendances',
  hooks: {
    // Calculate duration on create
    beforeCreate: (attendance) => {
      if (attendance.checkOutTime && attendance.checkInTime) {
        const diff = new Date(attendance.checkOutTime) - new Date(attendance.checkInTime);
        attendance.duration = Math.floor(diff / (1000 * 60));
      }
    },
    // beforeUpdate hook ensures duration calculation runs on checkout too
    beforeUpdate: (attendance) => {
      if (attendance.checkOutTime && attendance.checkInTime) {
        const diff = new Date(attendance.checkOutTime) - new Date(attendance.checkInTime);
        attendance.duration = Math.floor(diff / (1000 * 60));
      }
    }
  },
  indexes: [
    { fields: ['memberId'] },
    { fields: ['date'] },
    { fields: ['memberIdString'] }
  ]
});

module.exports = Attendance;
