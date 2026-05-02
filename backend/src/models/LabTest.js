const mongoose = require('mongoose');
const { LAB_DEPARTMENT_KEYS } = require('../constants/departments');

const LabTestSchema = new mongoose.Schema({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  name: { type: String, required: true },
  department: { 
    type: String, 
    required: true,
    enum: LAB_DEPARTMENT_KEYS,
    lowercase: true
  },
  description: { type: String },
  parameters: [{ type: String }], // What the test measures
  
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  
  commissionOverride: {
    active: { type: Boolean, default: false },
    commissionType: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
    commissionValue: { type: Number, default: 20, min: 0 }
  },
  
  prepInstructions: { type: String }, // e.g. "Fasting for 12 hours"
  tatHours: { type: Number, default: 24 }, // Turnaround time in hours
  
  isActive: { type: Boolean, default: true },
  isPackage: { type: Boolean, default: false }, // If it's a health package grouping multiple tests
}, { timestamps: true });

LabTestSchema.index({ name: 'text', department: 'text' });

module.exports = mongoose.model('LabTest', LabTestSchema);
