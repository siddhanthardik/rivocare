const mongoose = require('mongoose');

const PartnerTransactionSchema = new mongoose.Schema({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerWallet', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'LabOrder' },
  
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  platformCommission: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  description: { type: String, required: true },
  
  payoutDetails: {
    payoutId: String,
    method: String,
    processedAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('PartnerTransaction', PartnerTransactionSchema);
