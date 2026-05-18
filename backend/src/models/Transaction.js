const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    wallet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    type: {
      type: String,
      enum: ['CREDIT', 'DEBIT'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      required: true,
    },
      referenceType: { type: String },
      referenceId: { type: mongoose.Schema.Types.ObjectId },
      status: { type: String, enum: ['PENDING', 'COMPLETED', 'FAILED'], default: 'COMPLETED' },
      externalReference: { type: String },
      // Optional audit fields (safe to add)
      processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      processedAt: { type: Date },
      idempotencyKey: { type: String },
      auditMetadata: { type: mongoose.Schema.Types.Mixed },
      requestId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);
