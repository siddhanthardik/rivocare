const mongoose = require('mongoose');
const Partner = require('../src/models/Partner');
require('dotenv').config();

async function list() {
  await mongoose.connect(process.env.MONGODB_URI);
  const partners = await Partner.find();
  console.log(`Found ${partners.length} partners`);
  partners.forEach(p => console.log(`- ${p._id}: ${p.name} (${p.email})`));
  process.exit(0);
}

list();
