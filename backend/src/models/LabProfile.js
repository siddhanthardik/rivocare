const mongoose = require('mongoose');
const { LAB_DEPARTMENT_KEYS } = require('../constants/departments');

const LabProfileSchema = new mongoose.Schema({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, unique: true },
  labName: { type: String, required: true },
  about: { type: String },
  accreditations: [{ type: String }], // e.g., NABL, CAP, ISO
  logo: { type: String },
  images: [{ type: String }],
  
  addressDetails: {
    city: String,
    state: String,
    pincode: String,
    locality: String,
    fullAddress: String,
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
  },
  
  serviceRadius: { type: Number, default: 10 }, // km
  homeCollectionAvailable: { type: Boolean, default: true },
  homeCollectionFee: { type: Number, default: 0 },
  
  timings: {
    open: { type: String, default: '08:00' },
    close: { type: String, default: '20:00' }
  },
  
  isVerified: { type: Boolean, default: false },
  availabilityStatus: { type: String, enum: ['open', 'closed', 'busy'], default: 'open' },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  
  commissions: [{
    department: { 
      type: String, 
      required: true,
      enum: LAB_DEPARTMENT_KEYS,
      lowercase: true
    },
    commissionType: { type: String, enum: ['percentage', 'flat'], default: 'percentage' },
    commissionValue: { type: Number, required: true, min: 0 }
  }],
}, { timestamps: true });

LabProfileSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('LabProfile', LabProfileSchema);
