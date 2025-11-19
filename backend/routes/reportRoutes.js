const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Member = require('../models/Member');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const { verifyToken } = require('../middleware/auth');

// Get income report
router.get('/income', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const where = { status: 'completed' };

    if (startDate && endDate) {
      where.paymentDate = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate)
      };
    }

    let dateFormat;
    if (groupBy === 'day') {
      dateFormat = sequelize.fn('DATE', sequelize.col('paymentDate'));
    } else if (groupBy === 'month') {
      dateFormat = sequelize.fn('DATE_TRUNC', 'month', sequelize.col('paymentDate'));
    } else {
      dateFormat = sequelize.fn('DATE_TRUNC', 'year', sequelize.col('paymentDate'));
    }

    const incomeData = await Payment.findAll({
      where,
      attributes: [
        [dateFormat, 'period'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalIncome'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [dateFormat],
      order: [[dateFormat, 'ASC']],
      raw: true
    });

    const totalIncome = incomeData.reduce((sum, item) => sum + parseFloat(item.totalIncome), 0);

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

    const where = {};

    if (startDate && endDate) {
      where.date = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate)
      };
    }

    let dateFormat;
    if (groupBy === 'day') {
      dateFormat = sequelize.fn('DATE', sequelize.col('date'));
    } else if (groupBy === 'month') {
      dateFormat = sequelize.fn('DATE_TRUNC', 'month', sequelize.col('date'));
    } else {
      dateFormat = sequelize.fn('DATE_TRUNC', 'year', sequelize.col('date'));
    }

    const attendanceData = await Attendance.findAll({
      where,
      attributes: [
        [dateFormat, 'period'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalAttendance'],
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('memberId'))), 'uniqueMembers']
      ],
      group: [dateFormat],
      order: [[dateFormat, 'ASC']],
      raw: true
    });

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
    const newMembers = await Member.count({
      where: {
        createdAt: { [Op.gte]: startOfYear, [Op.lte]: endOfYear }
      }
    });

    // Renewed members
    const renewedMembers = await Member.count({
      where: {
        startDate: { [Op.gte]: startOfYear, [Op.lte]: endOfYear },
        createdAt: { [Op.lt]: startOfYear }
      }
    });

    // Expired members
    const expiredMembers = await Member.count({
      where: {
        endDate: { [Op.gte]: startOfYear, [Op.lte]: endOfYear },
        status: 'expired'
      }
    });

    // Active members at year end
    const activeMembers = await Member.count({
      where: {
        status: 'active',
        endDate: { [Op.gte]: endOfYear }
      }
    });

    // Monthly breakdown
    const monthlyData = await Member.findAll({
      where: {
        createdAt: { [Op.gte]: startOfYear, [Op.lte]: endOfYear }
      },
      attributes: [
        [sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "createdAt"')), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'newMembers']
      ],
      group: [sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "createdAt"'))],
      order: [[sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "createdAt"')), 'ASC']],
      raw: true
    });

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

    const paymentWhere = { status: 'completed' };

    if (startDate && endDate) {
      paymentWhere.paymentDate = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate)
      };
    }

    // Get total income
    const incomeResult = await Payment.findOne({
      where: paymentWhere,
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'totalIncome']],
      raw: true
    });

    // Get total expenses by category
    const expenseWhere = {};
    if (startDate && endDate) {
      expenseWhere.date = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate)
      };
    }

    const expenseData = await Expense.findAll({
      where: expenseWhere,
      attributes: [
        'category',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalExpense']
      ],
      group: ['category'],
      raw: true
    });

    const totalIncome = parseFloat(incomeResult?.totalIncome || 0);
    const totalExpenses = expenseData.reduce((sum, item) => sum + parseFloat(item.totalExpense), 0);
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
    const byType = await Member.findAll({
      attributes: [
        'membershipType',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['membershipType'],
      raw: true
    });

    // Members by status
    const byStatus = await Member.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Members by payment status
    const byPaymentStatus = await Member.findAll({
      attributes: [
        'paymentStatus',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['paymentStatus'],
      raw: true
    });

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
