const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Partner = require('../src/models/Partner');

dotenv.config({ path: path.join(__dirname, '../.env') });

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ DB Connected');

    const email = 'admin@srl.com';
    const partner = await Partner.findOne({ email });

    if (partner) {
      console.log('✅ Partner Found:', {
        name: partner.name,
        email: partner.email,
        status: partner.status,
        role: partner.role
      });
    } else {
      console.log('❌ Partner NOT Found:', email);
      const allPartners = await Partner.find({}, 'email');
      console.log('Available Partners:', allPartners.map(p => p.email));
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

check();
