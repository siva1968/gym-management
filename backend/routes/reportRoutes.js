const express = require('express');
const router = express.Router();
const Member = require('../models/Member');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const { verifyToken } = require('../middleware/auth');

// Get income report
router.get('/income', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const query = { status: 'completed' };

    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let groupByFormat;
    if (groupBy === 'day') {
      groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$paymentDate' } };
    } else if (groupBy === 'month') {
      groupByFormat = { $dateToString: { format: '%Y-%m', date: '$paymentDate' } };
    } else {
      groupByFormat = { $dateToString: { format: '%Y', date: '$paymentDate' } };
    }

    const incomeData = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: groupByFormat,
          totalIncome: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalIncome = incomeData.reduce((sum, item) => sum + item.totalIncome, 0);

    res.json({
      success: true,
      totalIncome,
      data: incomeData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching income report',
      error: error.message
    });
  }
});

// Get attendance report
router.get('/attendance', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let groupByFormat;
    if (groupBy === 'day') {
      groupByFormat = { $dateToString: { format: '%Y-%m-%d', date: '$date' } };
    } else if (groupBy === 'month') {
      groupByFormat = { $dateToString: { format: '%Y-%m', date: '$date' } };
    } else {
      groupByFormat = { $dateToString: { format: '%Y', date: '$date' } };
    }

    const attendanceData = await Attendance.aggregate([
      { $match: query },
      {
        $group: {
          _id: groupByFormat,
          totalAttendance: { $sum: 1 },
          uniqueMembers: { $addToSet: '$member' }
        }
      },
      {
        $project: {
          _id: 1,
          totalAttendance: 1,
          uniqueMembers: { $size: '$uniqueMembers' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: attendanceData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance report',
      error: error.message
    });
  }
});

// Get member retention report
router.get('/retention', verifyToken, async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const startOfYear = new Date(targetYear, 0, 1);
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59);

    // New members
    const newMembers = await Member.countDocuments({
      createdAt: { $gte: startOfYear, $lte: endOfYear }
    });

    // Renewed members
    const renewedMembers = await Member.countDocuments({
      startDate: { $gte: startOfYear, $lte: endOfYear },
      createdAt: { $lt: startOfYear }
    });

    // Expired members
    const expiredMembers = await Member.countDocuments({
      endDate: { $gte: startOfYear, $lte: endOfYear },
      status: 'expired'
    });

    // Active members at year end
    const activeMembers = await Member.countDocuments({
      status: 'active',
      endDate: { $gte: endOfYear }
    });

    // Monthly breakdown
    const monthlyData = await Member.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfYear, $lte: endOfYear }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          newMembers: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      report: {
        year: targetYear,
        summary: {
          newMembers,
          renewedMembers,
          expiredMembers,
          activeMembers,
          retentionRate: renewedMembers > 0 ? ((renewedMembers / (renewedMembers + expiredMembers)) * 100).toFixed(2) : 0
        },
        monthlyData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching retention report',
      error: error.message
    });
  }
});

// Get profit/loss report
router.get('/profit-loss', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Get total income
    const incomeData = await Payment.aggregate([
      { $match: { ...query, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: '$amount' }
        }
      }
    ]);

    // Get total expenses
    const expenseQuery = {};
    if (startDate && endDate) {
      expenseQuery.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const expenseData = await Expense.aggregate([
      { $match: expenseQuery },
      {
        $group: {
          _id: '$category',
          totalExpense: { $sum: '$amount' }
        }
      }
    ]);

    const totalIncome = incomeData[0]?.totalIncome || 0;
    const totalExpenses = expenseData.reduce((sum, item) => sum + item.totalExpense, 0);
    const profit = totalIncome - totalExpenses;

    res.json({
      success: true,
      report: {
        totalIncome,
        totalExpenses,
        profit,
        profitMargin: totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(2) : 0,
        expenseBreakdown: expenseData
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profit/loss report',
      error: error.message
    });
  }
});

// Get membership statistics
router.get('/membership-stats', verifyToken, async (req, res) => {
  try {
    // Members by membership type
    const byType = await Member.aggregate([
      {
        $group: {
          _id: '$membershipType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Members by status
    const byStatus = await Member.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Members by payment status
    const byPaymentStatus = await Member.aggregate([
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        byType,
        byStatus,
        byPaymentStatus
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching membership statistics',
      error: error.message
    });
  }
});

module.exports = router;
