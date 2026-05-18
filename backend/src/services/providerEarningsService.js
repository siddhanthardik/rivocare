const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');

const MIN_PAYOUT_THRESHOLD = 1000;

const getAmount = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

function getNetBookingAmount(booking) {
  if (typeof booking.providerEarning === 'number') return booking.providerEarning;
  if (typeof booking.platformFee === 'number') return Math.max(0, getAmount(booking.totalAmount) - booking.platformFee);
  return Math.round(getAmount(booking.totalAmount) * 0.8);
}

function buildMonthlyTrend(bookings) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const previousDate = new Date(currentYear, currentMonth - 1, 1);
  const previousMonth = previousDate.getMonth();
  const previousYear = previousDate.getFullYear();

  const currentNet = bookings
    .filter((booking) => {
      const date = new Date(booking.completedAt || booking.updatedAt || booking.createdAt);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, booking) => sum + getNetBookingAmount(booking), 0);

  const previousNet = bookings
    .filter((booking) => {
      const date = new Date(booking.completedAt || booking.updatedAt || booking.createdAt);
      return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
    })
    .reduce((sum, booking) => sum + getNetBookingAmount(booking), 0);

  if (previousNet <= 0) {
    return currentNet > 0 ? 100 : 0;
  }

  return Math.round(((currentNet - previousNet) / previousNet) * 100);
}

async function getProviderEarningsSnapshot(providerId) {
  const provider = await Provider.findById(providerId);
  if (!provider) {
    return null;
  }

  const completedBookings = await Booking.find({
    provider: providerId,
    status: 'completed',
  }).sort({ completedAt: -1, updatedAt: -1 });

  const totalEarnings = completedBookings.reduce((sum, booking) => sum + getAmount(booking.totalAmount), 0);
  const platformCut = completedBookings.reduce((sum, booking) => {
    if (typeof booking.platformFee === 'number') return sum + booking.platformFee;
    return sum + Math.round(getAmount(booking.totalAmount) * 0.2);
  }, 0);
  const netEarnings = completedBookings.reduce((sum, booking) => sum + getNetBookingAmount(booking), 0);

  let wallet = await Wallet.findOne({ user: provider.user });
  if (!wallet) {
    wallet = await Wallet.create({ user: provider.user, balance: 0 });
  }

  const lastPayout = await Transaction.findOne({ wallet: wallet._id, type: 'DEBIT' }).sort({ createdAt: -1 });
  const payouts = await Transaction.find({ wallet: wallet._id, type: 'DEBIT' })
    .select('amount createdAt')
    .sort({ createdAt: -1 });

  return {
    provider,
    bookings: completedBookings,
    totalEarnings,
    platformCut,
    netEarnings,
    walletBalance: wallet.balance,
    totalBookings: completedBookings.length,
    trendPercentage: buildMonthlyTrend(completedBookings),
    lastPayoutAt: lastPayout?.createdAt || null,
    minimumPayoutThreshold: MIN_PAYOUT_THRESHOLD,
    lastUpdatedAt: new Date(),
    totalPayouts: payouts.reduce((sum, payout) => sum + getAmount(payout.amount), 0),
  };
}

async function updateProviderEarnings(providerId) {
  const snapshot = await getProviderEarningsSnapshot(providerId);
  if (!snapshot) return null;

  snapshot.provider.totalEarnings = snapshot.totalEarnings;
  snapshot.provider.walletBalance = snapshot.walletBalance;
  snapshot.provider.completedBookings = snapshot.totalBookings;
  await snapshot.provider.save();

  return snapshot;
}

module.exports = {
  MIN_PAYOUT_THRESHOLD,
  getProviderEarningsSnapshot,
  updateProviderEarnings,
};
