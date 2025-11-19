const mongoose = require('mongoose');

const trainerSchema = new mongoose.Schema({
  trainerId: {
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
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date
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
  // Professional details
  specialization: [{
    type: String,
    enum: ['Strength Training', 'Cardio', 'Yoga', 'CrossFit', 'Nutrition', 'Physiotherapy', 'Personal Training']
  }],
  experience: {
    type: Number,
    min: 0
  },
  certifications: [{
    name: String,
    issuedBy: String,
    issueDate: Date,
    expiryDate: Date
  }],
  // Employment details
  joiningDate: {
    type: Date,
    required: true
  },
  employmentType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract'],
    default: 'full-time'
  },
  // Shift timings
  shiftTimings: {
    startTime: String,
    endTime: String,
    workingDays: [String]
  },
  // Salary details
  salaryType: {
    type: String,
    enum: ['fixed', 'commission', 'mixed'],
    default: 'fixed'
  },
  baseSalary: {
    type: Number,
    default: 0
  },
  commissionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Assigned members
  assignedMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member'
  }],
  maxCapacity: {
    type: Number,
    default: 20
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  // Photo
  photo: {
    type: String
  },
  // Bio
  bio: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Trainer', trainerSchema);
