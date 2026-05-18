const mongoose = require('mongoose');
const LabTest = require('../src/models/LabTest');
require('dotenv').config();

async function checkTest() {
  await mongoose.connect(process.env.MONGODB_URI);
  const test = await LabTest.findOne({ name: /Manual CBC/i });
  console.log('Test found:', test);
  process.exit(0);
}

checkTest();
