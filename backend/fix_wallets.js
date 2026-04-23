const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Provider = require('./src/models/Provider');
const Booking = require('./src/models/Booking');
const Wallet = require('./src/models/Wallet');
const Transaction = require('./src/models/Transaction');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log('Connected to DB');
  
  const completedBookings = await Booking.find({ status: 'completed' }).populate('provider');
  let fixedCount = 0;
  
  for (const booking of completedBookings) {
    if (!booking.provider || !booking.provider.user) continue;
    
    // Check if transaction exists
    const existingTx = await Transaction.findOne({ referenceId: booking._id, type: 'CREDIT' });
    if (!existingTx) {
      let wallet = await Wallet.findOne({ user: booking.provider.user });
      if (!wallet) {
        wallet = await Wallet.create({ user: booking.provider.user, balance: 0 });
      }
      
      const commissionRate = 0.8;
      const providerCut = Math.round(booking.totalAmount * commissionRate);
      
      wallet.balance += providerCut;
      await wallet.save();
      
      await Transaction.create({
        wallet: wallet._id,
        type: 'CREDIT',
        amount: providerCut,
        description: `Earnings for Service (Booking: ${booking._id})`,
        referenceId: booking._id,
      });
      
      fixedCount++;
      console.log(`Fixed wallet for booking ${booking._id}`);
    }
  }
  
  console.log(`Successfully fixed ${fixedCount} missing transactions.`);
  process.exit(0);
}).catch(console.error);
