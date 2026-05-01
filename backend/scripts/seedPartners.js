const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Partner = require('../src/models/Partner');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const partners = [
  {
    name: 'Apollo Diagnostics',
    email: 'apollo@lab.com',
    password: 'password123',
    phone: '+919876543210',
    status: 'active',
    type: 'lab'
  },
  {
    name: 'SRL Diagnostics',
    email: 'srl@lab.com',
    password: 'password123',
    phone: '+919876543211',
    status: 'active',
    type: 'diagnostic_center'
  },
  {
    name: 'Dr. Lal PathLabs',
    email: 'lalpath@lab.com',
    password: 'password123',
    phone: '+919876543212',
    status: 'pending',
    type: 'lab'
  }
];

const seedPartners = async () => {
  await connectDB();

  try {
    // Check if any partners exist to avoid duplicate key errors on repeated runs
    for (const p of partners) {
      const exists = await Partner.findOne({ email: p.email });
      if (!exists) {
        await Partner.create(p);
        console.log(`Created partner: ${p.name}`);
      } else {
        console.log(`Partner already exists: ${p.name}`);
      }
    }
    console.log('Database seeding completed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding partners:', error.message);
    process.exit(1);
  }
};

seedPartners();
