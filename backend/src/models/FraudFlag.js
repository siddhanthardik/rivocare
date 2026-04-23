const mongoose = require('mongoose');

const fraudFlagSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      enum: ['PROVIDER', 'USER', 'BOOKING'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      // Ref can be dynamic based on entityType, but Mongoose supports refPath if needed.
      // For simplicity, we just store the ID and manually populate or use generic lookups via entityType later.
    },
    reason: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      required: true,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for faster dashboard queries
fraudFlagSchema.index({ entityType: 1, isResolved: 1 });
fraudFlagSchema.index({ severity: 1 });
fraudFlagSchema.index({ entityId: 1 });

module.exports = mongoose.model('FraudFlag', fraudFlagSchema);
