const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { verifyToken, isOwnerOrManager } = require('../middleware/auth');

// Get all expenses
router.get('/', verifyToken, async (req, res) => {
  try {
    const { category, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};

    if (category) query.category = category;

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const expenses = await Expense.find(query)
      .populate('addedBy', 'name')
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Expense.countDocuments(query);

    res.json({
      success: true,
      count: expenses.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      expenses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching expenses',
      error: error.message
    });
  }
});

// Get expense by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('addedBy', 'name');

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching expense',
      error: error.message
    });
  }
});

// Create expense
router.post('/', verifyToken, isOwnerOrManager, async (req, res) => {
  try {
    const expense = new Expense({
      ...req.body,
      addedBy: req.user._id
    });

    await expense.save();

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error recording expense',
      error: error.message
    });
  }
});

// Update expense
router.put('/:id', verifyToken, isOwnerOrManager, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense updated successfully',
      expense
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating expense',
      error: error.message
    });
  }
});

// Delete expense
router.delete('/:id', verifyToken, isOwnerOrManager, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    res.json({
      success: true,
      message: 'Expense deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting expense',
      error: error.message
    });
  }
});

// Get expense summary
router.get('/summary/stats', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const expenses = await Expense.find(query);

    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const byCategory = {};
    expenses.forEach(expense => {
      byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
    });

    res.json({
      success: true,
      summary: {
        totalExpenses,
        totalTransactions: expenses.length,
        byCategory
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching expense summary',
      error: error.message
    });
  }
});

module.exports = router;
