const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Provider = require('../models/Provider');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { MIN_PAYOUT_THRESHOLD, updateProviderEarnings } = require('../services/providerEarningsService');
const billingLogger = require('../utils/billingLogger');

// @GET /api/wallet
exports.getWalletInfo = async (req, res, next) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: req.user._id, balance: 0 });
    }

    res.json({ success: true, data: { wallet } });
  } catch (err) {
    next(err);
  }
};

// @GET /api/wallet/transactions
exports.getTransactions = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      return res.json({ success: true, data: { transactions: [], total: 0, page: 1, totalPages: 0 } });
    }

    const { page = 1, limit = 10 } = req.query;
    const filter = { wallet: wallet._id };
    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({
      success: true,
      data: {
        transactions,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

// @POST /api/wallet/payout
exports.requestPayout = async (req, res, next) => {
  try {
    const { amount } = req.body;

    if (req.user.role !== 'provider') {
      return res.status(403).json({
        success: false,
        message: 'Only providers can request payouts. Patient referral credits can only be used for service bookings.',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount required' });
    }

    if (amount < MIN_PAYOUT_THRESHOLD) {
      return res.status(400).json({
        success: false,
        message: `Minimum payout amount is ₹${MIN_PAYOUT_THRESHOLD}`,
      });
    }

    const providerProfile = await Provider.findOne({ user: req.user._id });
    if (!providerProfile || providerProfile.completedBookings === 0) {
      return res.status(400).json({
        success: false,
        message: 'You must complete at least one booking to request a payout.',
      });
    }
    // Atomically reserve funds by decrementing wallet if sufficient balance
    const wallet = await Wallet.findOneAndUpdate(
      { user: req.user._id, balance: { $gte: amount } },
      { $inc: { balance: -amount } },
      { new: true }
    );

    if (!wallet) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    // Create a PayoutRequest and a PENDING Transaction to record reserved funds
    const PayoutRequest = require('../models/PayoutRequest');
    const payoutRequest = await PayoutRequest.create({
      provider: providerProfile._id,
      wallet: wallet._id,
      amount,
      requestedBy: req.user._id,
    });

    try {
      billingLogger.logPayoutRequested({
        providerId: providerProfile._id && providerProfile._id.toString(),
        userId: req.user._id && req.user._id.toString(),
        amount,
        status: 'PENDING',
        requestId: req.requestId,
        ip: req.ip,
        endpoint: req.originalUrl,
        metadata: { payoutRequestId: payoutRequest._id && payoutRequest._id.toString() }
      });
    } catch (e) {}

    const transaction = await Transaction.create({
      wallet: wallet._id,
      type: 'DEBIT',
      amount,
      description: 'Payout Request (Reserved)',
      referenceType: 'PayoutRequest',
      referenceId: payoutRequest._id,
      status: 'PENDING',
    });

    // Link transaction to payout
    payoutRequest.transaction = transaction._id;
    await payoutRequest.save();

    await updateProviderEarnings(providerProfile._id);
    const providerUser = await User.findById(req.user._id);
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@rivocare.in';
    const supportEmail = process.env.SUPPORT_EMAIL || 'support@rivocare.in';
    const emailMessage = `
  A new payout request has been submitted.

  Details:
  - Provider Name: ${providerUser ? providerUser.name : 'Unknown User'}
  - Provider Email: ${providerUser ? providerUser.email : 'Unknown Email'}
  - Amount Requested: ₹${amount}
  - Available Balance Remaining: ₹${wallet.balance}
  - PayoutRequest ID: ${payoutRequest._id}
  - Transaction ID: ${transaction._id}

  Please process this payout manually to the provider's registered bank account.
    `;

    try {
      await sendEmail({
        email: `${adminEmail}, ${supportEmail}`,
        subject: `New Payout Request: ₹${amount} from ${providerUser ? providerUser.name : 'Provider'}`,
        message: emailMessage,
      });
    } catch (emailErr) {
      console.error('Failed to send payout email notification:', emailErr);
    }

    res.json({
      success: true,
      message: 'Payout requested and balance reserved successfully.',
      data: { wallet, payoutRequest, transaction },
    });
  } catch (err) {
    next(err);
  }
};
