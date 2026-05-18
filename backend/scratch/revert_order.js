const mongoose = require('mongoose');
const LabOrder = require('../src/models/LabOrder');
require('dotenv').config();

async function revert() {
  await mongoose.connect(process.env.MONGODB_URI);
  await LabOrder.findByIdAndUpdate('69f8e8fd4f7ebea86cb190d4', { status: 'new', $unset: { slaDeadline: 1 } });
  console.log('Reverted order to new');
  process.exit(0);
}

revert();
