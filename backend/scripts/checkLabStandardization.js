const mongoose = require('mongoose');
const LabTest = require('../src/models/LabTest');
const { LAB_DEPARTMENT_KEYS } = require('../src/constants/departments');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    console.log('LAB_DEPARTMENT_KEYS:', LAB_DEPARTMENT_KEYS);

    const allTests = await LabTest.find({});
    console.log(`Total tests: ${allTests.length}`);

    const invalidTests = allTests.filter(test => {
      const isInvalid = !LAB_DEPARTMENT_KEYS.includes(test.department) || test.category;
      return isInvalid;
    });

    if (invalidTests.length > 0) {
      console.log(`Found ${invalidTests.length} tests requiring migration.`);
      for (const test of invalidTests) {
        console.log(`- Test: ${test.name}, Dept: "${test.department}", Category: "${test.category}"`);
      }
    } else {
      console.log('All tests are standardized!');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
