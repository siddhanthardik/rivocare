const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Partner = require('./src/models/Partner');
const LabTest = require('./src/models/LabTest');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ DB Connected');

    const partners = await Partner.find({ type: 'lab', status: 'active' });
    console.log('Partners:', JSON.stringify(partners.map(p => ({ id: p._id, name: p.name })), null, 2));

    const tests = await LabTest.find({ isActive: true }).populate('partner', 'name');
    console.log('Tests:', JSON.stringify(tests.map(t => ({ id: t._id, name: t.name, price: t.price, partner: t.partner?.name, partnerId: t.partner?._id })), null, 2));

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

checkData();
