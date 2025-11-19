const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const Attendance = require('../models/Attendance');
const Member = require('../models/Member');
const { verifyToken } = require('../middleware/auth');

// Get all attendance records
router.get('/', verifyToken, async (req, res) => {
  try {
    const { date, memberId, startDate, endDate, page = 1, limit = 100 } = req.query;

    const where = {};

    if (date) {
      const selectedDate = new Date(date);
      const nextDate = new Date(selectedDate);
      nextDate.setDate(nextDate.getDate() + 1);
      where.date = { [Op.gte]: selectedDate, [Op.lt]: nextDate };
    }

    if (startDate && endDate) {
      where.date = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate)
      };
    }

    if (memberId) {
      where.memberId = memberId;
    }

    const attendance = await Attendance.findAll({
      where,
      include: [
        {
          model: Member,
          as: 'member',
          attributes: ['name', 'memberId', 'phone', 'membershipType']
        }
      ],
      order: [['date', 'DESC'], ['checkInTime', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    const total = await Attendance.count({ where });

    res.json({
      success: true,
      count: attendance.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance records',
      error: error.message
    });
  }
});

// Get today's attendance
router.get('/today', verifyToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await Attendance.findAll({
      where: {
        date: { [Op.gte]: today, [Op.lt]: tomorrow }
      },
      include: [
        {
          model: Member,
          as: 'member',
          attributes: ['name', 'memberId', 'phone']
        }
      ],
      order: [['checkInTime', 'DESC']]
    });

    res.json({
      success: true,
      count: attendance.length,
      attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching today\'s attendance',
      error: error.message
    });
  }
});

// Check-in member
router.post('/checkin', verifyToken, async (req, res) => {
  try {
    const { memberId, checkInMethod = 'manual', notes } = req.body;

    // Find member by memberId (string field, not UUID)
    const member = await Member.findOne({ where: { memberId } });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Check if member is active
    if (member.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Member is not active'
      });
    }

    // Check if membership is expired
    if (new Date() > member.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Membership has expired'
      });
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      where: {
        memberId: member.id,
        date: { [Op.gte]: today, [Op.lt]: tomorrow }
      }
    });

    if (existingAttendance && !existingAttendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'Member already checked in today',
        attendance: existingAttendance
      });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      memberId: member.id,
      memberIdString: member.memberId,
      memberName: member.name,
      date: new Date(),
      checkInTime: new Date(),
      checkInMethod,
      notes
    });

    res.status(201).json({
      success: true,
      message: 'Check-in successful',
      attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during check-in',
      error: error.message
    });
  }
});

// Check-out member
router.post('/checkout/:id', verifyToken, async (req, res) => {
  try {
    const attendance = await Attendance.findByPk(req.params.id);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'Member already checked out'
      });
    }

    await attendance.update({ checkOutTime: new Date() });

    res.json({
      success: true,
      message: 'Check-out successful',
      attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error during check-out',
      error: error.message
    });
  }
});

// Get member attendance history
router.get('/member/:memberId', verifyToken, async (req, res) => {
  try {
    const member = await Member.findOne({ where: { memberId: req.params.memberId } });

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    const attendance = await Attendance.findAll({
      where: { memberId: member.id },
      order: [['date', 'DESC']],
      limit: 100
    });

    res.json({
      success: true,
      count: attendance.length,
      attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching member attendance',
      error: error.message
    });
  }
});

// Get attendance statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.date = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate)
      };
    }

    const totalAttendance = await Attendance.count({ where });

    // Get unique members count
    const uniqueMembers = await Attendance.findAll({
      where,
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('memberId')), 'memberId']],
      raw: true
    });

    res.json({
      success: true,
      stats: {
        totalAttendance,
        uniqueMembers: uniqueMembers.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance statistics',
      error: error.message
    });
  }
});

module.exports = router;
