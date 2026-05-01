const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      enum: ['nurse', 'physiotherapist', 'doctor', 'caretaker', 'procedure', 'package'],
      unique: true,
    },
    label: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: '🏥' },
    basePrice: { type: Number, required: true, min: 0 },
    maxMarkupAllowed: { type: Number, default: 500, min: 0 },
    durationHours: { type: Number, default: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
