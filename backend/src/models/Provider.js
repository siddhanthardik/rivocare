const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    services: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Service',
      default: [],
    },
    bio: { type: String, maxlength: 500, default: '' },
    experience: { type: Number, default: 0, min: 0 }, // years
    pincodesServed: { type: [String], default: [] },
    isOnline: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    onboardingStatus: {
      type: String,
      enum: ['INCOMPLETE', 'DRAFT', 'PENDING_VERIFICATION', 'ACTIVE', 'REJECTED', 'SUSPENDED'],
      default: 'INCOMPLETE',
    },
    // ---- ONBOARDING & TRUST BADGES ----
    languages: { type: [String], default: [] },
    gender: { type: String, enum: ['Male', 'Female', 'Other', 'Prefer not to say'], default: 'Prefer not to say' },
    profession: { type: String, default: '' },
    
    kycDetails: {
      aadhaarUrl: { type: String, default: null },
      panUrl: { type: String, default: null },
      bankAccount: { type: String, default: null },
      ifsc: { type: String, default: null },
      chequeUrl: { type: String, default: null },
      status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' }
    },

    professionalDocs: [{
      documentType: String,
      fileUrl: String,
      uploadedAt: { type: Date, default: Date.now },
      status: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' }
    }],

    policeVerificationUrl: { type: String, default: null },
    policeVerificationStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED', 'NOT_SUBMITTED'], default: 'NOT_SUBMITTED' },

    declaration: {
      accepted: { type: Boolean, default: false },
      acceptedAt: { type: Date, default: null }
    },
    
    rejectionNotes: { type: String, default: '' },
    // -----------------------------------
    isProfileComplete: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: false }, // distinct from isOnline (session) — permanent availability flag
    referralCode: { type: String, unique: true, sparse: true }, // provider's own referral code
    referredByCode: { type: String, default: null }, // code they used to sign up
    markup: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    cancellationCount: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    walletBalance: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    warningCount: { type: Number, default: 0 },
    notes: { type: String, default: '{}' }, // Used for serialized availability JSON
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [77.1025, 28.7041] }, // Default to Delhi [lng, lat]
    },
  },
  { timestamps: true }
);

providerSchema.index({ location: '2dsphere' });

// Virtual: update rating
providerSchema.methods.updateRating = function (newRating) {
  const total = this.rating * this.totalRatings + newRating;
  this.totalRatings += 1;
  this.rating = parseFloat((total / this.totalRatings).toFixed(1));
};

module.exports = mongoose.model('Provider', providerSchema);
