const { sequelize } = require('../config/database');
const User = require('./User');
const Member = require('./Member');
const Trainer = require('./Trainer');
const MembershipPlan = require('./MembershipPlan');
const Attendance = require('./Attendance');
const Payment = require('./Payment');
const Expense = require('./Expense');

// Define associations

// Member associations
Member.belongsTo(Trainer, { foreignKey: 'assignedTrainerId', as: 'assignedTrainer' });
Member.belongsTo(MembershipPlan, { foreignKey: 'planId', as: 'plan' });
Trainer.hasMany(Member, { foreignKey: 'assignedTrainerId', as: 'assignedMembers' });
MembershipPlan.hasMany(Member, { foreignKey: 'planId' });

// Attendance associations
Attendance.belongsTo(Member, { foreignKey: 'memberId', as: 'memberData' });
Member.hasMany(Attendance, { foreignKey: 'memberId' });

// Payment associations
Payment.belongsTo(Member, { foreignKey: 'memberId', as: 'memberData' });
Payment.belongsTo(User, { foreignKey: 'receivedById', as: 'receivedBy' });
Payment.belongsTo(MembershipPlan, { foreignKey: 'planId', as: 'plan' });
Member.hasMany(Payment, { foreignKey: 'memberId' });

// Expense associations
Expense.belongsTo(User, { foreignKey: 'addedById', as: 'addedBy' });

const db = {
  sequelize,
  User,
  Member,
  Trainer,
  MembershipPlan,
  Attendance,
  Payment,
  Expense
};

module.exports = db;
