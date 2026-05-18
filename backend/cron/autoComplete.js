/**
 * Auto-Completion Cron Job
 * Runs every 15 minutes.
 * - AUTO: in-progress + ended >2hrs ago → completed (completionType: "auto")
 * - SYSTEM: in-progress + age >24hrs → completed (completionType: "system")
 * Safe: Skips bookings where payout is already processed (paymentStatus: PAID)
 */

const cron = require('node-cron');
const Booking = require('../src/models/Booking');

const autoComplete = async () => {
  const now = new Date();
  const twoHoursAgo = new Date(now - 2 * 60 * 60 * 1000);
  const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);

  try {
    // ── STEP 5: Auto-complete bookings ended >2 hours ago ──────────────
    // Safe find: fallback to raw collection if Mongoose casting fails (e.g., corrupt `service` values)
    let autoBookings = [];
    const autoQuery = {
      status: 'in-progress',
      paymentStatus: { $ne: 'PAID' },
      $expr: { $lt: [ { $add: ['$scheduledAt', { $multiply: ['$durationHours', 3600000] }] }, twoHoursAgo ] }
    };
    try {
      autoBookings = await Booking.find(autoQuery);
    } catch (err) {
      console.warn('[CRON:AUTO_COMPLETE] Mongoose find failed, falling back to raw collection read:', err.message || err);
      const mongoose = require('mongoose');
      autoBookings = await mongoose.connection.db.collection('bookings').find(autoQuery).toArray();
    }

    for (const b of autoBookings) {
      b.status = 'completed';
      b.completionType = 'auto';
      b.completedAt = now;
      b.completionMeta = { markedLate: true };
      await b.save();
      console.log('[CRON:AUTO_COMPLETE]', { bookingId: b._id, completionType: 'auto', completedAt: now });
    }

    // ── STEP 6: System failsafe — in-progress >24 hours ───────────────
    let systemBookings = [];
    const systemQuery = { status: 'in-progress', paymentStatus: { $ne: 'PAID' }, scheduledAt: { $lt: twentyFourHoursAgo } };
    try {
      systemBookings = await Booking.find(systemQuery);
    } catch (err) {
      console.warn('[CRON:SYSTEM_COMPLETE] Mongoose find failed, falling back to raw collection read:', err.message || err);
      const mongoose = require('mongoose');
      systemBookings = await mongoose.connection.db.collection('bookings').find(systemQuery).toArray();
    }

    for (const b of systemBookings) {
      try {
        const id = b._id ? b._id : b._id; // raw doc or model
        // Use atomic update to avoid model casting issues
        await Booking.findByIdAndUpdate(id, { $set: { status: 'completed', completionType: 'system', completedAt: now, completionMeta: { markedLate: true } } }, { new: true });
        console.log('[CRON:SYSTEM_COMPLETE]', { bookingId: id, completionType: 'system', completedAt: now });
      } catch (err) {
        console.warn('[CRON:SYSTEM_COMPLETE] Skipping booking due to update error:', err.message || err);
        continue;
      }
    }

    const total = autoBookings.length + systemBookings.length;
    if (total > 0) console.log(`[CRON] Auto-completed ${total} stale bookings.`);

  } catch (err) {
    console.error('[CRON:AUTO_COMPLETE] Error:', err.message);
  }
};

const startAutoCompletionCron = () => {
  // Every 15 minutes
  cron.schedule('*/15 * * * *', autoComplete);
  console.log('[CRON] Auto-completion cron registered (every 15 min)');
};

module.exports = { startAutoCompletionCron };
