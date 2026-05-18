const mongoose = require('mongoose');
const LabTest = require('../src/models/LabTest');
require('dotenv').config();

async function fixTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  await LabTest.findOneAndUpdate({ name: /Manual CBC/i }, { isActive: true });
  console.log('Fixed Manual CBC: set isActive to true');
  process.exit(0);
}

fixTest();
