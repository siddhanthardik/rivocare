const mongoose = require('mongoose');

const servicePricingSchema = new mongoose.Schema(
  {
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
      unique: true,
    },
    basePrice: { type: Number, required: true, min: 0 },
    providerPayoutType: { 
      type: String, 
      enum: ['percentage', 'flat'], 
      default: 'percentage' 
    },
    providerPayoutValue: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServicePricing', servicePricingSchema);
