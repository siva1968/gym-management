const express = require('express');
const router = express.Router();
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
    const totalMembers = await Member.countDocuments();
    const activeMembers = await Member.countDocuments({ status: 'active' });
    const expiredMembers = await Member.countDocuments({ status: 'expired' });

    // Members with pending dues
    const pendingDues = await Member.countDocuments({
      paymentStatus: { $in: ['pending', 'overdue'] }
    });

    // Total trainers
    const totalTrainers = await Trainer.countDocuments({ isActive: true });

    // Today's attendance
    const todayAttendance = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow }
    });

    // This month's revenue
    const monthRevenue = await Payment.aggregate([
      {
        $match: {
          paymentDate: { $gte: startOfMonth, $lte: endOfMonth },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // This month's expenses
    const monthExpenses = await Expense.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // New members this month
    const newMembersThisMonth = await Member.countDocuments({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    });

    // Expiring memberships in next 7 days
    const next7Days = new Date(today);
    next7Days.setDate(next7Days.getDate() + 7);
    const expiringMemberships = await Member.countDocuments({
      endDate: { $gte: today, $lte: next7Days },
      status: 'active'
    });

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
          monthlyRevenue: monthRevenue[0]?.total || 0,
          monthlyExpenses: monthExpenses[0]?.total || 0,
          profit: (monthRevenue[0]?.total || 0) - (monthExpenses[0]?.total || 0)
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
    const recentPayments = await Payment.find()
      .populate('member', 'name memberId')
      .sort({ paymentDate: -1 })
      .limit(5)
      .select('memberName amount paymentDate paymentMethod');

    // Get recent members
    const recentMembers = await Member.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name memberId membershipType createdAt');

    // Get recent attendance
    const recentAttendance = await Attendance.find()
      .populate('member', 'name memberId')
      .sort({ checkInTime: -1 })
      .limit(10)
      .select('memberName checkInTime checkOutTime');

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
