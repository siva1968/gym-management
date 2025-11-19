const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key');
    const user = await User.findByPk(decoded.userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.',
      error: error.message
    });
  }
};

// Check if user is owner or manager
const isOwnerOrManager = (req, res, next) => {
  if (req.user.role === 'owner' || req.user.role === 'manager') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Insufficient permissions.'
    });
  }
};

// Check if user is owner
const isOwner = (req, res, next) => {
  if (req.user.role === 'owner') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Owner access required.'
    });
  }
};

module.exports = {
  verifyToken,
  isOwnerOrManager,
  isOwner
};
