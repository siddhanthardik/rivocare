const mongoose = require('mongoose');
const LabTest = require('../src/models/LabTest');
require('dotenv').config();

async function checkAll() {
  await mongoose.connect(process.env.MONGODB_URI);
  const tests = await LabTest.find();
  console.log(`Found ${tests.length} total tests in database`);
  tests.forEach(t => console.log(`- ${t.name} (Partner: ${t.partner})`));
  process.exit(0);
}

checkAll();
