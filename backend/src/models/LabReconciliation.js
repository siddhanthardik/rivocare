const mongoose = require('mongoose');

/**
 * LabReconciliation — daily per-lab financial snapshot
 * Created/updated by getReconciliation, finalized by settleReconciliation.
 * Idempotent: one record per (labId, date string).
 */
const LabReconciliationSchema = new mongoose.Schema({
  partner:        { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  date:           { type: String, required: true },   // 'YYYY-MM-DD'

  ordersCount:    { type: Number, default: 0 },
  totalAmount:    { type: Number, default: 0 },       // sum of totalAmount (collected only)
  platformFee:    { type: Number, default: 0 },       // totalAmount * margin
  labEarning:     { type: Number, default: 0 },       // totalAmount - platformFee
  collectedAmount:{ type: Number, default: 0 },       // same as totalAmount (collected)
  settledAmount:  { type: Number, default: 0 },       // sum of completed settlements
  difference:     { type: Number, default: 0 },       // collectedAmount - settledAmount

  status: {
    type: String,
    enum: ['settled', 'pending', 'mismatch'],
    default: 'pending',
  },

  // Audit trail
  settledBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  settledAt:      { type: Date },
  notes:          { type: String },
  flagged:        { type: Boolean, default: false },
  flagReason:     { type: String },
}, { timestamps: true });

// Unique per partner per date
LabReconciliationSchema.index({ partner: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('LabReconciliation', LabReconciliationSchema);
