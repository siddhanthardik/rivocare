const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('./src/models/User');
const Partner = require('./src/models/Partner');

dotenv.config({ path: path.join(__dirname, '.env') });

const resetAll = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ DB Connected');

    const DEFAULT_PASSWORD = 'password123';

    // 1. Reset Core Users (Patient, Admin, Provider)
    const emails = ['patient@carely.com', 'admin@carely.com', 'provider@carely.com'];
    
    for (const email of emails) {
      let user = await User.findOne({ email });
      if (user) {
        user.password = DEFAULT_PASSWORD;
        user.isActive = true;
        await user.save();
        console.log(`✅ Reset Core User: ${email}`);
      } else {
        console.log(`⚠️ User missing, creating default: ${email}`);
        const role = email.split('@')[0];
        await User.create({
          name: role.charAt(0).toUpperCase() + role.slice(1),
          email,
          password: DEFAULT_PASSWORD,
          role: role === 'admin' ? 'admin' : (role === 'provider' ? 'provider' : 'patient'),
          phone: role === 'patient' ? '9876543210' : (role === 'admin' ? '9876543211' : '9876543212'),
          pincode: '110001',
          acceptedTerms: true,
          isActive: true
        });
        console.log(`✅ Created Core User: ${email}`);
      }
    }

    // 2. Reset Lab Partners
    const partnerEmails = ['apollo@lab.com', 'srl@lab.com', 'lalpath@lab.com'];
    for (const email of partnerEmails) {
      let partner = await Partner.findOne({ email });
      if (partner) {
        partner.password = DEFAULT_PASSWORD;
        partner.status = 'active';
        await partner.save();
        console.log(`✅ Reset Lab Partner: ${email}`);
      } else {
        console.log(`⚠️ Partner missing, creating default: ${email}`);
        await Partner.create({
          name: email.split('@')[0].toUpperCase() + ' Lab',
          email,
          password: DEFAULT_PASSWORD,
          phone: '999999999' + partnerEmails.indexOf(email),
          status: 'active',
          type: 'lab'
        });
        console.log(`✅ Created Lab Partner: ${email}`);
      }
    }

    console.log('\n🚀 ALL PASSWORDS RESET TO: password123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

resetAll();
