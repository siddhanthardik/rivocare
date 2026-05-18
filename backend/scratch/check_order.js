const mongoose = require('mongoose');
const LabOrder = require('../src/models/LabOrder');
require('dotenv').config();

async function checkOrder() {
  await mongoose.connect(process.env.MONGODB_URI);
  const order = await LabOrder.findOne({ _id: /6cb190d4/i });
  if (!order) {
    // Try by orderId field too
    const order2 = await LabOrder.findOne({ orderId: /6cb190d4/i });
    if (!order2) {
       console.log('Order not found');
       process.exit(1);
    }
    console.log('Found order by orderId:', order2);
  } else {
    console.log('Found order by _id:', order);
  }
  process.exit(0);
}

checkOrder();
