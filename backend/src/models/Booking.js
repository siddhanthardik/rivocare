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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    offering: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Offering',
    },
    planName: { type: String, trim: true },
    price: { type: Number, min: 0 },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabTest',
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubscriptionPlan',
    },
    orderId: { type: String, unique: true, sparse: true },
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
      enum: [
        // Legacy lowercase variants
        'pending', 'confirmed', 'in-progress', 'completed', 'cancelled',
        // Canonical uppercase variants
        'REQUESTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED',
        'COLLECTED',  // COD: cash held, awaiting patient confirmation
        'PAID', 'CANCELLED',
      ],
      default: 'REQUESTED',
    },
    notes: { type: String, maxlength: 500, default: '' },
    totalAmount: { type: Number, required: true, min: 0 },
    finalAmount: { type: Number, default: null }, // Added for new pricing logic
    basePrice: { type: Number, min: 0, default: 0 },
    planPrice: { type: Number, min: 0, default: 0 },

    // Phase 1: Additive Visit Pricing Fields
    visitCharge: { type: Number, default: 0 },
    distanceCharge: { type: Number, default: 0 },
    distanceTier: { type: String, default: null },
    travelDistanceKm: { type: Number, default: 0 },
    pricingBreakdown: {
      serviceAmount: { type: Number },
      visitCharge: { type: Number },
      distanceCharge: { type: Number },
      discountAmount: { type: Number },
      totalAmount: { type: Number },
      pricingRuleSnapshot: {
        baseVisitFee: { type: Number, default: 0 },
        appliedTier: { type: String, default: null },
        waiverApplied: { type: Boolean, default: false },
        promoApplied: { type: String, default: null },
        calculatedAt: { type: Date, default: Date.now }
      }
    },

    providerVisitShare: { type: Number, default: 0 },
    platformVisitShare: { type: Number, default: 0 },

    revenueBreakdown: {
      serviceRevenue: { type: Number, default: 0 },
      visitRevenue: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 }
    },

    pricingSource: { type: String, enum: ['PLAN'], default: 'PLAN' },
    providerMarkup: { type: Number, default: 0, min: 0 },
    estimatedPrice: { type: Number, min: 0, default: 0 },
    finalPrice: { type: Number, default: null },
    priceUpdateReason: { type: String, default: null },
    priceUpdated: { type: Boolean, default: false },
    platformFee: { type: Number, default: 0 },
    providerEarning: { type: Number, default: 0 },
    labPayout: { type: Number, default: 0 },
    commissionUsed: { type: Number },
    commissionSource: { type: String, enum: ['override', 'department', 'default'] },
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
      enum: [
        'PENDING', 'PAID', 'REFUNDED', 'COLLECTED', 'FAILED',
        'PENDING_CONFIRMATION',  // COD: cash collected, not yet confirmed
        'DISPUTED',              // Patient raised a dispute
      ],
      default: 'PENDING',
    },
    cancelReason: { type: String, default: null },
    startedAt: { type: Date, default: null }, // Actual start time
    completedAt: { type: Date, default: null }, // Actual complete time
    expiresAt: { type: Date, default: null }, // Auto-expiring timer
    completionType: {
      type: String,
      enum: ['manual', 'late', 'auto', 'system'],
      default: 'manual',
    },
    completionMeta: {
      markedLate: { type: Boolean, default: false },
    },
    patientVerifiedCompletion: { type: Boolean, default: null }, // null = unverified, true = yes, false = no
    systemFlags: { type: [String], default: [] }, // e.g. 'SHORT_COMPLETION_TIME', 'PATIENT_DENIED_COMPLETION'
    rating: { type: Number, min: 1, max: 5, default: null },
    review: { type: String, default: null },
    // Cash collection fields (optional)
    collectedAmount: { type: Number },
    collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    collectedAt: { type: Date },
    paymentCollectionNote: { type: String },
    patientConfirmed: { type: Boolean, default: null },
    patientConfirmedAt: { type: Date },
    disputeRaised: { type: Boolean, default: false },

    // Dispute resolution audit trail (Phase 2)
    disputeResolution: {
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      resolvedAt: { type: Date },
      resolutionType: {
        type: String,
        enum: ['APPROVE_PROVIDER', 'REJECT_PROVIDER', 'PARTIAL_SETTLEMENT'],
      },
      adminNotes: { type: String, maxlength: 1000 },
      approvedAmount: { type: Number, min: 0 },       // For PARTIAL_SETTLEMENT
      originalCollectedAmount: { type: Number, min: 0 },
      disputeResolved: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Ensure provider can't be double-booked at same time
bookingSchema.index({ provider: 1, scheduledAt: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
