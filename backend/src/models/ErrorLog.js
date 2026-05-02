const mongoose = require('mongoose');

const ErrorLogSchema = new mongoose.Schema({
  message: { type: String, required: true },
  stack: { type: String },
  route: { type: String },
  component: { type: String },
  user: {
    id: { type: String },
    email: { type: String },
    role: { type: String }
  },
  browser: {
    userAgent: { type: String },
    platform: { type: String },
    language: { type: String }
  },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for performance
ErrorLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('ErrorLog', ErrorLogSchema);
