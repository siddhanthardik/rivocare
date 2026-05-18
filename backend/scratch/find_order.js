const mongoose = require('mongoose');
const LabOrder = require('../src/models/LabOrder');
require('dotenv').config();

async function checkOrders() {
  await mongoose.connect(process.env.MONGODB_URI);
  const orders = await LabOrder.find();
  console.log(`Checking ${orders.length} orders...`);
  orders.forEach(o => {
    if (o._id.toString().toLowerCase().endsWith('6cb190d4')) {
      console.log('Match found by _id suffix:', o);
    }
  });
  process.exit(0);
}

checkOrders();
