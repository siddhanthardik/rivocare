const mongoose = require('mongoose');

const LabTestSchema = new mongoose.Schema({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  name: { type: String, required: true },
  category: { type: String, enum: ['Blood', 'Urine', 'Imaging', 'Pathology', 'Other'], default: 'Blood' },
  description: { type: String },
  parameters: [{ type: String }], // What the test measures
  
  price: { type: Number, required: true },
  discountPrice: { type: Number },
  
  prepInstructions: { type: String }, // e.g. "Fasting for 12 hours"
  tatHours: { type: Number, default: 24 }, // Turnaround time in hours
  
  isActive: { type: Boolean, default: true },
  isPackage: { type: Boolean, default: false }, // If it's a health package grouping multiple tests
}, { timestamps: true });

LabTestSchema.index({ name: 'text', category: 'text' });

module.exports = mongoose.model('LabTest', LabTestSchema);
