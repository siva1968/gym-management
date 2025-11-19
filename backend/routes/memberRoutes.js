const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const MembershipPlan = require('../models/MembershipPlan');
const { verifyToken } = require('../middleware/auth');
const { memberValidation } = require('../middleware/validation');

// Generate unique member ID
const generateMemberId = async () => {
  const prefix = 'MEM';
  const year = new Date().getFullYear();
  const count = await Member.count();
  return `${prefix}${year}${String(count + 1).padStart(4, '0')}`;
};

// Get all members
router.get('/', verifyToken, async (req, res) => {
  try {
    const { status, membershipType, search, page = 1, limit = 50 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (membershipType) where.membershipType = membershipType;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { memberId: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const members = await Member.findAll({
      where,
      include: [
        {
          model: Trainer,
          as: 'assignedTrainer',
          attributes: ['name', 'specialization']
        },
        {
          model: MembershipPlan,
          as: 'plan',
          attributes: ['name', 'price']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    const total = await Member.count({ where });

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
    const member = await Member.findByPk(req.params.id, {
      include: [
        {
          model: Trainer,
          as: 'assignedTrainer',
          attributes: ['name', 'specialization', 'phone', 'email']
        },
        {
          model: MembershipPlan,
          as: 'plan',
          attributes: ['name', 'price', 'duration']
        }
      ]
    });

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
router.post('/', verifyToken, memberValidation.create, async (req, res) => {
  try {
    const memberId = await generateMemberId();

    // Calculate end date based on plan if planId is provided
    let endDate = req.body.endDate;
    if (req.body.planId && req.body.startDate) {
      const plan = await MembershipPlan.findByPk(req.body.planId);

      if (plan) {
        const startDate = new Date(req.body.startDate);
        const calculatedEndDate = new Date(startDate);

        if (plan.duration.unit === 'months') {
          calculatedEndDate.setMonth(calculatedEndDate.getMonth() + plan.duration.value);
        } else if (plan.duration.unit === 'days') {
          calculatedEndDate.setDate(calculatedEndDate.getDate() + plan.duration.value);
        } else if (plan.duration.unit === 'years') {
          calculatedEndDate.setFullYear(calculatedEndDate.getFullYear() + plan.duration.value);
        }

        endDate = calculatedEndDate;
      }
    }

    // Generate QR code
    const qrData = JSON.stringify({
      memberId,
      id: uuidv4()
    });
    const qrCode = await QRCode.toDataURL(qrData);

    const member = await Member.create({
      ...req.body,
      memberId,
      qrCode,
      endDate
    });

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
router.put('/:id', verifyToken, memberValidation.update, async (req, res) => {
  try {
    const member = await Member.findByPk(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    await member.update(req.body);

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
    const member = await Member.findByPk(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    await member.destroy();

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
    const members = await Member.findAll({
      where: {
        [Op.or]: [
          { paymentStatus: 'pending' },
          { paymentStatus: 'overdue' }
        ]
      },
      attributes: ['name', 'memberId', 'phone', 'pendingAmount', 'paymentStatus', 'endDate']
    });

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

    const members = await Member.findAll({
      where: {
        endDate: { [Op.lte]: futureDate, [Op.gte]: new Date() },
        status: 'active'
      },
      attributes: ['name', 'memberId', 'phone', 'email', 'endDate', 'membershipType']
    });

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
    const member = await Member.findByPk(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const plan = await MembershipPlan.findByPk(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Membership plan not found'
      });
    }

    // Calculate new end date based on plan duration
    const newStartDate = new Date(startDate);
    const newEndDate = new Date(newStartDate);

    if (plan.duration.unit === 'months') {
      newEndDate.setMonth(newEndDate.getMonth() + plan.duration.value);
    } else if (plan.duration.unit === 'days') {
      newEndDate.setDate(newEndDate.getDate() + plan.duration.value);
    } else if (plan.duration.unit === 'years') {
      newEndDate.setFullYear(newEndDate.getFullYear() + plan.duration.value);
    }

    // Calculate final price with discount
    const finalPrice = plan.price - (plan.price * plan.discount / 100);

    await member.update({
      planId,
      startDate: newStartDate,
      endDate: newEndDate,
      totalFees: totalFees || finalPrice,
      paidAmount: 0,
      status: 'active'
    });

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
