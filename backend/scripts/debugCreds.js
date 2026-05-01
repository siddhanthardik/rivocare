const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Partner = require('../src/models/Partner');

dotenv.config();

const checkCreds = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('DB Connected');

  const partner = await Partner.findOne({ email: 'apollo@lab.com' }).select('+password');
  if (!partner) {
    console.log('Partner not found');
    process.exit(1);
  }

  console.log('Partner found:', partner.email);
  const isMatch = await bcrypt.compare('password123', partner.password);
  console.log('Password match:', isMatch);
  
  process.exit(0);
};

checkCreds();
