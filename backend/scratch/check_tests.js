const mongoose = require('mongoose');
const Partner = require('../src/models/Partner');
const LabTest = require('../src/models/LabTest');
require('dotenv').config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const srl = await Partner.findOne({ name: /SRL/i });
  if (!srl) {
    console.log('SRL partner not found');
    process.exit(1);
  }
  console.log(`Found SRL partner: ${srl._id}`);
  
  const tests = await LabTest.find({ partner: srl._id });
  console.log(`Found ${tests.length} tests for SRL`);
  tests.forEach(t => console.log(`- ${t.name} (${t.department})`));
  
  process.exit(0);
}

check();
