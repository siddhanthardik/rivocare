const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
      unique: true,
    },
    isAvailable: { type: Boolean, default: true },
    workingDays: { type: [Number], default: [] },
    slots: { type: [String], default: [] },
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '19:00' },
    shiftType: { type: String, default: 'custom' },
    blockedSlots: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Availability', availabilitySchema);
