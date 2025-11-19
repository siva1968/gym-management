const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  memberId: {
    type: String,
    unique: true,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  alternatePhone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  age: {
    type: Number
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  // Physical details
  weight: {
    type: Number,
    unit: 'kg'
  },
  height: {
    type: Number,
    unit: 'cm'
  },
  bmi: {
    type: Number
  },
  // Membership details
  membershipType: {
    type: String,
    enum: ['Strength', 'Strength + Cardio', 'Cardio', 'Personal Training', 'Group Classes'],
    required: true
  },
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipPlan'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Payment details
  totalFees: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  pendingAmount: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending'
  },
  // Assigned trainer
  assignedTrainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Trainer'
  },
  // QR Code for attendance
  qrCode: {
    type: String
  },
  // Health info
  medicalConditions: {
    type: String
  },
  fitnessGoal: {
    type: String
  },
  // Photo
  photo: {
    type: String
  },
  // Notes
  notes: {
    type: String
  },
  // Status
  status: {
    type: String,
    enum: ['active', 'expired', 'frozen', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Calculate BMI
memberSchema.pre('save', function(next) {
  if (this.weight && this.height) {
    const heightInMeters = this.height / 100;
    this.bmi = (this.weight / (heightInMeters * heightInMeters)).toFixed(2);
  }

  // Calculate pending amount
  this.pendingAmount = this.totalFees - this.paidAmount;

  // Update payment status
  if (this.pendingAmount <= 0) {
    this.paymentStatus = 'paid';
  } else if (new Date() > this.endDate) {
    this.paymentStatus = 'overdue';
  } else {
    this.paymentStatus = 'pending';
  }

  next();
});

module.exports = mongoose.model('Member', memberSchema);
