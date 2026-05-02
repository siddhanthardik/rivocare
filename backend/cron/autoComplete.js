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
    const autoBookings = await Booking.find({
      status: 'in-progress',
      paymentStatus: { $ne: 'PAID' }, // Don't re-trigger if payout done
      $expr: {
        $lt: [
          { $add: ['$scheduledAt', { $multiply: ['$durationHours', 3600000] }] },
          twoHoursAgo
        ]
      }
    });

    for (const b of autoBookings) {
      b.status = 'completed';
      b.completionType = 'auto';
      b.completedAt = now;
      b.completionMeta = { markedLate: true };
      await b.save();
      console.log('[CRON:AUTO_COMPLETE]', { bookingId: b._id, completionType: 'auto', completedAt: now });
    }

    // ── STEP 6: System failsafe — in-progress >24 hours ───────────────
    const systemBookings = await Booking.find({
      status: 'in-progress',
      paymentStatus: { $ne: 'PAID' },
      scheduledAt: { $lt: twentyFourHoursAgo },
    });

    for (const b of systemBookings) {
      if (b.status === 'completed') continue; // already handled above
      b.status = 'completed';
      b.completionType = 'system';
      b.completedAt = now;
      b.completionMeta = { markedLate: true };
      await b.save();
      console.log('[CRON:SYSTEM_COMPLETE]', { bookingId: b._id, completionType: 'system', completedAt: now });
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
