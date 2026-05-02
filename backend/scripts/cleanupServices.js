const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const Service = require('../src/models/Service');
const Offering = require('../src/models/Offering');
const ServicePricing = require('../src/models/ServicePricing');
const Provider = require('../src/models/Provider');
const Booking = require('../src/models/Booking');

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Rename 'plans' collection to 'offerings' if needed
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    const hasPlans = collections.some(c => c.name === 'plans');
    const hasOfferings = collections.some(c => c.name === 'offerings');

    if (hasPlans && !hasOfferings) {
      console.log('Renaming "plans" collection to "offerings"...');
      await db.collection('plans').rename('offerings');
      console.log('Renamed successfully.');
    } else if (hasPlans && hasOfferings) {
      console.log('Both "plans" and "offerings" exist. Merging data...');
      const plansCount = await db.collection('plans').countDocuments();
      if (plansCount > 0) {
        const plans = await db.collection('plans').find().toArray();
        await db.collection('offerings').insertMany(plans);
        console.log(`Merged ${plansCount} records.`);
      }
      await db.collection('plans').drop();
      console.log('Dropped legacy "plans" collection.');
    }

    // 2. Normalize and Clean Duplicate Services
    const allServices = await Service.find();
    console.log(`Found ${allServices.length} services total.`);

    const groups = {};
    for (const s of allServices) {
      const normName = s.name.trim().toLowerCase();
      if (!groups[normName]) groups[normName] = [];
      groups[normName].push(s);
    }

    for (const name in groups) {
      const list = groups[name];
      if (list.length > 1) {
        console.log(`Found duplicates for "${name}": ${list.length}`);
        
        // Keep the one with the most dependencies or just the first one if all equal
        // For now, let's keep the one that matches the slug best or just the first created
        const kept = list[0];
        const others = list.slice(1);

        for (const other of others) {
          console.log(`Merging ${other._id} -> ${kept._id}`);
          
          // Update Offerings
          await Offering.updateMany({ service: other._id }, { service: kept._id });
          
          // Update ServicePricing
          await ServicePricing.updateMany({ service: other._id }, { service: kept._id });
          
          // Update Providers
          await Provider.updateMany({ services: other._id }, { $set: { "services.$": kept._id } });
          
          // Update Bookings
          await Booking.updateMany({ service: other._id }, { service: kept._id });

          // Delete Duplicate
          await Service.findByIdAndDelete(other._id);
        }
      } else {
        // Just normalize the name and slug of the single entry
        const s = list[0];
        s.name = s.name.trim();
        s.slug = s.name.toLowerCase().replace(/\s+/g, '-');
        await s.save();
      }
    }

    console.log('Cleanup complete!');
    process.exit(0);
  } catch (err) {
    console.error('Cleanup failed:', err);
    process.exit(1);
  }
};

cleanup();
