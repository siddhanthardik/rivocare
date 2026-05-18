const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
    },
    labOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LabOrder',
    },
    // For PREPAID intents where Booking is created only after payment
    bookingIntent: { type: mongoose.Schema.Types.Mixed },
    // For PREPAID intents where LabOrder is created only after payment
    labIntent: { type: mongoose.Schema.Types.Mixed },
    amount: {
      type: Number,
      required: true, // Amount in paise/cents
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['CREATED', 'SUCCESS', 'FAILED'],
      default: 'CREATED',
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    // Optional audit/tracing fields — do not make required
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    processedAt: { type: Date },
    idempotencyKey: { type: String },
    auditMetadata: { type: mongoose.Schema.Types.Mixed },
    requestId: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
