const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const Service = require('../src/models/Service');
const Plan = require('../src/models/Plan');
const SubscriptionPlan = require('../src/models/SubscriptionPlan');
const Package = require('../src/models/Package');
const PatientSubscription = require('../src/models/PatientSubscription');
const PatientPackage = require('../src/models/PatientPackage');

const migrate = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not found in env');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Create Services from enums
    const serviceEnums = ['nurse', 'physiotherapist', 'doctor', 'caretaker', 'procedure', 'lab'];
    const serviceMap = {}; // enum -> ObjectId

    for (const sName of serviceEnums) {
      let service = await Service.findOne({ slug: sName });
      if (!service) {
        service = await Service.create({
          name: sName.charAt(0).toUpperCase() + sName.slice(1),
          slug: sName,
          label: sName.charAt(0).toUpperCase() + sName.slice(1),
          description: `Professional ${sName} services at home.`,
          isActive: true
        });

        console.log(`Created Service: ${sName}`);
      }
      serviceMap[sName] = service._id;
    }

    // 2. Migrate SubscriptionPlans to Plans
    const oldPlans = await SubscriptionPlan.find();
    console.log(`Found ${oldPlans.length} legacy SubscriptionPlans`);
    
    for (const op of oldPlans) {
      const existing = await Plan.findOne({ name: op.name, planType: 'subscription' });
      if (!existing) {
        const np = await Plan.create({
          name: op.name,
          service: serviceMap[op.service] || serviceMap['nurse'],
          planType: 'subscription',
          durationDays: op.durationDays,
          sessionsPerWeek: op.sessionsPerWeek,
          price: op.price,
          description: op.description,
          isActive: op.isActive
        });
        console.log(`Migrated Plan: ${op.name}`);
        
        // Update PatientSubscriptions
        const result = await PatientSubscription.updateMany(
          { plan: op._id },
          { plan: np._id }
        );
        console.log(`Updated ${result.modifiedCount || result.nModified} PatientSubscriptions for ${op.name}`);
      } else {
        console.log(`Plan already exists: ${op.name}`);
      }
    }

    // 3. Migrate Packages to Plans
    const oldPkgs = await Package.find();
    console.log(`Found ${oldPkgs.length} legacy Packages`);

    for (const op of oldPkgs) {
      const existing = await Plan.findOne({ name: op.name, planType: 'package' });
      if (!existing) {
        const np = await Plan.create({
          name: op.name,
          service: serviceMap[op.service] || serviceMap['physiotherapist'],
          planType: 'package',
          totalSessions: op.totalSessions,
          validityDays: op.validityDays,
          price: op.price,
          description: op.description,
          isActive: op.isActive
        });
        console.log(`Migrated Package: ${op.name}`);

        // Update PatientPackages
        const result = await PatientPackage.updateMany(
          { plan: op._id },
          { plan: np._id }
        );
        console.log(`Updated ${result.modifiedCount || result.nModified} PatientPackages for ${op.name}`);
      } else {
        console.log(`Package already exists: ${op.name}`);
      }
    }

    // 4. Migrate Provider services from enums to ObjectIds
    const Provider = require('../src/models/Provider');
    const providers = await Provider.find();
    console.log(`Checking ${providers.length} providers for service migration`);
    for (const p of providers) {
      // Check if any service is a string (legacy)
      const hasLegacyServices = p.services && p.services.some(s => typeof s === 'string');
      if (hasLegacyServices) {
        const newServiceIds = p.services.map(s => serviceMap[s]).filter(id => id);
        p.services = newServiceIds;
        await p.save();
        console.log(`Migrated services for provider: ${p._id}`);
      }
    }

    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
};

migrate();
