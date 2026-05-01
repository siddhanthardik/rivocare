const mongoose = require('mongoose');

const pricingSchema = new mongoose.Schema(
  {
    serviceType: {
      type: String,
      required: true,
      enum: ['nurse', 'physiotherapist', 'doctor', 'caretaker', 'procedure', 'package', 'lab'],
    },
    category: {
      type: String,
      required: true, // e.g., '12h_day', 'basic_rehab', 'cbc_test'
    },
    label: { type: String, required: true },
    description: { type: String },
    
    basePrice: { type: Number, required: true, min: 0 },
    multiplier: { type: Number, default: 1.0 },
    platformMargin: { type: Number, default: 0.15 }, // 15% platform fee
    
    // Overrides
    pincodeOverrides: [{
      pincode: String,
      price: Number
    }],
    partnerOverrides: [{
      partnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      price: Number
    }],
    
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Unique constraint on serviceType + category
pricingSchema.index({ serviceType: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('Pricing', pricingSchema);
