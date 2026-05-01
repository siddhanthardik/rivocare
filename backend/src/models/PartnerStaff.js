const mongoose = require('mongoose');

const PartnerStaffSchema = new mongoose.Schema({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, enum: ['technician', 'phlebotomist', 'manager'], default: 'phlebotomist' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('PartnerStaff', PartnerStaffSchema);
