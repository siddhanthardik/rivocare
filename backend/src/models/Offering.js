const mongoose = require('mongoose');

const offeringSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    planType: {
      type: String,
      enum: ['subscription', 'package'],
      required: true,
    },
    // For subscriptions
    durationDays: {
      type: Number,
      min: 1,
    },
    sessionsPerWeek: {
      type: Number,
    },
    // For packages
    totalSessions: {
      type: Number,
      min: 1,
    },
    validityDays: {
      type: Number,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
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
  { timestamps: true, collection: 'offerings' }
);

module.exports = mongoose.model('Offering', offeringSchema);
