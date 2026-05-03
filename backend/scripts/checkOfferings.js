const mongoose = require('mongoose');
require('dotenv').config();

const checkOfferings = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Offering = require('../src/models/Offering');
    const plans = await Offering.find({});
    console.log('All Offerings:', JSON.stringify(plans.map(p => ({ name: p.name, _id: p._id, price: p.price, service: p.service })), null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err);
    process.exit(1);
  }
};

checkOfferings();
