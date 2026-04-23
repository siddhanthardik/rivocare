const mongoose = require('mongoose');

const providerVerificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Only one active KYC application per user
    },
    govtIdUrl: { type: String, required: true },
    degreeUrl: { type: String, required: true },
    registrationNumber: { type: String, required: true },
    councilType: { 
      type: String, 
      enum: ['NURSING', 'MEDICAL', 'OTHER'], 
      required: true 
    },
    bankDetails: {
      accountNumber: { type: String, required: true }, // ENCRYPTED
      ifscCode: { type: String, required: true, uppercase: true },
      accountHolderName: { type: String, required: true },
      chequeUrl: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    rejectedReason: { type: String, default: null },
    verifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProviderVerification', providerVerificationSchema);
