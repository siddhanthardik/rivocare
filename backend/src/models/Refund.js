const mongoose = require('mongoose');

const RefundSchema = new mongoose.Schema({
  payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  labOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'LabOrder' },
  amount: { type: Number, required: true },
  reason: { type: String },
  refundStatus: { type: String, enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED'], default: 'PENDING' },
  gatewayRefundId: { type: String },
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model('Refund', RefundSchema);
