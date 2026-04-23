const SubscriptionPlan = require('../models/SubscriptionPlan');
const Package = require('../models/Package');
const PatientSubscription = require('../models/PatientSubscription');
const PatientPackage = require('../models/PatientPackage');

// @GET /api/subscriptions/plans
exports.getPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
    res.json({ success: true, data: { plans } });
  } catch (err) { next(err); }
};

// @GET /api/subscriptions/packages
exports.getPackages = async (req, res, next) => {
  try {
    const packages = await Package.find({ isActive: true }).sort({ price: 1 });
    res.json({ success: true, data: { packages } });
  } catch (err) { next(err); }
};

// @POST /api/subscriptions/purchase-plan
exports.purchasePlan = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) return res.status(404).json({ success: false, message: 'Plan not available' });

    // Mock direct payment success state
    const subscription = await PatientSubscription.create({
      user: req.user._id,
      plan: planId,
      status: 'PENDING_ASSIGNMENT'
    });

    res.status(201).json({ success: true, message: 'Subscription purchased successfully. Awaiting provider assignment.', data: { subscription } });
  } catch (err) { next(err); }
};

// @POST /api/subscriptions/purchase-package
exports.purchasePackage = async (req, res, next) => {
  try {
    const { packageId } = req.body;
    const pkg = await Package.findById(packageId);
    if (!pkg || !pkg.isActive) return res.status(404).json({ success: false, message: 'Package not available' });

    // Mock direct payment success state
    const patientPackage = await PatientPackage.create({
      user: req.user._id,
      package: packageId,
      sessionsRemaining: pkg.totalSessions,
      status: 'PENDING_ASSIGNMENT'
    });

    res.status(201).json({ success: true, message: 'Package purchased successfully. Awaiting provider assignment.', data: { patientPackage } });
  } catch (err) { next(err); }
};

// @GET /api/subscriptions/my-subscriptions
exports.getMySubscriptions = async (req, res, next) => {
  try {
    const subscriptions = await PatientSubscription.find({ user: req.user._id })
      .populate('plan')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name email phone avatar' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { subscriptions } });
  } catch (err) { next(err); }
};

// @GET /api/subscriptions/my-packages
exports.getMyPackages = async (req, res, next) => {
  try {
    const packages = await PatientPackage.find({ user: req.user._id })
      .populate('package')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name email phone avatar' } })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: { packages } });
  } catch (err) { next(err); }
};

// @POST /api/subscriptions/packages/:id/log-session
exports.logSession = async (req, res, next) => {
  try {
    // Both admin or assigned provider can log session, let's keep it simple for now and just allow it for demo
    const patientPkg = await PatientPackage.findById(req.params.id);
    if (!patientPkg) return res.status(404).json({ success: false, message: 'Package not found' });
    
    if (patientPkg.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Package is not active' });
    }
    
    if (patientPkg.sessionsRemaining <= 0) {
      return res.status(400).json({ success: false, message: 'No sessions remaining' });
    }

    patientPkg.sessionsRemaining -= 1;
    if (patientPkg.sessionsRemaining === 0) {
      patientPkg.status = 'COMPLETED';
    }
    
    await patientPkg.save();
    res.json({ success: true, message: 'Session logged successfully', data: { patientPackage: patientPkg } });
  } catch (err) { next(err); }
};
