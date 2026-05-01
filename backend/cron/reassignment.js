const cron = require('node-cron');
const mongoose = require('mongoose');
const Booking = require('../src/models/Booking');
const Provider = require('../src/models/Provider');
const User = require('../src/models/User');
const sendEmail = require('../src/utils/sendEmail');

// Rule Engine for Availability Check (Mirrors frontend/services/availability.js)
const checkProviderAvailability = async (providerId, scheduledAtStr) => {
  const provider = await Provider.findById(providerId);
  if (!provider) return false;

  const defaultConfig = {
    isAvailable: true,
    workingDays: [1, 2, 3, 4, 5, 6],
    startTime: '09:00',
    endTime: '19:00',
    shiftType: 'custom',
    blockedSlots: [],
  };

  let config = defaultConfig;
  try {
    const parsed = JSON.parse(provider.notes);
    if (parsed.availability) config = { ...defaultConfig, ...parsed.availability };
  } catch(e) {}

  if (!config.isAvailable) return false;

  const requestDate = new Date(scheduledAtStr);
  if (!config.workingDays.includes(requestDate.getDay())) return false;

  const dateStr = requestDate.toISOString().split('T')[0];
  const timeStr = requestDate.toISOString().split('T')[1].substring(0, 5);

  if (config.blockedSlots.includes(`${dateStr}T${timeStr}`)) return false;

  if (config.shiftType !== '24h') {
    const [reqHour, reqMin] = timeStr.split(':').map(Number);
    const [startHour, startMin] = config.startTime.split(':').map(Number);
    const [endHour, endMin] = config.endTime.split(':').map(Number);

    const reqVal = reqHour * 60 + reqMin;
    const startVal = startHour * 60 + startMin;
    const endVal = endHour * 60 + endMin;
    if (reqVal < startVal || reqVal >= endVal) return false;
  }

  // Active bookings overlap check
  const activeBookings = await Booking.find({
    provider: providerId,
    status: { $in: ['confirmed', 'in-progress', 'pending'] },
    scheduledAt: { 
      $gte: new Date(requestDate.getTime() - 24 * 60 * 60 * 1000), 
      $lte: new Date(requestDate.getTime() + 24 * 60 * 60 * 1000) 
    }
  });

  const reqStart = requestDate.getTime();
  const durationHours = 1; // Default
  const reqEnd = reqStart + durationHours * 60 * 60 * 1000;

  for (let b of activeBookings) {
    const bStart = b.scheduledAt.getTime();
    const bEnd = bStart + (b.durationHours || 1) * 60 * 60 * 1000;
    if (reqStart < bEnd && reqEnd > bStart) return false;
  }

  return true;
};

const escalateToBackup = async (booking, notesParts, assignmentData, reason) => {
  const now = new Date();
  const { backupProviderIds } = assignmentData.assignment;

  console.log(`[CRON] Booking ${booking._id}: Escalating (${reason}) — trying backups...`);
  let reassignedProviderId = null;

  for (let backupId of backupProviderIds) {
    const isAvailable = await checkProviderAvailability(backupId, booking.scheduledAt);
    if (isAvailable) {
      reassignedProviderId = backupId;
      break;
    }
  }

  if (reassignedProviderId) {
    const newProvider = await Provider.findById(reassignedProviderId).populate('user');
    const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();

    booking.provider = reassignedProviderId;
    assignmentData.assignment.primaryProviderId = reassignedProviderId;
    assignmentData.assignment.status = 'reassigned';
    assignmentData.assignment.confirmation = {
      status: 'pending',
      expiresAt,
    };

    notesParts[notesParts.length - 1] = JSON.stringify(assignmentData);
    booking.notes = notesParts.join('\n\n');
    await booking.save();

    console.log(`[CRON] Booking ${booking._id}: Reassigned to ${newProvider?.user?.name}`);

    // Notify new provider
    if (newProvider?.user?.email) {
      await sendEmail({
        email: newProvider.user.email,
        subject: '⚡ Priority Assignment — Action Required within 30 Minutes',
        message: `Hello ${newProvider.user.name},\n\nYou have been assigned a new priority booking for ${booking.scheduledAt}.\nPlease log in to your RIVO dashboard and accept or reject within 30 minutes.\n\nRIVO Operations`,
      });
    }
    // Notify patient
    if (booking.patient?.email) {
      await sendEmail({
        email: booking.patient.email,
        subject: 'Your care expert has been updated',
        message: `Hello ${booking.patient?.name},\n\nWe have updated your assigned provider to ensure timely service for your booking on ${booking.scheduledAt}.\n\nThank you for choosing RIVO.`,
      });
    }
  } else {
    console.log(`[CRON] Booking ${booking._id}: All backups unavailable — needs manual.`);
    assignmentData.assignment.status = 'needs_manual_assignment';
    notesParts[notesParts.length - 1] = JSON.stringify(assignmentData);
    booking.notes = notesParts.join('\n\n');
    await booking.save();

    await sendEmail({
      email: process.env.ADMIN_EMAIL || 'admin@rivocare.in',
      subject: '🚨 URGENT: Manual Assignment Required',
      message: `Booking ${booking._id} for patient ${booking.patient?.name} requires manual assignment. Scheduled at: ${booking.scheduledAt}`,
    });
  }
};

