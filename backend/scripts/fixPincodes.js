const mongoose = require('mongoose');
require('dotenv').config();

const fixPincodes = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const Provider = require('../src/models/Provider');

    const result = await Provider.updateMany(
      {},
      [
        {
          $set: {
            pincodesServed: {
              $map: {
                input: "$pincodesServed",
                as: "p",
                in: { $toString: "$$p" }
              }
            }
          }
        }
      ]
    );

    console.log(`Updated ${result.modifiedCount} providers`);
    process.exit(0);
  } catch (err) {
    console.error('Fix failed:', err);
    process.exit(1);
  }
};

fixPincodes();
