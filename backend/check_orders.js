const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const LabOrder = require('./src/models/LabOrder');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ DB Connected');

    const orders = await LabOrder.find().sort('-createdAt').limit(5);
    console.log('Recent Orders:', JSON.stringify(orders.map(o => ({ id: o._id, status: o.status, amount: o.totalAmount, date: o.createdAt })), null, 2));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

checkOrders();
