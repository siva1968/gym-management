const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const { verifyToken } = require('../middleware/auth');

// Get dashboard statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get current month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Total members
    const totalMembers = await Member.count();
    const activeMembers = await Member.count({ where: { status: 'active' } });
    const expiredMembers = await Member.count({ where: { status: 'expired' } });

    // Members with pending dues
    const pendingDues = await Member.count({
      where: {
        paymentStatus: { [Op.in]: ['pending', 'overdue'] }
      }
    });

    // Total trainers
    const totalTrainers = await Trainer.count({ where: { isActive: true } });

    // Today's attendance
    const todayAttendance = await Attendance.count({
      where: {
        date: { [Op.gte]: today, [Op.lt]: tomorrow }
      }
    });

    // This month's revenue
    const monthRevenueResult = await Payment.findOne({
      where: {
        paymentDate: { [Op.gte]: startOfMonth, [Op.lte]: endOfMonth },
        status: 'completed'
      },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']],
      raw: true
    });

    // This month's expenses
    const monthExpensesResult = await Expense.findOne({
      where: {
        date: { [Op.gte]: startOfMonth, [Op.lte]: endOfMonth }
      },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'total']],
      raw: true
    });

    // New members this month
    const newMembersThisMonth = await Member.count({
      where: {
        createdAt: { [Op.gte]: startOfMonth, [Op.lte]: endOfMonth }
      }
    });

    // Expiring memberships in next 7 days
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);
    const expiringMemberships = await Member.count({
      where: {
        endDate: { [Op.gte]: today, [Op.lte]: next7Days },
        status: 'active'
      }
    });

    const monthlyRevenue = parseFloat(monthRevenueResult?.total || 0);
    const monthlyExpenses = parseFloat(monthExpensesResult?.total || 0);

    res.json({
      success: true,
      stats: {
        members: {
          total: totalMembers,
          active: activeMembers,
          expired: expiredMembers,
          newThisMonth: newMembersThisMonth
        },
        trainers: {
          total: totalTrainers
        },
        attendance: {
          today: todayAttendance
        },
        financials: {
          monthlyRevenue,
          monthlyExpenses,
          profit: monthlyRevenue - monthlyExpenses
        },
        alerts: {
          pendingDues,
          expiringMemberships
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
});

// Get recent activities
router.get('/recent-activities', verifyToken, async (req, res) => {
  try {
    // Get recent payments
    const recentPayments = await Payment.findAll({
      include: [
        {
          model: Member,
          as: 'memberData',
          attributes: ['name', 'memberId']
        }
      ],
      order: [['paymentDate', 'DESC']],
      limit: 5,
      attributes: ['memberName', 'amount', 'paymentDate', 'paymentMethod']
    });

    // Get recent members
    const recentMembers = await Member.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5,
      attributes: ['name', 'memberId', 'membershipType', 'createdAt']
    });

    // Get recent attendance
    const recentAttendance = await Attendance.findAll({
      include: [
        {
          model: Member,
          as: 'memberData',
          attributes: ['name', 'memberId']
        }
      ],
      order: [['checkInTime', 'DESC']],
      limit: 10,
      attributes: ['memberName', 'checkInTime', 'checkOutTime']
    });

    res.json({
      success: true,
      activities: {
        recentPayments,
        recentMembers,
        recentAttendance
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activities',
      error: error.message
    });
  }
});

module.exports = router;
