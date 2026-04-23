const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./backend/src/models/User');

dotenv.config({ path: './backend/.env' });

async function enable2FA() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    const result = await User.updateMany({}, { is2FAEnabled: true });
    console.log(`Updated ${result.modifiedCount} users to is2FAEnabled: true`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

enable2FA();
