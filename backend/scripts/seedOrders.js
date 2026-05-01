const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../src/models/User');
const Partner = require('../src/models/Partner');
const LabTest = require('../src/models/LabTest');
const LabOrder = require('../src/models/LabOrder');
const PartnerWallet = require('../src/models/PartnerWallet');

dotenv.config();

const seedLabOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const patient = await User.findOne({ email: 'patient@carely.com' });
    const partner = await Partner.findOne({ email: 'apollo@lab.com' });
    
    if (!patient || !partner) {
      console.log('Patient or Partner not found. Please run seeder first.');
      process.exit(1);
    }

    // Ensure partner has tests
    let test = await LabTest.findOne({ partner: partner._id });
    if (!test) {
      test = await LabTest.create({
        name: 'Complete Blood Count (CBC)',
        category: 'Blood',
        price: 399,
        description: 'Comprehensive blood profile',
        partner: partner._id,
        isActive: true
      });
    }

    // Create a pending order
    await LabOrder.create({
      patient: patient._id,
      partner: partner._id,
      tests: [test._id],
      totalAmount: 399,
      status: 'pending',
      paymentStatus: 'paid',
      scheduledDate: new Date(Date.now() + 86400000),
      scheduledTime: '09:00 AM - 10:00 AM',
      collectionType: 'home',
      collectionAddress: {
        fullAddress: '123 Health St, Sector 14, Gurgaon',
        city: 'Gurgaon',
        pincode: '122001'
      }
    });

    // Create a completed order with report
    await LabOrder.create({
      patient: patient._id,
      partner: partner._id,
      tests: [test._id],
      totalAmount: 399,
      status: 'completed',
      paymentStatus: 'paid',
      scheduledDate: new Date(Date.now() - 86400000),
      scheduledTime: '08:00 AM - 09:00 AM',
      collectionType: 'home',
      collectionAddress: {
        fullAddress: '123 Health St, Sector 14, Gurgaon',
        city: 'Gurgaon',
        pincode: '122001'
      },
      reportUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    });

    console.log('Sample lab orders seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedLabOrders();
