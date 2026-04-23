const mongoose = require('mongoose');

const patientSubscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      default: null, // assigned by admin
    },
    startDate: {
      type: Date,
      default: null, // starts when admin confirms allocation
    },
    endDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['PENDING_ASSIGNMENT', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING_ASSIGNMENT',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PatientSubscription', patientSubscriptionSchema);
