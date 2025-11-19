const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const Member = require('../models/Member');
const { verifyToken } = require('../middleware/auth');

// Generate unique member ID
const generateMemberId = async () => {
  const prefix = 'MEM';
  const year = new Date().getFullYear();
  const count = await Member.countDocuments();
  return `${prefix}${year}${String(count + 1).padStart(4, '0')}`;
};

// Get all members
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, membershipType, search, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (membershipType) query.membershipType = membershipType;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { memberId: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const members = await Member.find(query)
      .populate('assignedTrainer', 'name specialization')
      .populate('planId', 'name price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Member.countDocuments(query);

    res.json({
      success: true,
      count: members.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      members
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching members',
      error: error.message
    });
  }
});

// Get member by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const member = await Member.findById(req.params.id)
      .populate('assignedTrainer', 'name specialization phone email')
      .populate('planId', 'name price duration');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.json({
      success: true,
      member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching member',
      error: error.message
    });
  }
});

// Create new member
router.post('/', verifyToken, async (req, res) => {
  try {
    const memberId = await generateMemberId();

    // Generate QR code
    const qrData = JSON.stringify({
      memberId,
      id: uuidv4()
    });
    const qrCode = await QRCode.toDataURL(qrData);

    const member = new Member({
      ...req.body,
      memberId,
      qrCode
    });

    await member.save();

    res.status(201).json({
      success: true,
      message: 'Member created successfully',
      member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating member',
      error: error.message
    });
  }
});

// Update member
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.json({
      success: true,
      message: 'Member updated successfully',
      member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating member',
      error: error.message
    });
  }
});

// Delete member
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.json({
      success: true,
      message: 'Member deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting member',
      error: error.message
    });
  }
});

// Get members with due fees
router.get('/dues/pending', verifyToken, async (req, res) => {
  try {
    const members = await Member.find({
      $or: [
        { paymentStatus: 'pending' },
        { paymentStatus: 'overdue' }
      ]
    }).select('name memberId phone pendingAmount paymentStatus endDate');

    res.json({
      success: true,
      count: members.length,
      members
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching members with dues',
      error: error.message
    });
  }
});

// Get expiring memberships
router.get('/expiring/soon', verifyToken, async (req, res) => {
  try {
    const daysAhead = parseInt(req.query.days) || 7;
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const members = await Member.find({
      endDate: { $lte: futureDate, $gte: new Date() },
      status: 'active'
    }).select('name memberId phone email endDate membershipType');

    res.json({
      success: true,
      count: members.length,
      members
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching expiring memberships',
      error: error.message
    });
  }
});

// Renew membership
router.post('/:id/renew', verifyToken, async (req, res) => {
  try {
    const { planId, startDate, totalFees } = req.body;
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Calculate new end date based on plan duration
    const plan = await require('../models/MembershipPlan').findById(planId);
    const newStartDate = new Date(startDate);
    const newEndDate = new Date(newStartDate);

    if (plan.duration.unit === 'months') {
      newEndDate.setMonth(newEndDate.getMonth() + plan.duration.value);
    } else if (plan.duration.unit === 'days') {
      newEndDate.setDate(newEndDate.getDate() + plan.duration.value);
    } else if (plan.duration.unit === 'years') {
      newEndDate.setFullYear(newEndDate.getFullYear() + plan.duration.value);
    }

    member.planId = planId;
    member.startDate = newStartDate;
    member.endDate = newEndDate;
    member.totalFees = totalFees || plan.finalPrice;
    member.paidAmount = 0;
    member.status = 'active';

    await member.save();

    res.json({
      success: true,
      message: 'Membership renewed successfully',
      member
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error renewing membership',
      error: error.message
    });
  }
});

module.exports = router;
