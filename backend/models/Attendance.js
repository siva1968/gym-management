const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  memberId: {
    type: String,
    required: true
  },
  memberName: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkInTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  checkOutTime: {
    type: Date
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  checkInMethod: {
    type: String,
    enum: ['qr-code', 'manual', 'rfid'],
    default: 'manual'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Calculate duration on checkout
attendanceSchema.pre('save', function(next) {
  if (this.checkOutTime && this.checkInTime) {
    const diff = this.checkOutTime - this.checkInTime;
    this.duration = Math.floor(diff / (1000 * 60)); // Convert to minutes
  }
  next();
});

// Index for faster queries
attendanceSchema.index({ member: 1, date: 1 });
attendanceSchema.index({ date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
