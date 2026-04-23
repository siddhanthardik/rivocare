const mongoose = require('mongoose');

const serviceablePincodeSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\d{6}$/, 'Pincode must be exactly 6 digits'],
    },
    areaName: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceablePincode', serviceablePincodeSchema);
