const mongoose = require('mongoose');

const patientPackageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      default: null, // assigned by admin
    },
    sessionsRemaining: {
      type: Number, // Initially set to package.totalSessions down the line
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      default: null, // starts when admin confirms allocation
    },
    expiryDate: {
      type: Date,
      default: null, // starts + validityDays
    },
    status: {
      type: String,
      enum: ['PENDING_ASSIGNMENT', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING_ASSIGNMENT',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('PatientPackage', patientPackageSchema);
