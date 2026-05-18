#!/usr/bin/env node
require('dotenv').config();
const path = require('path');
// try backend/.env if root doesn't provide DB URI
if (!process.env.MONGODB_URI) {
  try { require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') }); } catch (e) {}
}
const connectDB = require('../backend/src/config/db');
const mongoose = require('mongoose');
const fs = require('fs');

(async () => {
  console.log('Connecting to DB...');
  await connectDB();

  // Obtain native DB handle; fallback to MongoClient if mongoose.connection.db is not ready
  let db;
  if (mongoose.connection && mongoose.connection.db) {
    db = mongoose.connection.db;
  } else {
    const { MongoClient } = require('mongodb');
    const client = new MongoClient(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    db = client.db();
  }
  const coll = db.collection('bookings');

  // Find docs where the BSON type of `service` is not objectId
  const query = { $expr: { $ne: [ { $type: '$service' }, 'objectId' ] } };

  const docs = await coll.find(query).toArray();

  console.log(`Found ${docs.length} bookings with non-ObjectId 'service' field.`);

  if (docs.length === 0) {
    process.exit(0);
  }

  const outPath = path.join(__dirname, 'audit-bookings-service-types.csv');
  const header = 'bookingId,serviceValue,serviceType,status,createdAt,patientId,orderId\n';
  const rows = docs.map(d => {
    let svc = d.service;
    let svcStr;
    let svcType;
    try {
      if (svc === undefined || svc === null) {
        svcStr = '';
        svcType = String(svc);
      } else if (typeof svc === 'object' && svc._bsontype) {
        svcStr = svc.toString();
        svcType = svc._bsontype;
      } else {
        svcStr = String(svc).replace(/,/g, '');
        svcType = typeof svc;
      }
    } catch (e) {
      svcStr = String(svc).replace(/,/g, '');
      svcType = typeof svc;
    }
    const created = d.createdAt ? new Date(d.createdAt).toISOString() : '';
    return `${d._id},${svcStr},${svcType},${d.status || ''},${created},${d.patient || ''},${d.orderId || ''}`;
  }).join('\n');

  fs.writeFileSync(outPath, header + rows, 'utf8');
  console.log('Wrote CSV to', outPath);

  // Print sample (up to 20)
  docs.slice(0,20).forEach(d => {
    console.log(`- ${d._id} | service=${JSON.stringify(d.service)} | status=${d.status} | patient=${d.patient || ''}`);
  });

  process.exit(0);
})().catch(err => {
  console.error('Audit failed:', err);
  process.exit(2);
});
