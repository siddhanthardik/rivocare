const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    serviceType: {
      type: String,
      enum: ['nurse', 'physiotherapist', 'doctor', 'caretaker'],
      required: true,
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
    },
    sessionsPerWeek: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
