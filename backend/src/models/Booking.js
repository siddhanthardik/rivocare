const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
    },
    service: {
      type: String,
      enum: ['nurse', 'physiotherapist', 'doctor', 'caretaker', 'procedure', 'package'],
      required: true,
    },
    address: { type: String, required: true, trim: true },
    pincode: {
      type: String,
      required: true,
      match: [/^\d{6}$/, 'Pincode must be 6 digits'],
    },
    scheduledAt: { type: Date, required: true },
    durationHours: { type: Number, default: 1, min: 1, max: 1000 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    notes: { type: String, maxlength: 500, default: '' },
    totalAmount: { type: Number, required: true, min: 0 },
    basePrice: { type: Number, min: 0, default: 0 },
    providerMarkup: { type: Number, default: 0, min: 0 },
    estimatedPrice: { type: Number, min: 0, default: 0 },
    finalPrice: { type: Number, default: null },
    priceUpdateReason: { type: String, default: null },
    priceUpdated: { type: Boolean, default: false },
    priceApprovedByPatient: { type: Boolean, default: true },
    // Admin Override Pricing
    pricingType: { type: String, enum: ['STANDARD', 'OVERRIDE'], default: 'STANDARD' },
    overridePrice: { type: Number, default: null, min: 0 },
    overrideReason: { type: String, default: null },
    priceSetBy: { type: String, enum: ['SYSTEM', 'ADMIN', 'PROVIDER'], default: 'SYSTEM' },
    priceHistory: [{
      changedBy: { type: String, enum: ['provider', 'patient', 'system', 'admin'], required: true },
      changedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      oldPrice: { type: Number },
      newPrice: { type: Number },
      reason: { type: String },
      action: { type: String }, // 'update', 'approve', 'reject', 'cancel_50pct'
      timestamp: { type: Date, default: Date.now },
    }],
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'REFUNDED'],
      default: 'PENDING',
    },
    cancelReason: { type: String, default: null },
    startedAt: { type: Date, default: null }, // Actual start time
    completedAt: { type: Date, default: null }, // Actual complete time
    expiresAt: { type: Date, default: null }, // Auto-expiring timer
    patientVerifiedCompletion: { type: Boolean, default: null }, // null = unverified, true = yes, false = no
    systemFlags: { type: [String], default: [] }, // e.g. 'SHORT_COMPLETION_TIME', 'PATIENT_DENIED_COMPLETION'
    rating: { type: Number, min: 1, max: 5, default: null },
    review: { type: String, default: null },
  },
  { timestamps: true }
);

// Ensure provider can't be double-booked at same time
bookingSchema.index({ provider: 1, scheduledAt: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
