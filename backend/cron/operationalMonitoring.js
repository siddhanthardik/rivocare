const cron = require('node-cron');
const mongoose = require('mongoose');
const Booking = require('../src/models/Booking');
const User = require('../src/models/User');
const Notification = require('../src/models/Notification');
const reconciliationService = require('../src/services/reconciliationService');
const { BOOKING_STATUS, PAYMENT_STATUS } = require('../src/constants/bookingStatus');
const emailService = require('../src/services/emailService');

/**
 * PHASE 3: OPERATIONAL AUTOMATION & RECOVERY
 * Detects anomalies, sends reminders, and escalates to admins.
 * Uses booking.systemFlags to ensure idempotency.
 */

async function notifyAdmins(title, message, linkId = null) {
  const admins = await User.find({ role: 'admin' }).select('_id');
  const notifications = admins.map(admin => ({
    user: admin._id,
    title,
    message,
    type: 'SYSTEM',
    linkId
  }));
  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }
}

async function notifyUser(userId, title, message, linkId = null) {
  if (!userId) return;
  await Notification.create({
    user: userId,
    title,
    message,
    type: 'SYSTEM',
    linkId
  });
}

// Ensure flag isn't present, then add it. Returns true if added (safe to process).
async function addSystemFlag(bookingId, flag) {
  const result = await Booking.updateOne(
    { _id: bookingId, systemFlags: { $ne: flag } },
    { $addToSet: { systemFlags: flag } }
  );
  return result.modifiedCount > 0;
}

// ──────────────────────────────────────────────────────────────────────────────
// JOBS
// ──────────────────────────────────────────────────────────────────────────────

async function detectStuckBookings() {
  const now = new Date();
  
  try {
    // 1. REQUESTED > 30 mins
    const requestedCutoff = new Date(now.getTime() - 30 * 60 * 1000);
    const stuckRequested = await Booking.find({
      status: { $in: ['REQUESTED', 'pending'] },
      createdAt: { $lt: requestedCutoff },
      systemFlags: { $ne: 'CRON_ESCALATED_REQUESTED_30M' }
    });
    for (const b of stuckRequested) {
      if (await addSystemFlag(b._id, 'CRON_ESCALATED_REQUESTED_30M')) {
        await notifyAdmins('Booking Stuck in Requested', `Booking #${b._id.toString().slice(-6)} has been requested for over 30 mins without provider acceptance.`, b._id);
      }
    }

    // 2. CONFIRMED > 24h unpaid (accepted but not started)
    const confirmedCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const stuckConfirmed = await Booking.find({
      status: { $in: ['CONFIRMED', 'confirmed'] },
      paymentStatus: { $nin: ['PAID', 'COLLECTED'] },
      updatedAt: { $lt: confirmedCutoff },
      systemFlags: { $ne: 'CRON_ESCALATED_CONFIRMED_24H' }
    }).populate('provider');
    for (const b of stuckConfirmed) {
      if (await addSystemFlag(b._id, 'CRON_ESCALATED_CONFIRMED_24H')) {
        await notifyAdmins('Booking Confirmed but Unpaid/Unstarted', `Booking #${b._id.toString().slice(-6)} is confirmed but inactive for 24h.`, b._id);
        if (b.provider?.user) {
          await notifyUser(b.provider.user, 'Booking Reminder', `You have a confirmed booking #${b._id.toString().slice(-6)} that hasn't started yet.`, b._id);
        }
      }
    }

    // 3. IN_PROGRESS > 12h
    const inProgressCutoff = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const stuckInProgress = await Booking.find({
      status: { $in: ['IN_PROGRESS', 'in-progress'] },
      startedAt: { $lt: inProgressCutoff },
      systemFlags: { $ne: 'CRON_ESCALATED_INPROGRESS_12H' }
    }).populate('provider');
    for (const b of stuckInProgress) {
      if (await addSystemFlag(b._id, 'CRON_ESCALATED_INPROGRESS_12H')) {
        await notifyAdmins('Long Running Booking', `Booking #${b._id.toString().slice(-6)} has been IN_PROGRESS for over 12 hours.`, b._id);
        if (b.provider?.user) {
          await notifyUser(b.provider.user, 'Booking Still In Progress', `Please mark booking #${b._id.toString().slice(-6)} as completed if you are done.`, b._id);
        }
      }
    }

    // 4. COLLECTED > 24h awaiting patient confirmation
    const collectedCutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const stuckCollected = await Booking.find({
      status: 'COLLECTED',
      paymentStatus: 'PENDING_CONFIRMATION',
      collectedAt: { $lt: collectedCutoff },
      systemFlags: { $ne: 'CRON_ESCALATED_COLLECTED_24H' }
    }).populate('patient provider');
    for (const b of stuckCollected) {
      if (await addSystemFlag(b._id, 'CRON_ESCALATED_COLLECTED_24H')) {
        await notifyAdmins('COD Pending Confirmation > 24h', `Booking #${b._id.toString().slice(-6)} collected cash but patient hasn't confirmed in 24h.`, b._id);
        if (b.patient) {
          const patientId = b.patient._id || b.patient;
          await notifyUser(patientId, 'Action Required: Confirm Cash Payment', `Please confirm the cash payment for booking #${b._id.toString().slice(-6)} so your provider can be credited.`, b._id);
          
          // 📧 Send COD Reminder Email
          try {
            if (b.patient.email) {
              emailService.sendCodReminder(b.patient.email, b.patient.name, b._id);
            }
          } catch(e) { console.error('Failed to send COD Reminder email', e); }
        }
        if (b.provider?.user) {
          await notifyUser(b.provider.user, 'Pending COD Confirmation', `We have reminded the patient to confirm your cash collection for booking #${b._id.toString().slice(-6)}.`, b._id);
        }
      }
    }

    // 5. DISPUTED > 48h unresolved
    const disputedCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const stuckDisputed = await Booking.find({
      paymentStatus: 'DISPUTED',
      'disputeResolution.disputeResolved': { $ne: true },
      updatedAt: { $lt: disputedCutoff },
      systemFlags: { $ne: 'CRON_ESCALATED_DISPUTED_48H' }
    });
    for (const b of stuckDisputed) {
      if (await addSystemFlag(b._id, 'CRON_ESCALATED_DISPUTED_48H')) {
        await notifyAdmins('URGENT: Unresolved Dispute > 48h', `Dispute for booking #${b._id.toString().slice(-6)} has been open for over 48 hours. Please resolve immediately.`, b._id);
      }
    }

    // 6. COMPLETED > 48h Unpaid
    const completedUnpaidCutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const stuckCompletedUnpaid = await Booking.find({
      status: { $in: ['COMPLETED', 'completed'] },
      paymentStatus: { $nin: ['PAID', 'COLLECTED', 'DISPUTED'] },
      completedAt: { $lt: completedUnpaidCutoff },
      systemFlags: { $ne: 'CRON_ESCALATED_UNPAID_COMPLETED_48H' }
    }).populate('patient provider');
    for (const b of stuckCompletedUnpaid) {
      if (await addSystemFlag(b._id, 'CRON_ESCALATED_UNPAID_COMPLETED_48H')) {
        await notifyAdmins('Unpaid Completed Booking > 48h', `Booking #${b._id.toString().slice(-6)} is completed but payment is still pending after 48h.`, b._id);
        if (b.patient) {
          await notifyUser(b.patient._id || b.patient, 'Payment Reminder', `Your booking #${b._id.toString().slice(-6)} is complete but payment is pending. Please complete your payment.`, b._id);
        }
      }
    }

  } catch (err) {
    console.error('[CRON ERROR] detectStuckBookings:', err);
  }
}

