const mongoose = require('mongoose');
const { LAB_DEPARTMENT_KEYS } = require('../constants/departments');

const LabCommissionSchema = new mongoose.Schema({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  department: { 
    type: String, 
    required: true,
    enum: LAB_DEPARTMENT_KEYS,
    lowercase: true
  },
  commissionType: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
  commissionValue: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

// Ensure one commission per department per lab
LabCommissionSchema.index({ partner: 1, department: 1 }, { unique: true });

module.exports = mongoose.model('LabCommission', LabCommissionSchema);
