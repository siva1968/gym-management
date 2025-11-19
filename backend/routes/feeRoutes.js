const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Member = require('../models/Member');
const MembershipPlan = require('../models/MembershipPlan');
const { verifyToken, isOwnerOrManager } = require('../middleware/auth');

// ==================== MEMBERSHIP PLANS ====================

// Get all membership plans
router.get('/plans', verifyToken, async (req, res) => {
  try {
    const plans = await MembershipPlan.find({ isActive: true });

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
    const plan = new MembershipPlan(req.body);
    await plan.save();

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
    const plan = await MembershipPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Membership plan not found'
      });
    }

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
    const plan = await MembershipPlan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Membership plan not found'
      });
    }

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

    const query = {};

    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;

    const payments = await Payment.find(query)
      .populate('member', 'name memberId phone')
      .populate('receivedBy', 'name')
      .sort({ paymentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Payment.countDocuments(query);

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
    const payment = await Payment.findById(req.params.id)
      .populate('member', 'name memberId phone email')
      .populate('receivedBy', 'name');

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

    const member = await Member.findById(memberId);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const payment = new Payment({
      member: memberId,
      memberId: member.memberId,
      memberName: member.name,
      amount,
      paymentMethod,
      transactionId,
      description,
      receivedBy: req.user._id
    });

    await payment.save();

    // Update member's paid amount
    member.paidAmount += amount;
    await member.save();

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
    const member = await Member.findOne({ memberId: req.params.memberId });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const payments = await Payment.find({ member: member._id })
      .populate('receivedBy', 'name')
      .sort({ paymentDate: -1 });

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

    const query = { status: 'completed' };

    if (startDate && endDate) {
      query.paymentDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const payments = await Payment.find(query);

    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);

    const byMethod = {};
    payments.forEach(payment => {
      byMethod[payment.paymentMethod] = (byMethod[payment.paymentMethod] || 0) + payment.amount;
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
