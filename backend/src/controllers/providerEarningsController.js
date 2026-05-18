const Provider = require('../models/Provider');
const { getProviderEarningsSnapshot } = require('../services/providerEarningsService');

exports.getEarningsSummary = async (req, res, next) => {
  try {
    const providerProfile = await Provider.findOne({ user: req.user._id });
    if (!providerProfile?._id) {
      return res.status(404).json({ success: false, message: 'Provider profile not found' });
    }

    const snapshot = await getProviderEarningsSnapshot(providerProfile._id);
    if (!snapshot) {
      return res.status(404).json({ success: false, message: 'Provider profile not found' });
    }

    res.json({
      success: true,
      data: {
        totalEarnings: snapshot.totalEarnings,
        netEarnings: snapshot.netEarnings,
        platformCut: snapshot.platformCut,
        walletBalance: snapshot.walletBalance,
        totalBookings: snapshot.totalBookings,
        trendPercentage: snapshot.trendPercentage,
        lastPayoutAt: snapshot.lastPayoutAt,
        minimumPayoutThreshold: snapshot.minimumPayoutThreshold,
        lastUpdatedAt: snapshot.lastUpdatedAt,
        bookings: snapshot.bookings.map((booking) => ({
          bookingId: booking._id,
          date: booking.completedAt || booking.updatedAt || booking.createdAt,
          // Ensure frontend receives providerEarning (fall back to computed 80% of finalAmount/totalAmount)
          amount: typeof booking.providerEarning === 'number'
            ? booking.providerEarning
            : Math.round(((booking.finalAmount || booking.finalPrice || booking.totalAmount) || 0) * 0.8),
          status: booking.status,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};
