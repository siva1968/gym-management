const express = require('express');
const router = express.Router();
const Trainer = require('../models/Trainer');
const Member = require('../models/Member');
const { verifyToken, isOwnerOrManager } = require('../middleware/auth');

// Generate unique trainer ID
const generateTrainerId = async () => {
  const prefix = 'TRN';
  const year = new Date().getFullYear();
  const count = await Trainer.countDocuments();
  return `${prefix}${year}${String(count + 1).padStart(3, '0')}`;
};

// Get all trainers
router.get('/', verifyToken, async (req, res) => {
  try {
    const { isActive, specialization } = req.query;

    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (specialization) query.specialization = specialization;

    const trainers = await Trainer.find(query)
      .populate('assignedMembers', 'name memberId phone')
      .sort({ createdAt: -1 });

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
    const trainer = await Trainer.findById(req.params.id)
      .populate('assignedMembers', 'name memberId phone membershipType');

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

    const trainer = new Trainer({
      ...req.body,
      trainerId
    });

    await trainer.save();

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
    const trainer = await Trainer.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

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
    const trainer = await Trainer.findByIdAndDelete(req.params.id);

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }

    // Remove trainer assignment from members
    await Member.updateMany(
      { assignedTrainer: req.params.id },
      { $unset: { assignedTrainer: 1 } }
    );

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
    const trainer = await Trainer.findById(req.params.trainerId);
    const member = await Member.findById(req.params.memberId);

    if (!trainer || !member) {
      return res.status(404).json({
        success: false,
        message: 'Trainer or Member not found'
      });
    }

    // Check capacity
    if (trainer.assignedMembers.length >= trainer.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Trainer has reached maximum capacity'
      });
    }

    // Add member to trainer's assigned list
    if (!trainer.assignedMembers.includes(member._id)) {
      trainer.assignedMembers.push(member._id);
      await trainer.save();
    }

    // Update member's assigned trainer
    member.assignedTrainer = trainer._id;
    await member.save();

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
    const trainer = await Trainer.findById(req.params.trainerId);
    const member = await Member.findById(req.params.memberId);

    if (!trainer || !member) {
      return res.status(404).json({
        success: false,
        message: 'Trainer or Member not found'
      });
    }

    // Remove member from trainer's list
    trainer.assignedMembers = trainer.assignedMembers.filter(
      id => id.toString() !== member._id.toString()
    );
    await trainer.save();

    // Remove trainer from member
    member.assignedTrainer = undefined;
    await member.save();

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
