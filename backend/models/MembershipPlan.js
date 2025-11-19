const mongoose = require('mongoose');

const membershipPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  duration: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['days', 'months', 'years'],
      default: 'months'
    }
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  features: [{
    type: String
  }],
  membershipType: {
    type: String,
    enum: ['Strength', 'Strength + Cardio', 'Cardio', 'Personal Training', 'Group Classes'],
    required: true
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Calculate final price after discount
membershipPlanSchema.virtual('finalPrice').get(function() {
  return this.price - (this.price * this.discount / 100);
});

module.exports = mongoose.model('MembershipPlan', membershipPlanSchema);
