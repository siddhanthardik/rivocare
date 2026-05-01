const mongoose = require('mongoose');

const PartnerWalletSchema = new mongoose.Schema({
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true, unique: true },
  balance: { type: Number, default: 0 },
  totalEarned: { type: Number, default: 0 },
  pendingPayouts: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('PartnerWallet', PartnerWalletSchema);
