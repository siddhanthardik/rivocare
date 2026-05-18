#!/usr/bin/env node
require('dotenv').config();
const path = require('path');
// If MONGODB_URI isn't in root .env, try backend/.env for local dev setups
if (!process.env.MONGODB_URI) {
  const backendEnv = path.join(__dirname, '..', 'backend', '.env');
  try {
    require('dotenv').config({ path: backendEnv });
  } catch (e) {
    // ignore; we'll surface the missing URI later
  }
}
const connectDB = require('../backend/src/config/db');
const mongoose = require('mongoose');
const Booking = require('../backend/src/models/Booking');
const Notification = require('../backend/src/models/Notification');
const Transaction = require('../backend/src/models/Transaction');
const User = require('../backend/src/models/User');

(async () => {
  const argv = process.argv.slice(2);
  const confirm = argv.includes('--confirm');

  console.log('Connecting to DB...');
  await connectDB();

  const now = new Date();
  const staleThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days

  // Safe selectors for test/stale bookings
  const testNoteRegex = /test|staging|automated-test|integration-test|temp/i;

  // Find candidate bookings:
  // - status pending or in-progress AND (older than threshold OR notes look like test OR patient email contains test OR orderId contains TEST)
  const candidates = await Booking.find({
    status: { $in: ['pending', 'in-progress'] },
    $or: [
      { createdAt: { $lt: staleThreshold } },
      { notes: { $regex: testNoteRegex } },
      { orderId: { $regex: /TEST/i } },
    ],
  }).populate('patient', 'email name');

  // Also include bookings flagged explicitly as test in systemFlags
  const flagged = await Booking.find({ systemFlags: { $in: ['TEST_DATA', 'ABANDONED_TEST'] } }).populate('patient', 'email name');

  // Merge distinct ids
  const map = {};
  const addToMap = (b) => { map[b._id.toString()] = b; };
  candidates.forEach(addToMap);
  flagged.forEach(addToMap);

  const all = Object.values(map);

  if (all.length === 0) {
    console.log('No test/stale bookings found for cleanup. Exiting.');
    process.exit(0);
  }

  console.log('\nFound candidate bookings for deletion:', all.length);
  all.slice(0, 20).forEach(b => {
    console.log(`- ${b._id.toString()} | status=${b.status} | createdAt=${b.createdAt.toISOString()} | patient=${b.patient?.email || b.patient?.name || 'N/A'} | orderId=${b.orderId}`);
  });
  if (all.length > 20) console.log(`...and ${all.length - 20} more`);

  if (!confirm) {
    console.log('\nDry run only. To delete these bookings run:');
    console.log('  node scripts/resetTestBookings.js --confirm');
    process.exit(0);
  }

  // Perform deletions
  // Use raw ids (strings or ObjectId) to avoid runtime differences in Node versions
  const ids = all.map(b => b._id);

  // Delete Notifications
  const notifRes = await Notification.deleteMany({ linkId: { $in: ids } });
  console.log(`Deleted ${notifRes.deletedCount} notifications linked to test bookings.`);

  // Delete Transactions referencing these bookings
  const txRes = await Transaction.deleteMany({ referenceId: { $in: ids } });
  console.log(`Deleted ${txRes.deletedCount} transactions referencing test bookings.`);

  // Finally delete bookings
  const delRes = await Booking.deleteMany({ _id: { $in: ids } });
  console.log(`Deleted ${delRes.deletedCount} bookings.`);

  console.log('Cleanup complete.');
  process.exit(0);
})().catch(err => {
  console.error('Error during cleanup:', err);
  process.exit(2);
});
