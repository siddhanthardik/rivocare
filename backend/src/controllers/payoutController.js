const PayoutRequest = require('../models/PayoutRequest');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const billingLogger = require('../utils/billingLogger');

// GET /api/admin/payouts
exports.listPayouts = async (req, res, next) => {
  try {
    const { status = 'PENDING', page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const total = await PayoutRequest.countDocuments(filter);
    const payouts = await PayoutRequest.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('provider wallet transaction');

    res.json({ success: true, data: { payouts, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/payouts/:id/process
exports.processPayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { externalReference, markFailed } = req.body;

    const payout = await PayoutRequest.findById(id).populate('transaction').populate('wallet');
    if (!payout) return res.status(404).json({ success: false, message: 'Payout not found' });
    if (payout.status !== 'PENDING' && payout.status !== 'PROCESSING') {
      return res.status(400).json({ success: false, message: 'Payout already processed' });
    }

    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      if (markFailed) {
        // Release reserved amount back to wallet
        await Wallet.findByIdAndUpdate(payout.wallet, { $inc: { reservedBalance: -payout.amount, balance: payout.amount } }, { session });
        payout.status = 'FAILED';
        payout.processedAt = Date.now();
        await payout.save({ session });
        if (payout.transaction) {
          await Transaction.findByIdAndUpdate(payout.transaction, { status: 'FAILED', externalReference }, { session });
        }
      } else {
        // Complete payout: deduct reservedBalance and pendingPayouts permanently
        const PartnerWallet = require('../models/PartnerWallet');
        await PartnerWallet.findByIdAndUpdate(
          payout.wallet,
          { $inc: { reservedBalance: -payout.amount, pendingPayouts: -payout.amount } },
          { session }
        );
        payout.status = 'COMPLETED';
        payout.processedAt = Date.now();
        payout.externalReference = externalReference || null;
        await payout.save({ session });

        if (payout.transaction) {
          await Transaction.findByIdAndUpdate(payout.transaction, { status: 'COMPLETED', externalReference }, { session });
        }
      }

      await session.commitTransaction();
      session.endSession();

      try {
        billingLogger.logPayoutProcessed({
          bookingId: payout._id && payout._id.toString(),
          providerId: payout.provider && payout.provider.toString(),
          amount: payout.amount,
          status: payout.status,
          requestId: req.requestId,
          ip: req.ip,
          endpoint: req.originalUrl,
          metadata: { externalReference }
        });
      } catch (e) {}
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }

    res.json({ success: true, message: 'Payout processed', data: payout });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/payouts/:id/approve
exports.approvePayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payout = await PayoutRequest.findById(id);
    if (!payout) return res.status(404).json({ success: false, message: 'Payout not found' });
    if (payout.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Payout not in PENDING state' });

    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      // Reserve funds atomically on PartnerWallet
      const PartnerWallet = require('../models/PartnerWallet');
      const wallet = await PartnerWallet.findOneAndUpdate({ _id: payout.wallet, balance: { $gte: payout.amount }, reservedBalance: { $gte: 0 } }, { $inc: { reservedBalance: payout.amount, pendingPayouts: payout.amount } }, { new: true, session });
      if (!wallet) {
        throw new Error('Insufficient available balance to approve payout');
      }

      payout.status = 'APPROVED';
      payout.processedAt = Date.now();
      await payout.save({ session });

      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }

    res.json({ success: true, message: 'Payout approved', data: payout });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/payouts/:id/fail
exports.failPayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const payout = await PayoutRequest.findById(id);
    if (!payout) return res.status(404).json({ success: false, message: 'Payout not found' });

    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const PartnerWallet = require('../models/PartnerWallet');
      await PartnerWallet.findByIdAndUpdate(payout.wallet, { $inc: { reservedBalance: -payout.amount, balance: payout.amount, pendingPayouts: -payout.amount } }, { session });
      payout.status = 'FAILED';
      payout.processedAt = Date.now();
      payout.notes = reason || payout.notes;
      await payout.save({ session });
      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }

    res.json({ success: true, message: 'Payout marked failed', data: payout });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/payouts/:id/reject
exports.rejectPayout = async (req, res, next) => {
  try {
    const { id } = req.params;
    const payout = await PayoutRequest.findById(id);
    if (!payout) return res.status(404).json({ success: false, message: 'Payout not found' });
    if (payout.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Only pending payouts can be rejected' });

    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      // simply mark rejected
      payout.status = 'REJECTED';
      payout.processedAt = Date.now();
      await payout.save({ session });
      await session.commitTransaction();
      session.endSession();
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }

    res.json({ success: true, message: 'Payout rejected', data: payout });
  } catch (err) {
    next(err);
  }
};
