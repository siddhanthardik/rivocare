require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('../models/Service');
const User = require('../models/User');
const Provider = require('../models/Provider');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rivo';

const services = [
  { name: 'nurse', label: 'Nurse', description: 'Professional nursing care at home — wound care, injections, monitoring vitals.', icon: '💉', basePrice: 400, durationHours: 2 },
  { name: 'physiotherapist', label: 'Physiotherapist', description: 'Rehabilitation and physical therapy sessions in the comfort of your home.', icon: '🦴', basePrice: 500, durationHours: 1 },
  { name: 'doctor', label: 'Doctor', description: 'General physician consultation and diagnosis at your doorstep.', icon: '👨‍⚕️', basePrice: 700, durationHours: 1 },
  { name: 'caretaker', label: 'Caretaker', description: 'Compassionate daily care assistance for elderly or post-surgery patients.', icon: '🤲', basePrice: 300, durationHours: 4 },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');

  // Seed services
  await Service.deleteMany({});
  await Service.insertMany(services);
  console.log('✅ Services seeded');

  // Seed admin user
  await User.deleteOne({ email: 'admin@rivocare.in' });
  const admin = await User.create({
    name: 'RIVO Admin',
    email: 'admin@rivocare.in',
    password: 'Admin@1234',
    role: 'admin',
    phone: '9000000000',
  });
  console.log(`✅ Admin seeded: admin@rivocare.in / Admin@1234`);

  // Seed a demo provider
  await User.deleteOne({ email: 'provider@rivocare.in' });
  const providerUser = await User.create({
    name: 'Dr. RIVO Provider',
    email: 'provider@rivocare.in',
    password: 'Provider@1234',
    role: 'provider',
    phone: '9111111111',
    pincode: '400001',
  });
  await Provider.deleteOne({ user: providerUser._id });
  await Provider.create({
    user: providerUser._id,
    services: ['nurse', 'doctor'],
    bio: 'Experienced home healthcare professional with 8 years of service.',
    experience: 8,
    pincodesServed: ['400001', '400002', '400003'],
    pricePerHour: 500,
    isVerified: true,
    isOnline: true,
    rating: 4.8,
    totalRatings: 120,
    completedBookings: 320,
  });
  console.log('✅ Demo provider seeded: provider@rivocare.in / Provider@1234');

  // Seed a demo patient
  await User.deleteOne({ email: 'patient@rivocare.in' });
  await User.create({
    name: 'RIVO Patient',
    email: 'patient@rivocare.in',
    password: 'Patient@1234',
    role: 'patient',
    phone: '9222222222',
    pincode: '400001',
    address: '12, MG Road, Mumbai',
  });
  console.log('✅ Demo patient seeded: patient@rivocare.in / Patient@1234');

  console.log('\n🎉 Seeding complete!');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