const processReassignments = async () => {
  console.log('[CRON] Running Reassignment Automation Engine...');
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const bookings = await Booking.find({
    status: 'pending',
    scheduledAt: { $gte: now, $lte: next24Hours },
  }).populate('patient provider');

  for (let booking of bookings) {
    try {
      if (!booking.notes) continue;

      const notesParts = booking.notes.split('\n\n');
      const lastPart = notesParts[notesParts.length - 1];

      let assignmentData;
      try {
        assignmentData = JSON.parse(lastPart);
      } catch (e) {
        continue;
      }

      const { assignment } = assignmentData;
      if (!assignment) continue;

      const hoursUntilService = (booking.scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60);

      // ─── Lock Rule: < 6 hours → freeze all automation ───────────
      if (hoursUntilService < 6 && !['confirmed', 'needs_manual_assignment'].includes(assignment.status)) {
        console.log(`[CRON] Booking ${booking._id} locked (< 6 hrs). Flagging for manual.`);
        assignment.status = 'needs_manual_assignment';
        notesParts[notesParts.length - 1] = JSON.stringify(assignmentData);
        booking.notes = notesParts.join('\n\n');
        await booking.save();
        await sendEmail({
          email: process.env.ADMIN_EMAIL || 'admin@rivocare.in',
          subject: '🚨 URGENT: Manual Assignment Required',
          message: `Booking ${booking._id} for ${booking.patient?.name} requires manual attention. Scheduled at: ${booking.scheduledAt}`,
        });
        continue;
      }

      // ─── Confirmation Escalation Rules ───────────────────────────
      const confirmation = assignment.confirmation;

      if (confirmation) {
        const isPendingExpired =
          confirmation.status === 'pending' && new Date(confirmation.expiresAt).getTime() < now.getTime();
        const isRejected = confirmation.status === 'rejected';

        if (isPendingExpired) {
          console.log(`[CRON] Booking ${booking._id}: Confirmation expired — escalating.`);
          await escalateToBackup(booking, notesParts, assignmentData, 'confirmation_expired');
          continue;
        }

        if (isRejected) {
          console.log(`[CRON] Booking ${booking._id}: Provider rejected — escalating.`);
          await escalateToBackup(booking, notesParts, assignmentData, 'provider_rejected');
          continue;
        }

        // Still within window & not yet responded — skip
        if (confirmation.status === 'pending') {
          console.log(`[CRON] Booking ${booking._id}: Awaiting provider confirmation.`);
          continue;
        }

        // Accepted → mark booking confirmed
        if (confirmation.status === 'accepted' && assignment.status !== 'confirmed') {
          assignment.status = 'confirmed';
          notesParts[notesParts.length - 1] = JSON.stringify(assignmentData);
          booking.notes = notesParts.join('\n\n');
          await booking.save();
          console.log(`[CRON] Booking ${booking._id}: Confirmed by provider.`);
          continue;
        }
      }

      // ─── Standard Availability Validation ────────────────────────
      if (assignment.status !== 'provisional') continue;

      const primaryAvailable = await checkProviderAvailability(assignment.primaryProviderId, booking.scheduledAt);
      if (primaryAvailable) {
        console.log(`[CRON] Booking ${booking._id}: Primary confirmed.`);
        assignment.status = 'confirmed';
        notesParts[notesParts.length - 1] = JSON.stringify(assignmentData);
        booking.notes = notesParts.join('\n\n');
        await booking.save();
      } else {
        await escalateToBackup(booking, notesParts, assignmentData, 'primary_unavailable');
      }

    } catch (err) {
      console.error(`[CRON Error Processing Booking ${booking._id}]:`, err);
    }
  }
};


// Run every 15 minutes
const startCron = () => {
  console.log('[CRON] Initializing Reassignment Engine (Runs every 15m)');
  cron.schedule('*/15 * * * *', processReassignments);
};

module.exports = { startCron, processReassignments };
