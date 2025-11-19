const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const Expense = require('../models/Expense');
const User = require('../models/User');
const { verifyToken, isOwnerOrManager } = require('../middleware/auth');

// Get all expenses
router.get('/', verifyToken, async (req, res) => {
  try {
    const { category, startDate, endDate, page = 1, limit = 50 } = req.query;

    const where = {};

    if (category) where.category = category;

    if (startDate && endDate) {
      where.date = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate)
      };
    }

    const expenses = await Expense.findAll({
      where,
      include: [
        {
          model: User,
          as: 'addedBy',
          attributes: ['name']
        }
      ],
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    const total = await Expense.count({ where });

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
    const expense = await Expense.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'addedBy',
          attributes: ['name']
        }
      ]
    });

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
    const expense = await Expense.create({
      ...req.body,
      addedById: req.user.id
    });

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
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    await expense.update(req.body);

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
    const expense = await Expense.findByPk(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }

    await expense.destroy();

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

    const where = {};

    if (startDate && endDate) {
      where.date = {
        [Op.gte]: new Date(startDate),
        [Op.lte]: new Date(endDate)
      };
    }

    const expenses = await Expense.findAll({ where });

    const totalExpenses = expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

    const byCategory = {};
    expenses.forEach(expense => {
      byCategory[expense.category] = (byCategory[expense.category] || 0) + parseFloat(expense.amount);
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
