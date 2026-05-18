const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const PayoutRequest = require('../models/PayoutRequest');
const WebhookLog = require('../models/WebhookLog');

// GET /api/admin/reconciliation/summary
exports.getSummary = async (req, res, next) => {
  try {
    const totalBookings = await Booking.countDocuments();

    const collectedAgg = await Payment.aggregate([
      { $match: { status: 'SUCCESS' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const totalCollected = collectedAgg[0]?.total || 0;

    const pendingPayments = await Payment.countDocuments({ status: 'CREATED' });
    const failedPayments = await Payment.countDocuments({ status: 'FAILED' });

    const successfulPayoutsAgg = await PayoutRequest.aggregate([
      { $match: { status: 'COMPLETED' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const successfulPayouts = successfulPayoutsAgg[0]?.count || 0;
    const successfulPayoutsAmount = successfulPayoutsAgg[0]?.total || 0;

    const pendingPayoutsAgg = await PayoutRequest.aggregate([
      { $match: { status: 'PENDING' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);
    const pendingPayouts = pendingPayoutsAgg[0]?.count || 0;
    const pendingPayoutsAmount = pendingPayoutsAgg[0]?.total || 0;

    const webhookFailures = await WebhookLog.countDocuments({ processed: false });

    // orphan payments: payments without booking and not SUCCESS
    const orphanPayments = await Payment.countDocuments({ booking: { $exists: false }, status: { $ne: 'SUCCESS' } });

    // unpaid completed bookings — use $in for both casing variants
    const unpaidCompleted = await Booking.countDocuments({
      status: { $in: ['COMPLETED', 'completed'] },
      paymentStatus: { $nin: ['PAID', 'paid', 'COLLECTED', 'collected', 'SUCCESS', 'success'] },
    });

    // disputed bookings (cash disputes raised by patients)
    const disputedBookings = await Booking.countDocuments({ disputeRaised: true });

    res.json({
      success: true,
      data: {
        totalBookings,
        totalCollected,
        pendingPayments,
        failedPayments,
        successfulPayouts,
        successfulPayoutsAmount,
        pendingPayouts,
        pendingPayoutsAmount,
        webhookFailures,
        orphanPayments,
        unpaidCompleted,
        disputedBookings,
      }
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/reconciliation/payments
exports.getPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, q } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};
    if (status) filter.status = status;
    if (q) {
      if (mongoose.Types.ObjectId.isValid(q)) filter._id = mongoose.Types.ObjectId(q);
      else filter.$or = [ { razorpayOrderId: { $regex: q, $options: 'i' } }, { razorpayPaymentId: { $regex: q, $options: 'i' } } ];
    }

    const total = await Payment.countDocuments(filter);
    const rows = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({ success: true, data: { payments: rows, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/reconciliation/payouts
exports.getPayouts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, q } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};
    if (status) filter.status = status;
    if (q) {
      if (mongoose.Types.ObjectId.isValid(q)) filter._id = mongoose.Types.ObjectId(q);
    }

    const total = await PayoutRequest.countDocuments(filter);
    const rows = await PayoutRequest.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('provider wallet transaction')
      .lean();

    res.json({ success: true, data: { payouts: rows, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/reconciliation/failures
exports.getFailures = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const total = await WebhookLog.countDocuments({ processed: false });
    const rows = await WebhookLog.find({ processed: false })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    res.json({ success: true, data: { failures: rows, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) } });
  } catch (err) {
    next(err);
  }
};
