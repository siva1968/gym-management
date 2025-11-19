const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Payment = require('../models/Payment');
const Member = require('../models/Member');
const MembershipPlan = require('../models/MembershipPlan');
const User = require('../models/User');
const { verifyToken, isOwnerOrManager } = require('../middleware/auth');

// ==================== MEMBERSHIP PLANS ====================

// Get all membership plans
router.get('/plans', verifyToken, async (req, res) => {
  try {
    const plans = await MembershipPlan.findAll({ where: { isActive: true } });

    res.json({
      success: true,
      count: plans.length,
      plans
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching membership plans',
      error: error.message
    });
  }
});

// Create membership plan
router.post('/plans', verifyToken, isOwnerOrManager, async (req, res) => {
  try {
    const plan = await MembershipPlan.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Membership plan created successfully',
      plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating membership plan',
      error: error.message
    });
  }
});

// Update membership plan
router.put('/plans/:id', verifyToken, isOwnerOrManager, async (req, res) => {
  try {
    const plan = await MembershipPlan.findByPk(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Membership plan not found'
      });
    }

    await plan.update(req.body);

    res.json({
      success: true,
      message: 'Membership plan updated successfully',
      plan
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating membership plan',
      error: error.message
    });
  }
});

// Delete membership plan
router.delete('/plans/:id', verifyToken, isOwnerOrManager, async (req, res) => {
  try {
    const plan = await MembershipPlan.findByPk(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Membership plan not found'
      });
    }

    await plan.destroy();

    res.json({
      success: true,
      message: 'Membership plan deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting membership plan',
      error: error.message
    });
  }
});

// ==================== PAYMENTS ====================

// Get all payments
router.get('/payments', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, status, paymentMethod, page = 1, limit = 50 } = req.query;

    const where = {};

    if (startDate && endDate) {
      where.paymentDate = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate)
      };
    }

    if (status) where.status = status;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    const payments = await Payment.findAll({
      where,
      include: [
        {
          model: Member,
          as: 'member',
          attributes: ['name', 'memberId', 'phone']
        },
        {
          model: User,
          as: 'receivedBy',
          attributes: ['name']
        }
      ],
      order: [['paymentDate', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    const total = await Payment.count({ where });

    res.json({
      success: true,
      count: payments.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payments',
      error: error.message
    });
  }
});

// Get payment by ID
router.get('/payments/:id', verifyToken, async (req, res) => {
  try {
    const payment = await Payment.findByPk(req.params.id, {
      include: [
        {
          model: Member,
          as: 'member',
          attributes: ['name', 'memberId', 'phone', 'email']
        },
        {
          model: User,
          as: 'receivedBy',
          attributes: ['name']
        }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching payment',
      error: error.message
    });
  }
});

// Create payment
router.post('/payments', verifyToken, async (req, res) => {
  try {
    const { member: memberId, amount, paymentMethod, transactionId, description } = req.body;

    const member = await Member.findByPk(memberId);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const payment = await Payment.create({
      memberId: memberId,
      memberIdString: member.memberId,
      memberName: member.name,
      amount,
      paymentMethod,
      transactionId,
      description,
      receivedById: req.user.id
    });

    // Update member's paid amount
    await member.update({
      paidAmount: parseFloat(member.paidAmount || 0) + parseFloat(amount)
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      payment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording payment',
      error: error.message
    });
  }
});

// Get member payment history
router.get('/payments/member/:memberId', verifyToken, async (req, res) => {
  try {
    const member = await Member.findOne({ where: { memberId: req.params.memberId } });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const payments = await Payment.findAll({
      where: { memberId: member.id },
      include: [
        {
          model: User,
          as: 'receivedBy',
          attributes: ['name']
        }
      ],
      order: [['paymentDate', 'DESC']]
    });

    res.json({
      success: true,
      count: payments.length,
      payments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching member payment history',
      error: error.message
    });
  }
});

// Get revenue summary
router.get('/revenue/summary', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = { status: 'completed' };

    if (startDate && endDate) {
      where.paymentDate = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate)
      };
    }

    const payments = await Payment.findAll({ where });

    const totalRevenue = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

    const byMethod = {};
    payments.forEach(payment => {
      byMethod[payment.paymentMethod] = (byMethod[payment.paymentMethod] || 0) + parseFloat(payment.amount);
    });

    res.json({
      success: true,
      summary: {
        totalRevenue,
        totalTransactions: payments.length,
        byMethod
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching revenue summary',
      error: error.message
    });
  }
});

module.exports = router;
