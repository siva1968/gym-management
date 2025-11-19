const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Member validation rules
const memberValidation = {
  create: [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),
    body('phone').trim().notEmpty().withMessage('Phone is required').matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
    body('email').optional().trim().isEmail().withMessage('Invalid email format'),
    body('membershipType').notEmpty().withMessage('Membership type is required').isIn(['Strength', 'Strength + Cardio', 'Cardio', 'Personal Training', 'Group Classes']).withMessage('Invalid membership type'),
    body('startDate').notEmpty().withMessage('Start date is required').isISO8601().withMessage('Invalid date format'),
    body('totalFees').notEmpty().withMessage('Total fees is required').isNumeric().withMessage('Total fees must be a number').isFloat({ min: 0 }).withMessage('Total fees must be positive'),
    body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
    body('weight').optional().isNumeric().withMessage('Weight must be a number'),
    body('height').optional().isNumeric().withMessage('Height must be a number'),
    validate
  ],
  update: [
    param('id').isMongoId().withMessage('Invalid member ID'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),
    body('phone').optional().trim().matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
    body('email').optional().trim().isEmail().withMessage('Invalid email format'),
    body('totalFees').optional().isNumeric().withMessage('Total fees must be a number'),
    validate
  ]
};

// Trainer validation rules
const trainerValidation = {
  create: [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters'),
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
    body('phone').trim().notEmpty().withMessage('Phone is required').matches(/^[0-9]{10}$/).withMessage('Phone must be 10 digits'),
    body('joiningDate').notEmpty().withMessage('Joining date is required').isISO8601().withMessage('Invalid date format'),
    body('baseSalary').optional().isNumeric().withMessage('Base salary must be a number').isFloat({ min: 0 }).withMessage('Salary must be positive'),
    validate
  ]
};

// Payment validation rules
const paymentValidation = {
  create: [
    body('member').notEmpty().withMessage('Member ID is required').isMongoId().withMessage('Invalid member ID'),
    body('amount').notEmpty().withMessage('Amount is required').isNumeric().withMessage('Amount must be a number').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
    body('paymentMethod').notEmpty().withMessage('Payment method is required').isIn(['cash', 'upi', 'card', 'net-banking', 'cheque']).withMessage('Invalid payment method'),
    validate
  ]
};

// Expense validation rules
const expenseValidation = {
  create: [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('category').notEmpty().withMessage('Category is required').isIn(['Rent', 'Equipment', 'Utilities', 'Salaries', 'Marketing', 'Maintenance', 'Supplies', 'Other']).withMessage('Invalid category'),
    body('amount').notEmpty().withMessage('Amount is required').isNumeric().withMessage('Amount must be a number').isFloat({ min: 1 }).withMessage('Amount must be at least 1'),
    body('paymentMethod').notEmpty().withMessage('Payment method is required').isIn(['cash', 'upi', 'card', 'net-banking', 'cheque']).withMessage('Invalid payment method'),
    body('date').notEmpty().withMessage('Date is required').isISO8601().withMessage('Invalid date format'),
    validate
  ]
};

// Attendance validation rules
const attendanceValidation = {
  checkIn: [
    body('memberId').trim().notEmpty().withMessage('Member ID is required'),
    body('checkInMethod').optional().isIn(['qr-code', 'manual', 'rfid']).withMessage('Invalid check-in method'),
    validate
  ]
};

// Membership plan validation rules
const planValidation = {
  create: [
    body('name').trim().notEmpty().withMessage('Plan name is required'),
    body('membershipType').notEmpty().withMessage('Membership type is required').isIn(['Strength', 'Strength + Cardio', 'Cardio', 'Personal Training', 'Group Classes']).withMessage('Invalid membership type'),
    body('duration.value').notEmpty().withMessage('Duration value is required').isInt({ min: 1 }).withMessage('Duration must be at least 1'),
    body('duration.unit').notEmpty().withMessage('Duration unit is required').isIn(['days', 'months', 'years']).withMessage('Invalid duration unit'),
    body('price').notEmpty().withMessage('Price is required').isNumeric().withMessage('Price must be a number').isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('discount').optional().isNumeric().withMessage('Discount must be a number').isFloat({ min: 0, max: 100 }).withMessage('Discount must be between 0-100'),
    validate
  ]
};

// Auth validation rules
const authValidation = {
  login: [
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate
  ],
  register: [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['owner', 'manager', 'staff']).withMessage('Invalid role'),
    validate
  ]
};

module.exports = {
  validate,
  memberValidation,
  trainerValidation,
  paymentValidation,
  expenseValidation,
  attendanceValidation,
  planValidation,
  authValidation
};
