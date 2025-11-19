const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Trainer = require('../models/Trainer');
const Member = require('../models/Member');
const { verifyToken, isOwnerOrManager } = require('../middleware/auth');

// Generate unique trainer ID
const generateTrainerId = async () => {
  const prefix = 'TRN';
  const year = new Date().getFullYear();
  const count = await Trainer.count();
  return `${prefix}${year}${String(count + 1).padStart(3, '0')}`;
};

// Get all trainers
router.get('/', verifyToken, async (req, res) => {
  try {
    const { isActive, specialization } = req.query;

    const where = {};
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (specialization) where.specialization = { [Op.contains]: [specialization] };

    const trainers = await Trainer.findAll({
      where,
      include: [
        {
          model: Member,
          as: 'assignedMembers',
          attributes: ['name', 'memberId', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: trainers.length,
      trainers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching trainers',
      error: error.message
    });
  }
});

// Get trainer by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const trainer = await Trainer.findByPk(req.params.id, {
      include: [
        {
          model: Member,
          as: 'assignedMembers',
          attributes: ['name', 'memberId', 'phone', 'membershipType']
        }
      ]
    });

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    res.json({
      success: true,
      trainer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching trainer',
      error: error.message
    });
  }
});

// Create new trainer
router.post('/', verifyToken, isOwnerOrManager, async (req, res) => {
  try {
    const trainerId = await generateTrainerId();

    const trainer = await Trainer.create({
      ...req.body,
      trainerId
    });

    res.status(201).json({
      success: true,
      message: 'Trainer created successfully',
      trainer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating trainer',
      error: error.message
    });
  }
});

// Update trainer
router.put('/:id', verifyToken, isOwnerOrManager, async (req, res) => {
  try {
    const trainer = await Trainer.findByPk(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    await trainer.update(req.body);

    res.json({
      success: true,
      message: 'Trainer updated successfully',
      trainer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating trainer',
      error: error.message
    });
  }
});

// Delete trainer
router.delete('/:id', verifyToken, isOwnerOrManager, async (req, res) => {
  try {
    const trainer = await Trainer.findByPk(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Remove trainer assignment from members
    await Member.update(
      { assignedTrainerId: null },
      { where: { assignedTrainerId: req.params.id } }
    );

    await trainer.destroy();

    res.json({
      success: true,
      message: 'Trainer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting trainer',
      error: error.message
    });
  }
});

// Assign member to trainer
router.post('/:trainerId/assign/:memberId', verifyToken, async (req, res) => {
  try {
    const trainer = await Trainer.findByPk(req.params.trainerId, {
      include: [{ model: Member, as: 'assignedMembers' }]
    });
    const member = await Member.findByPk(req.params.memberId);

    if (!trainer || !member) {
      return res.status(404).json({
        success: false,
        message: 'Trainer or Member not found'
      });
    }

    // Check capacity
    const assignedCount = await Member.count({ where: { assignedTrainerId: trainer.id } });
    if (assignedCount >= trainer.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Trainer has reached maximum capacity'
      });
    }

    // Update member's assigned trainer
    await member.update({ assignedTrainerId: trainer.id });

    res.json({
      success: true,
      message: 'Member assigned to trainer successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error assigning member to trainer',
      error: error.message
    });
  }
});

// Remove member from trainer
router.delete('/:trainerId/remove/:memberId', verifyToken, async (req, res) => {
  try {
    const trainer = await Trainer.findByPk(req.params.trainerId);
    const member = await Member.findByPk(req.params.memberId);

    if (!trainer || !member) {
      return res.status(404).json({
        success: false,
        message: 'Trainer or Member not found'
      });
    }

    // Remove trainer from member
    await member.update({ assignedTrainerId: null });

    res.json({
      success: true,
      message: 'Member removed from trainer successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing member from trainer',
      error: error.message
    });
  }
});

module.exports = router;
