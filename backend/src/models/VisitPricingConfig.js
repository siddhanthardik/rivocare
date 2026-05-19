const mongoose = require('mongoose');

const visitPricingConfigSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      required: true,
      index: true,
    },
    city: {
      type: String,
      default: 'Default',
      index: true,
    },
    baseVisitFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    tierRules: [
      {
        minKm: { type: Number, required: true },
        maxKm: { type: Number, required: true },
        fee: { type: Number, required: true },
      },
    ],
    waiverRules: {
      enabled: { type: Boolean, default: false },
      aboveAmount: { type: Number, default: 0 },
    },
    promoRules: {
      freeVisitDays: [{ type: String }],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    providerVisitShare: {
      type: Number,
      default: 100, // percentage or flat amount, depending on logic
    },
    platformVisitShare: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VisitPricingConfig', visitPricingConfigSchema);
