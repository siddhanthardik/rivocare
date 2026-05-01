const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Pricing = require('./src/models/Pricing');

dotenv.config({ path: path.join(__dirname, '.env') });

const seedPricing = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB for seeding...');

    // Clear existing
    await Pricing.deleteMany({});

    const rules = [
      // Physiotherapist
      { serviceType: 'physiotherapist', category: 'basic', label: 'Basic Rehab', basePrice: 500, multiplier: 1, platformMargin: 0.15 },
      { serviceType: 'physiotherapist', category: 'standard', label: 'Standard Rehab', basePrice: 500, multiplier: 1.2, platformMargin: 0.15 },
      { serviceType: 'physiotherapist', category: 'advanced', label: 'Advanced / Post-Surgery', basePrice: 500, multiplier: 1.5, platformMargin: 0.15 },
      { serviceType: 'physiotherapist', category: '5_sessions', label: '5 Sessions Pack', basePrice: 2250, multiplier: 1, platformMargin: 0.15 }, // Already discounted
      { serviceType: 'physiotherapist', category: '10_sessions', label: '10 Sessions Pack', basePrice: 4250, multiplier: 1, platformMargin: 0.15 },

      // Nurse
      { serviceType: 'nurse', category: '12h_day', label: '12h Day Shift', basePrice: 1200, multiplier: 1, platformMargin: 0.15 },
      { serviceType: 'nurse', category: '12h_night', label: '12h Night Shift', basePrice: 1400, multiplier: 1, platformMargin: 0.15 },
      { serviceType: 'nurse', category: '24h_live_in', label: '24h Live-in', basePrice: 2500, multiplier: 1, platformMargin: 0.15 },

      // Doctor
      { serviceType: 'doctor', category: 'gp', label: 'General Physician', basePrice: 800, multiplier: 1, platformMargin: 0.15 },
      { serviceType: 'doctor', category: 'specialist_ortho', label: 'Orthopedics Specialist', basePrice: 1500, multiplier: 1, platformMargin: 0.15 },
      { serviceType: 'doctor', category: 'specialist_cardio', label: 'Cardiology Specialist', basePrice: 1800, multiplier: 1, platformMargin: 0.15 },

      // Lab (Examples)
      { serviceType: 'lab', category: 'cbc_test', label: 'CBC (Complete Blood Count)', basePrice: 300, multiplier: 1, platformMargin: 0.20 },
      { serviceType: 'lab', category: 'lipid_profile', label: 'Lipid Profile', basePrice: 600, multiplier: 1, platformMargin: 0.20 },
      { serviceType: 'lab', category: 'thyroid_panel', label: 'Thyroid Panel (T3, T4, TSH)', basePrice: 500, multiplier: 1, platformMargin: 0.20 },
    ];

    await Pricing.insertMany(rules);
    console.log('Successfully seeded Pricing rules!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedPricing();
