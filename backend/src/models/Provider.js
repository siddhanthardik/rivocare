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
      enum: ['INCOMPLETE', 'KYC_PENDING', 'VERIFIED', 'ACTIVE'],
      default: 'INCOMPLETE',
    },
    isAvailable: { type: Boolean, default: false }, // distinct from isOnline (session) — permanent availability flag
    referralCode: { type: String, unique: true, sparse: true }, // provider's own referral code
    referredByCode: { type: String, default: null }, // code they used to sign up
    markup: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0 },
    completedBookings: { type: Number, default: 0 },
    cancellationCount: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    isBlocked: { type: Boolean, default: false },
    warningCount: { type: Number, default: 0 },
    notes: { type: String, default: '{}' }, // Used for serialized availability JSON
  },
  { timestamps: true }
);

// Virtual: update rating
providerSchema.methods.updateRating = function (newRating) {
  const total = this.rating * this.totalRatings + newRating;
  this.totalRatings += 1;
  this.rating = parseFloat((total / this.totalRatings).toFixed(1));
};

module.exports = mongoose.model('Provider', providerSchema);
