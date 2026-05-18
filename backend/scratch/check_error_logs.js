const mongoose = require('mongoose');
const ErrorLog = require('../src/models/ErrorLog');
require('dotenv').config();

async function checkLogs() {
  await mongoose.connect(process.env.MONGODB_URI);
  const logs = await ErrorLog.find().sort({ timestamp: -1 }).limit(5);
  console.log(`Found ${logs.length} recent error logs:`);
  logs.forEach(l => {
    console.log(`--- ${l.timestamp} ---`);
    console.log(`Message: ${l.message}`);
    console.log(`Route: ${l.route}`);
    console.log(`Stack: ${l.stack?.slice(0, 200)}...`);
  });
  process.exit(0);
}

checkLogs();
