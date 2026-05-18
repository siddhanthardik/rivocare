const mongoose = require('mongoose');
const Partner = require('../src/models/Partner');
const LabTest = require('../src/models/LabTest');
require('dotenv').config();

async function addManual() {
  await mongoose.connect(process.env.MONGODB_URI);
  const srl = await Partner.findOne({ name: /SRL/i });
  
  try {
    const test = await LabTest.create({
      partner: srl._id,
      name: 'Manual CBC',
      department: 'haematology',
      price: 500,
      isActive: true
    });
    console.log('Test created:', test);
  } catch (err) {
    console.error('Error creating test:', err.message);
  }
  
  process.exit(0);
}

addManual();
