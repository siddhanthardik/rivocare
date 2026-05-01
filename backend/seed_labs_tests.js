const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const LabTest = require('./src/models/LabTest');
const Partner = require('./src/models/Partner');

dotenv.config({ path: path.join(__dirname, '.env') });

const updateTests = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ DB Connected');

    const apollo = await Partner.findOne({ name: 'Apollo Diagnostics' });
    const srl = await Partner.findOne({ name: 'SRL Diagnostics' });

    if (!apollo || !srl) {
      console.log('Partners missing. Run seeding first.');
      process.exit(1);
    }

    // Update CBC
    await LabTest.findOneAndUpdate(
      { name: 'Complete Blood Count (CBC)' },
      { category: 'Popular', parameters: ['Hb', 'WBC', 'RBC', 'Platelets'], tatHours: 12 },
      { upsert: true }
    );

    // Add more tests
    const tests = [
      {
        name: 'Thyroid Profile (T3, T4, TSH)',
        category: 'Popular',
        price: 499,
        partner: apollo._id,
        parameters: ['T3', 'T4', 'TSH'],
        tatHours: 24
      },
      {
        name: 'HbA1c (Diabetes)',
        category: 'Diabetes',
        price: 599,
        partner: srl._id,
        parameters: ['HbA1c'],
        tatHours: 12
      },
      {
        name: 'Vitamin D',
        category: 'Senior Citizen',
        price: 1299,
        partner: apollo._id,
        parameters: ['Vitamin D'],
        tatHours: 24
      }
    ];

    for (const t of tests) {
      await LabTest.findOneAndUpdate({ name: t.name }, t, { upsert: true });
    }

    console.log('✅ Lab tests updated/seeded');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

updateTests();
