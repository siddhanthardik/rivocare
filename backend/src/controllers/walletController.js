const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

// @GET /api/wallet
// Get the logged-in user's wallet balance
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
// Get the logged-in user's transaction history
exports.getTransactions = async (req, res, next) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      return res.json({ success: true, data: { transactions: [] } });
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
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

const sendEmail = require('../utils/sendEmail');
const User = require('../models/User'); // Required to fetch provider details for the email

// @POST /api/wallet/payout
// Request a manual payout (Provider Action)
exports.requestPayout = async (req, res, next) => {
  try {
    const { amount } = req.body;

    // 🔒 ROLE CHECK: Only providers can withdraw
    if (req.user.role !== 'provider') {
      return res.status(403).json({ success: false, message: 'Only providers can request payouts. Patient referral credits can only be used for service bookings.' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid amount required' });
    }

    // 🔒 MINIMUM THRESHOLD: ₹1,000 to prevent frequent small requests
    const MIN_PAYOUT = 1000;
    if (amount < MIN_PAYOUT) {
      return res.status(400).json({ success: false, message: `Minimum payout amount is ₹${MIN_PAYOUT}` });
    }

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < amount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    // 🔒 SERVICE COMPLETION CHECK: Must have completed at least 1 booking to withdraw
    const Provider = require('../models/Provider');
    const providerProfile = await Provider.findOne({ user: req.user._id });
    if (!providerProfile || providerProfile.completedBookings === 0) {
      return res.status(400).json({ success: false, message: 'You must complete at least one booking to request a payout.' });
    }

    // Since this is a manual flow for now, we just deduct the balance and log a debit
    // In a real system, this would trigger a Payout logic via Razorpayx/Stripe Connect
    wallet.balance -= amount;
    await wallet.save();

    const transaction = await Transaction.create({
      wallet: wallet._id,
      type: 'DEBIT',
      amount,
      description: 'Payout Request Processed (Manual via Admin)',
    });

    // 📧 Send email notification to admin and support
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
      // We don't fail the request if the email fails
    }

    res.json({
      success: true,
      message: 'Payout requested and balance deducted successfully.',
      data: { wallet, transaction },
    });
  } catch (err) {
    next(err);
  }
};
