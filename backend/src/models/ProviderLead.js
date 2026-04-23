const mongoose = require('mongoose');

const providerLeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{10}$/, 'Phone must be 10 digits'],
    },
    email: { type: String, trim: true, lowercase: true, default: null },
    serviceType: {
      type: String,
      required: true,
      enum: ['nurse', 'physiotherapist', 'doctor', 'caretaker'],
    },
    pincode: {
      type: String,
      required: true,
      match: [/^\d{6}$/, 'Pincode must be 6 digits'],
    },
    city: { type: String, default: '' },
    experience: { type: Number, default: 0, min: 0 },
    source: {
      type: String,
      enum: ['WEBSITE', 'WHATSAPP', 'REFERRAL', 'ADMIN'],
      default: 'WEBSITE',
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      default: null,
    },
    referralCode: { type: String, default: null }, // referral code used
    status: {
      type: String,
      enum: ['NEW', 'CONTACTED', 'ONBOARDED', 'REJECTED'],
      default: 'NEW',
    },
    notes: { type: String, default: '' }, // admin notes
    convertedProviderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      default: null,
    },
  },
  { timestamps: true }
);

// Index for quick lookup by phone / pincode
providerLeadSchema.index({ phone: 1 });
providerLeadSchema.index({ pincode: 1, status: 1 });

module.exports = mongoose.model('ProviderLead', providerLeadSchema);
