const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const path = require('path');
const User = require('./src/models/User');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkPatient = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ DB Connected');

    const user = await User.findOne({ email: 'patient@carely.com' }).select('+password');
    if (!user) {
      console.log('❌ User not found: patient@carely.com');
      
      // Attempt to create the user if missing
      console.log('🔄 Creating default patient user...');
      const newUser = await User.create({
        name: 'John Doe',
        email: 'patient@carely.com',
        password: 'password123',
        role: 'patient',
        phone: '9876543210',
        pincode: '110001',
        acceptedTerms: true,
        isActive: true
      });
      console.log('✅ Default patient created successfully');
    } else {
      console.log('✅ User found:', user.email);
      const isMatch = await bcrypt.compare('password123', user.password);
      console.log('🔑 Password "password123" match:', isMatch);
      
      if (!isMatch) {
         console.log('🔄 Resetting password to "password123"...');
         user.password = 'password123';
         await user.save();
         console.log('✅ Password reset successful');
      }

      if (!user.isActive) {
        console.log('🔄 Activating user account...');
        user.isActive = true;
        await user.save();
        console.log('✅ Account activated');
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
};

checkPatient();