async function runPaymentReconciliation() {
  try {
    const summary = await reconciliationService.getSummary();
    const anomaliesCount = (summary.failedPayments || 0) + (summary.pendingPayouts || 0) + (summary.webhookFailures || 0);
    
    // Only alert admins if there are significant anomalies detected in the periodic check
    if (anomaliesCount > 0) {
      // Check if we already alerted today to prevent spam
      const todayString = new Date().toISOString().split('T')[0];
      const flagStr = `CRON_RECON_ALERT_${todayString}`;
      
      // We store this on an arbitrary dummy booking or a singleton, but since we don't have a singleton, 
      // we'll just check if an admin notification was sent today with this title.
      const alertExists = await Notification.findOne({
        title: 'Daily Reconciliation Anomalies',
        createdAt: { $gte: new Date(todayString) }
      });
      
      if (!alertExists) {
        await notifyAdmins(
          'Daily Reconciliation Anomalies',
          `Automated check found ${anomaliesCount} payment anomalies requiring attention. Please check the Reconciliation dashboard.`
        );
      }
    }
  } catch (err) {
    console.error('[CRON ERROR] runPaymentReconciliation:', err);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// INITIALIZATION
// ──────────────────────────────────────────────────────────────────────────────

function startOperationalMonitoring() {
  console.log('[CRON] Starting Operational Monitoring & Recovery Jobs');

  // Run stuck booking detector every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log('[CRON] Running detectStuckBookings...');
    await detectStuckBookings();
  });

  // Run payment reconciliation logic daily at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[CRON] Running runPaymentReconciliation...');
    await runPaymentReconciliation();
  });
}

module.exports = {
  startOperationalMonitoring,
  detectStuckBookings,
  runPaymentReconciliation
};
