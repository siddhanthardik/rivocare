#!/usr/bin/env node
require('dotenv').config();
const path = require('path');
if (!process.env.MONGODB_URI) {
  try { require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') }); } catch (e) {}
}
const connectDB = require('../backend/src/config/db');
const mongoose = require('mongoose');
const fs = require('fs');

(async () => {
  const argv = process.argv.slice(2);
  const confirm = argv.includes('--confirm');

  console.log('Connecting to DB...');
  await connectDB();

  // Build broad test indicators
  const testNoteRegex = /test|staging|automated-test|integration-test|temp|qa|automation/i;
  const patientEmailRegex = /test|staging|qa|automation|example.com/i;
  const patientNameRegex = /test|staging|qa|automation/i;

  // We'll find bookings where:
  // - notes match test regex
  // - orderId contains TEST
  // - systemFlags contain any TEST marker
  // - patient email or name looks like test
  const Booking = require('../backend/src/models/Booking');
  const User = require('../backend/src/models/User');

  // Find patient IDs with test-like emails/names
  const testPatients = await User.find({
    $or: [
      { email: { $regex: patientEmailRegex } },
      { name: { $regex: patientNameRegex } }
    ]
  }).select('_id email name').lean();

  const patientIds = testPatients.map(p => p._id);

  const query = {
    $or: [
      { notes: { $regex: testNoteRegex } },
      { orderId: { $regex: /TEST/i } },
      { systemFlags: { $in: ['TEST_DATA', 'ABANDONED_TEST', 'TEST'] } },
      { patient: { $in: patientIds } }
    ]
  };

  const candidates = await Booking.find(query).populate('patient', 'email name').lean();

  console.log(`Found ${candidates.length} candidate test bookings.`);
  if (candidates.length === 0) process.exit(0);

  const outPath = path.join(__dirname, 'all-test-bookings.csv');
  const header = 'bookingId,status,createdAt,patientId,patientEmail,patientName,orderId,notes,systemFlags\n';
  const rows = candidates.map(d => {
    const created = d.createdAt ? new Date(d.createdAt).toISOString() : '';
    const pid = d.patient?._id || '';
    const pemail = d.patient?.email || '';
    const pname = d.patient?.name || '';
    const notes = (d.notes || '').replace(/\n/g, ' ').replace(/,/g, '');
    const flags = Array.isArray(d.systemFlags) ? d.systemFlags.join('|') : (d.systemFlags || '');
    return `${d._id},${d.status||''},${created},${pid},${pemail},${pname},${d.orderId||''},${notes},${flags}`;
  }).join('\n');
  fs.writeFileSync(outPath, header + rows, 'utf8');
  console.log('Wrote CSV to', outPath);

  candidates.slice(0,30).forEach(d => {
    console.log(`- ${d._id} | status=${d.status} | patient=${d.patient?.email||d.patient?.name||''} | orderId=${d.orderId||''}`);
  });

  if (!confirm) {
    console.log('\nDry run only. To delete these bookings and related notifications/transactions run:');
    console.log('  node scripts/findAllTestBookings.js --confirm');
    process.exit(0);
  }

  // Deletion path
  const Notification = require('../backend/src/models/Notification');
  const Transaction = require('../backend/src/models/Transaction');

  const ids = candidates.map(c => c._id);

  const notifRes = await Notification.deleteMany({ linkId: { $in: ids } });
  console.log(`Deleted ${notifRes.deletedCount} notifications linked to test bookings.`);

  const txRes = await Transaction.deleteMany({ referenceId: { $in: ids } });
  console.log(`Deleted ${txRes.deletedCount} transactions referencing test bookings.`);

  const delRes = await Booking.deleteMany({ _id: { $in: ids } });
  console.log(`Deleted ${delRes.deletedCount} bookings.`);

  console.log('Deletion complete.');
  process.exit(0);
})().catch(err => {
  console.error('Error:', err);
  process.exit(2);
});
