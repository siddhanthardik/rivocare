const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Partner = require('../src/models/Partner');
const LabProfile = require('../src/models/LabProfile');
const LabTest = require('../src/models/LabTest');

async function reset() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in environment');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Delete all labs
    const partnerDel = await Partner.deleteMany({ }); 
    const profileDel = await LabProfile.deleteMany({});
    const testDel = await LabTest.deleteMany({});
    console.log(`Cleared: ${partnerDel.deletedCount} partners, ${profileDel.deletedCount} profiles, ${testDel.deletedCount} tests`);

    // 2. Create a fresh lab entry
    const lab = await Partner.create({
      name: 'SRL Diagnostics',
      email: 'admin@srl.com',
      password: 'password123',
      phone: '9876543210',
      role: 'partner',
      status: 'active',
      type: 'lab'
    });

    await LabProfile.create({
      partner: lab._id,
      labName: 'SRL Diagnostics',
      commissions: [
        { department: 'pathology', commissionType: 'percentage', commissionValue: 20 },
        { department: 'radiology', commissionType: 'percentage', commissionValue: 15 },
        { department: 'cardiology', commissionType: 'percentage', commissionValue: 20 },
        { department: 'wellness', commissionType: 'percentage', commissionValue: 10 },
        { department: 'genetics', commissionType: 'percentage', commissionValue: 18 },
        { department: 'microbiology', commissionType: 'percentage', commissionValue: 12 }
      ],
      addressDetails: {
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        fullAddress: '123 Health Street, Worli'
      }
    });

    console.log('Created fresh lab: SRL Diagnostics (admin@srl.com / 9876543210)');
    process.exit(0);
  } catch (err) {
    console.error('Reset failed:', err.message);
    process.exit(1);
  }
}

reset();
