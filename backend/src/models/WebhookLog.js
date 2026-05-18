const mongoose = require('mongoose');

const WebhookLogSchema = new mongoose.Schema({
  eventId: { type: String, index: true, unique: true, sparse: true },
  provider: { type: String },
  eventType: { type: String },
  payload: { type: mongoose.Schema.Types.Mixed },
  payloadHash: { type: String, index: true, sparse: true },
  signature: { type: String },
  status: { type: String, default: 'received' },
  processed: { type: Boolean, default: false },
  processedAt: { type: Date },
  requestId: { type: String },
  headers: { type: mongoose.Schema.Types.Mixed },
  // keep legacy field
  receivedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// index createdAt for faster time-window queries
WebhookLogSchema.index({ createdAt: 1 });

module.exports = mongoose.model('WebhookLog', WebhookLogSchema);
