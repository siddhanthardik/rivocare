const mongoose = require('mongoose');

const PayoutRequestSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  wallet: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerWallet', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED'], default: 'PENDING' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
  externalReference: { type: String },
  note: { type: String },
  transaction: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerTransaction' },
  idempotencyKey: { type: String },
  auditMetadata: { type: mongoose.Schema.Types.Mixed },
  requestId: { type: String },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model('PayoutRequest', PayoutRequestSchema);
