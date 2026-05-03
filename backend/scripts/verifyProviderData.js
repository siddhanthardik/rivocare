const mongoose = require('mongoose');
require('dotenv').config();

const verifyData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const User = require('../src/models/User');
    const Provider = require('../src/models/Provider');
    const Service = require('../src/models/Service');

    // Find user "Siddhant Hardik" to get his provider profile
    const user = await User.findOne({ name: "Siddhant Hardik" });
    if (!user) {
      console.log('User Siddhant Hardik not found');
    } else {
      console.log('User Found:', user._id);
      const provider = await Provider.findOne({ user: user._id });
      console.log('Provider Profile:', JSON.stringify(provider, null, 2));
    }

    const services = await Service.find({});
    console.log('All Services:', JSON.stringify(services.map(s => ({ name: s.name, _id: s._id })), null, 2));

    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err);
    process.exit(1);
  }
};

verifyData();
