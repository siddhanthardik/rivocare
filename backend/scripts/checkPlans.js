const mongoose = require('mongoose');
require('dotenv').config();

const checkPlans = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const SubscriptionPlan = require('../src/models/SubscriptionPlan');
    const plans = await SubscriptionPlan.find({});
    console.log('All Plans:', JSON.stringify(plans.map(p => ({ name: p.name, _id: p._id, price: p.price })), null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err);
    process.exit(1);
  }
};

checkPlans();
