const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const PartnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  phone: { type: String, required: true, unique: true },
  role: { type: String, default: 'partner' }, // to differentiate from 'user' or 'admin'
  status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
  type: { type: String, enum: ['lab', 'diagnostic_center', 'collection_center'], default: 'lab' },
  lastLogin: { type: Date },
  lastActive: { type: Date },
  fcmToken: { type: String }, // For push notifications
  subscriptionPlan: { type: String, enum: ['basic', 'silver', 'gold'], default: 'basic' },
  performanceScore: { type: Number, default: 100 },
  penaltyBalance: { type: Number, default: 0 },
}, { timestamps: true });

PartnerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

PartnerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Partner', PartnerSchema);
