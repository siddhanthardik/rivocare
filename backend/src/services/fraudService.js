const FraudFlag = require('../models/FraudFlag');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');

/**
 * Analyzes a booking after completion to check for suspicious behavior.
 * @param {Object} booking - The populated or raw booking document
 */
exports.analyzeBookingCompletion = async (booking) => {
  try {
    // 1. Check for abnormally fast completion
    if (booking.startedAt && booking.completedAt) {
      const durationMinutes = (booking.completedAt - booking.startedAt) / 60000;
      if (durationMinutes < 10) { // Less than 10 minutes is highly suspicious for home healthcare
        await FraudFlag.create({
          entityType: 'PROVIDER',
          entityId: booking.provider,
          reason: `Extremely short service duration: ${Math.round(durationMinutes)} mins for booking ${booking._id}`,
          severity: 'HIGH'
        });
      }
    }

    // 2. Check for repeated bookings between same user and provider in a short time
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const repeatedBookings = await Booking.countDocuments({
      provider: booking.provider,
      patient: booking.patient,
      status: 'completed',
      createdAt: { $gte: thirtyDaysAgo }
    });

    if (repeatedBookings >= 4) { // 4+ times in 30 days might be gaming the system or normal for daily caretakers, so MEDIUM
      await FraudFlag.create({
        entityType: 'BOOKING',
        entityId: booking._id,
        reason: `Repeated booking between same user and provider (${repeatedBookings} times in 30 days)`,
        severity: 'MEDIUM'
      });
    }

    // Trigger provider metrics check
    await exports.analyzeProviderMetrics(booking.provider);

  } catch (error) {
    console.error('Fraud Service Error:', error);
  }
};

/**
 * Analyzes provider metrics (cancellations and ratings).
 * @param {String} providerId 
 */
exports.analyzeProviderMetrics = async (providerId) => {
  try {
    const provider = await Provider.findById(providerId);
    if (!provider) return;

    // High Cancellation Rate Check
    const minBookingsForCancelCheck = 5;
    const totalTransactions = provider.completedBookings + provider.cancellationCount;
    
    if (totalTransactions >= minBookingsForCancelCheck) {
      const cancellationRate = provider.cancellationCount / totalTransactions;
      if (cancellationRate > 0.3) { // > 30% cancellation rate
        await FraudFlag.create({
          entityType: 'PROVIDER',
          entityId: provider._id,
          reason: `High cancellation rate: ${(cancellationRate * 100).toFixed(1)}% (${provider.cancellationCount} cancels)`,
          severity: 'MEDIUM'
        });
      }
    }

    // Low Rating Check
    const minRatingsForCheck = 3;
    if (provider.totalRatings >= minRatingsForCheck && provider.rating < 3.0) {
      await FraudFlag.create({
        entityType: 'PROVIDER',
        entityId: provider._id,
        reason: `Sustained low rating: ${provider.rating.toFixed(1)} stars over ${provider.totalRatings} reviews`,
        severity: 'LOW'
      });
    }

  } catch (error) {
    console.error('Fraud Service Error:', error);
  }
};
