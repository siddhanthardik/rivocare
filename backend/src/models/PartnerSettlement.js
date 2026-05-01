const mongoose = require('mongoose');

const PartnerSettlementSchema = new mongoose.Schema({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerWallet', required: true },
  
  totalAmount: { type: Number, required: true },
  platformFees: { type: Number, default: 0 },
  netPayout: { type: Number, required: true },
  
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'completed' },
  
  payoutReference: { type: String }, // e.g. bank transaction ID
  payoutMethod: { type: String, enum: ['bank_transfer', 'upi'], default: 'bank_transfer' },
  
  periodStart: { type: Date },
  periodEnd: { type: Date },
  
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('PartnerSettlement', PartnerSettlementSchema);
