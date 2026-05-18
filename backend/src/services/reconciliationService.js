const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const { BOOKING_STATUS, PAYMENT_STATUS, normalizeBookingStatus, normalizePaymentStatus } = require('../constants/bookingStatus');

/**
 * Carely Payment Reconciliation Engine
 * Detects discrepancies between Bookings, Payments, and Wallets.
 */
exports.runReconciliationCheck = async () => {
  const issues = [];
  
  // 1. Paid Bookings without Successful Payments
  const paidBookings = await Booking.find({ paymentStatus: PAYMENT_STATUS.PAID });
  for (const b of paidBookings) {
    const payment = await Payment.findOne({ booking: b._id, status: PAYMENT_STATUS.PAID });
    if (!payment && b.paymentMethod !== 'cod') {
      issues.push({
        type: 'MISSING_PAYMENT_RECORD',
        severity: 'HIGH',
        bookingId: b._id,
        message: 'Booking marked PAID but no successful online payment record found.'
      });
    }
  }

  // 2. Successful Payments without Paid Bookings
  const successPayments = await Payment.find({ status: PAYMENT_STATUS.PAID });
  for (const p of successPayments) {
    if (p.booking) {
      const b = await Booking.findById(p.booking);
      if (b && normalizePaymentStatus(b.paymentStatus) !== PAYMENT_STATUS.PAID) {
        issues.push({
          type: 'PAYMENT_BOOKING_DESYNC',
          severity: 'HIGH',
          bookingId: b._id,
          paymentId: p._id,
          message: 'Payment record is PAID but Booking is still PENDING.'
        });
      }
    }
  }

  // 3. Completed Bookings without Wallet Credits (for Providers)
  // Only for bookings where payment is collected or paid
  const completedBookings = await Booking.find({ 
    status: BOOKING_STATUS.COMPLETED,
    paymentStatus: { $in: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.COLLECTED] }
  });
  
  for (const b of completedBookings) {
    const tx = await Transaction.findOne({ referenceId: b._id, type: 'CREDIT' });
    if (!tx) {
      issues.push({
        type: 'MISSING_PROVIDER_CREDIT',
        severity: 'MEDIUM',
        bookingId: b._id,
        providerId: b.provider,
        message: 'Booking COMPLETED and PAID but no wallet credit found for provider.'
      });
    }
  }

  // 4. Orphan Payments (no booking, no intent)
  const orphanPayments = await Payment.find({ booking: null, bookingIntent: null });
  if (orphanPayments.length > 0) {
    issues.push({
      type: 'ORPHAN_PAYMENTS',
      severity: 'LOW',
      count: orphanPayments.length,
      message: 'Found payment records not linked to any booking or intent.'
    });
  }

  return {
    timestamp: new Date(),
    summary: {
      totalIssues: issues.length,
      highSeverity: issues.filter(i => i.severity === 'HIGH').length
    },
    issues
  };
};
