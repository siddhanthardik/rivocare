const mongoose = require('mongoose');
require('dotenv').config({ path: '.env' });
const Provider = require('./src/models/Provider');

async function seedLocations() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Delhi CP coords
  const CP = [77.2219, 28.6324];
  
  const providers = await Provider.find();
  
  for (let i = 0; i < providers.length; i++) {
    const p = providers[i];
    // Spread them around a bit (approx 1-20km)
    const lng = CP[0] + (Math.random() - 0.5) * 0.2;
    const lat = CP[1] + (Math.random() - 0.5) * 0.2;
    
    await Provider.updateOne(
      { _id: p._id },
      { $set: { location: { type: 'Point', coordinates: [lng, lat] } } }
    );
  }

  console.log(`Seeded ${providers.length} providers with coordinates.`);
  process.exit();
}

seedLocations();
