const User = require('../models/User');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const FraudFlag = require('../models/FraudFlag');
const ServiceablePincode = require('../models/ServiceablePincode');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Package = require('../models/Package');
const PatientSubscription = require('../models/PatientSubscription');
const PatientPackage = require('../models/PatientPackage');
const ServiceAssignment = require('../models/ServiceAssignment');
const Service = require('../models/Service');
const { BOOKING_STATUS, PAYMENT_STATUS, normalizeBookingStatus, normalizePaymentStatus } = require('../constants/bookingStatus');
const reconciliationService = require('../services/reconciliationService');

// @GET /api/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalProviders, totalBookings, revenueAgg] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Provider.countDocuments(),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { status: { $in: [BOOKING_STATUS.COMPLETED, 'completed', 'COMPLETED'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const onlineProviders = await Provider.countDocuments({ isOnline: true });
    const pendingBookings = await Booking.countDocuments({ status: { $in: [BOOKING_STATUS.REQUESTED, 'pending', 'PENDING', 'REQUESTED'] } });
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Last 7 days bookings
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentBookings = await Booking.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProviders,
        totalBookings,
        onlineProviders,
        pendingBookings,
        totalRevenue,
        recentBookings,
        cancelledBookings: await Booking.countDocuments({ status: { $in: [BOOKING_STATUS.CANCELLED, 'cancelled', 'CANCELLED'] } }),
        grossRevenue: totalRevenue,
        platformRevenue: Math.round(totalRevenue * 0.2),
        desyncIssues: await reconciliationService.runReconciliationCheck()
      },
    });
  } catch (err) {
    next(err);
  }
};

// @GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({ success: true, data: { users, total, page: Number(page), totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/admin/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const { isActive, role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isActive, role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/admin/providers/:id/verify
exports.verifyProvider = async (req, res, next) => {
  try {
    const { action, rejectionNotes, kycStatus, docIndex, docStatus } = req.body;
    // action: 'ACTIVATE' | 'REJECT' | 'VERIFY_KYC' | 'REJECT_KYC' | 'VERIFY_DOC' | 'REJECT_DOC'

    const provider = await Provider.findById(req.params.id).populate('user', 'name email');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    const emailService = require('../services/emailService');

    if (action === 'ACTIVATE') {
      provider.isVerified = true;
      provider.onboardingStatus = 'ACTIVE';
      provider.isAvailable = true;
      if (rejectionNotes) provider.rejectionNotes = rejectionNotes;
      await provider.save();
      try { emailService.sendVerificationApproved(provider.user.email, provider.user.name); } catch(e) {}
    } else if (action === 'REJECT') {
      provider.isVerified = false;
      provider.onboardingStatus = 'REJECTED';
      provider.rejectionNotes = rejectionNotes || 'Documents could not be verified.';
      await provider.save();
      try { emailService.sendVerificationRejected(provider.user.email, provider.user.name, provider.rejectionNotes); } catch(e) {}
    } else if (action === 'SUSPEND') {
      provider.isVerified = false;
      provider.onboardingStatus = 'SUSPENDED';
      provider.isOnline = false;
      provider.isAvailable = false;
      await provider.save();
    } else if (action === 'VERIFY_KYC') {
      provider.kycDetails.status = 'VERIFIED';
      await provider.save();
    } else if (action === 'REJECT_KYC') {
      provider.kycDetails.status = 'REJECTED';
      await provider.save();
    } else if (action === 'VERIFY_DOC' && docIndex !== undefined) {
      if (provider.professionalDocs[docIndex]) {
        provider.professionalDocs[docIndex].status = 'VERIFIED';
        await provider.save();
      }
    } else if (action === 'REJECT_DOC' && docIndex !== undefined) {
      if (provider.professionalDocs[docIndex]) {
        provider.professionalDocs[docIndex].status = 'REJECTED';
        await provider.save();
      }
    } else if (action === 'VERIFY_POLICE') {
      provider.policeVerificationStatus = 'VERIFIED';
      await provider.save();
    } else {
      // Legacy: toggle isVerified
      provider.isVerified = req.body.isVerified;
      await provider.save();
    }

    res.json({ success: true, message: 'Provider updated', data: { provider } });
  } catch (err) { next(err); }
};

// @GET /api/admin/providers/onboarding — list providers pending verification
exports.getOnboardingProviders = async (req, res, next) => {
  try {
    const { status = 'PENDING_VERIFICATION', page = 1, limit = 20 } = req.query;
    const validStatuses = ['INCOMPLETE', 'DRAFT', 'PENDING_VERIFICATION', 'ACTIVE', 'REJECTED', 'SUSPENDED'];
    const filter = validStatuses.includes(status) ? { onboardingStatus: status } : { onboardingStatus: 'PENDING_VERIFICATION' };

    const total = await Provider.countDocuments(filter);
    const providers = await Provider.find(filter)
      .populate('user', 'name email phone avatar')
      .sort({ updatedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({ success: true, data: { providers, total, page: Number(page), totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

// @GET /api/admin/providers
exports.getAllProviders = async (req, res, next) => {
  try {
    const { verified, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (verified !== undefined) filter.isVerified = verified === 'true';

    const total = await Provider.countDocuments(filter);
    const providers = await Provider.find(filter)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({ success: true, data: { providers, total } });
  } catch (err) {
    next(err);
  }
};

// @GET /api/admin/providers/:id/details
exports.getProviderDetails = async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id).populate('user', '-password');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    const Wallet = require('../models/Wallet');
    const Transaction = require('../models/Transaction');
    const wallet = await Wallet.findOne({ user: provider.user._id });
    
    let transactions = [];
    if (wallet) {
      transactions = await Transaction.find({ wallet: wallet._id }).sort({ createdAt: -1 });
    }

    const bookings = await Booking.find({ provider: provider._id })
      .populate('patient', 'name email phone avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        provider,
        user: provider.user,
        wallet,
        transactions,
        bookings
      }
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  REVENUE DASHBOARD ENDPOINTS
// ─────────────────────────────────────────────────────────────

// @GET /api/admin/dashboard/summary
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalProviders,
      totalBookings,
      completedBookings,
      pendingBookings,
      cancelledBookings,
      revenueAgg,
    ] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Provider.countDocuments({ isVerified: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: { $in: [BOOKING_STATUS.COMPLETED, 'completed', 'COMPLETED'] } }),
      Booking.countDocuments({ status: { $in: [BOOKING_STATUS.REQUESTED, 'pending', 'PENDING', 'REQUESTED'] } }),
      Booking.countDocuments({ status: { $in: [BOOKING_STATUS.CANCELLED, 'cancelled', 'CANCELLED'] } }),
      Booking.aggregate([
        { $match: { 
            status: { $in: [BOOKING_STATUS.COMPLETED, 'completed', 'COMPLETED'] }, 
            paymentStatus: { $in: [PAYMENT_STATUS.PAID, 'PAID', 'paid', 'success', 'SUCCESS'] } 
          } 
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    // Platform takes 20% commission
    const grossRevenue = revenueAgg[0]?.total || 0;
    const platformRevenue = Math.round(grossRevenue * 0.2);

    res.json({
      success: true,
      data: {
        totalRevenue: platformRevenue,
        grossRevenue,
        totalBookings,
        completedBookings,
        pendingBookings,
        cancelledBookings,
        totalProviders,
        totalUsers,
        desyncIssues: await reconciliationService.runReconciliationCheck()
      },
    });
  } catch (err) {
    next(err);
  }
};

// @GET /api/admin/dashboard/revenue?period=7|30
exports.getDashboardRevenue = async (req, res, next) => {
  try {
    const period = parseInt(req.query.period) || 7;
    const now = new Date();
    const startDate = new Date(now - period * 24 * 60 * 60 * 1000);

    // Daily revenue for the period
    const dailyRevenue = await Booking.aggregate([
      {
        $match: {
          status: { $in: [BOOKING_STATUS.COMPLETED, 'completed', 'COMPLETED'] },
          paymentStatus: { $in: [PAYMENT_STATUS.PAID, 'PAID', 'paid', 'success', 'SUCCESS'] },
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    ]);

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          status: { $in: [BOOKING_STATUS.COMPLETED, 'completed', 'COMPLETED'] },
          paymentStatus: { $in: [PAYMENT_STATUS.PAID, 'PAID', 'paid', 'success', 'SUCCESS'] },
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    // Normalize daily data — fill missing dates with 0
    const dailyMap = {};
    dailyRevenue.forEach((d) => {
      const key = `${d._id.year}-${String(d._id.month).padStart(2,'0')}-${String(d._id.day).padStart(2,'0')}`;
      dailyMap[key] = { revenue: d.revenue, bookings: d.bookings };
    });

    const dailyData = [];
    for (let i = 0; i < period; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      dailyData.push({
        date: key,
        label: `${date.getDate()} ${monthNames[date.getMonth()]}`,
        revenue: dailyMap[key]?.revenue || 0,
        bookings: dailyMap[key]?.bookings || 0,
      });
    }

    const monthlyData = monthlyRevenue.map((m) => ({
      label: `${monthNames[m._id.month - 1]} ${m._id.year}`,
      revenue: m.revenue,
      bookings: m.bookings,
    }));

    res.json({ success: true, data: { daily: dailyData, monthly: monthlyData } });
  } catch (err) {
    next(err);
  }
};

// @GET /api/admin/dashboard/top-providers?limit=10
exports.getTopProviders = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const topProviders = await Booking.aggregate([
      { $match: { 
          status: { $in: [BOOKING_STATUS.COMPLETED, 'completed', 'COMPLETED'] }, 
          paymentStatus: { $in: [PAYMENT_STATUS.PAID, 'PAID', 'paid', 'success', 'SUCCESS'] } 
        } 
      },
      {
        $group: {
          _id: '$provider',
          totalEarnings: { $sum: '$totalAmount' },
          completedBookings: { $sum: 1 },
        },
      },
      { $sort: { totalEarnings: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'providers',
          localField: '_id',
          foreignField: '_id',
          as: 'providerData',
        },
      },
      { $unwind: '$providerData' },
      {
        $lookup: {
          from: 'users',
          localField: 'providerData.user',
          foreignField: '_id',
          as: 'userData',
        },
      },
      { $unwind: '$userData' },
      {
        $project: {
          _id: 1,
          name: '$userData.name',
          email: '$userData.email',
          services: '$providerData.services',
          rating: '$providerData.rating',
          totalRatings: '$providerData.totalRatings',
          isVerified: '$providerData.isVerified',
          totalEarnings: 1,
          completedBookings: 1,
          providerShare: { $multiply: ['$totalEarnings', 0.8] },
          platformShare: { $multiply: ['$totalEarnings', 0.2] },
        },
      },
    ]);

    res.json({ success: true, data: { topProviders } });
  } catch (err) {
    next(err);
  }
};

// @GET /api/admin/dashboard/bookings
exports.getDashboardBookings = async (req, res, next) => {
  try {
    const statusBreakdown = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const paymentBreakdown = await Booking.aggregate([
      { $group: { _id: '$paymentStatus', count: { $sum: 1 } } },
    ]);

    const serviceBreakdown = await Booking.aggregate([
      { $match: { status: { $in: [BOOKING_STATUS.COMPLETED, 'completed', 'COMPLETED'] } } },
      {
        $group: {
          _id: '$service',
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        statusBreakdown: statusBreakdown.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
        paymentBreakdown: paymentBreakdown.reduce((acc, s) => {
          acc[s._id] = s.count;
          return acc;
        }, {}),
        serviceBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  FRAUD ANALYTICS DASHBOARD ENDPOINTS
// ─────────────────────────────────────────────────────────────

// @GET /api/admin/fraud/summary
exports.getFraudSummary = async (req, res, next) => {
  try {
    const [totalFlags, highSeverityFlags, activeProviders, blockedProviders] = await Promise.all([
      FraudFlag.countDocuments({ isResolved: false }),
      FraudFlag.countDocuments({ isResolved: false, severity: 'HIGH' }),
      Provider.countDocuments({ isBlocked: false }),
      Provider.countDocuments({ isBlocked: true }),
    ]);

    res.json({
      success: true,
      data: {
        totalFlags,
        highSeverityFlags,
        activeProviders,
        blockedProviders,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @GET /api/admin/fraud/flags
exports.getFraudFlags = async (req, res, next) => {
  try {
    const { entityType, severity, page = 1, limit = 50 } = req.query;
    const filter = { isResolved: false };

    if (entityType) filter.entityType = entityType;
    if (severity) filter.severity = severity;

    const total = await FraudFlag.countDocuments(filter);
    // Fetch flags without traditional populate first, then manually populate based on entityType
    // because entityId is dynamic and polymorphic.
    const rawFlags = await FraudFlag.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    // Group by type for batch population
    const providerIds = rawFlags.filter(f => f.entityType === 'PROVIDER').map(f => f.entityId);
    const userIds = rawFlags.filter(f => f.entityType === 'USER').map(f => f.entityId);
    const bookingIds = rawFlags.filter(f => f.entityType === 'BOOKING').map(f => f.entityId);

    const [providers, users, bookings] = await Promise.all([
      Provider.find({ _id: { $in: providerIds } }).populate('user', 'name email phone').lean(),
      User.find({ _id: { $in: userIds } }).select('name email').lean(),
      Booking.find({ _id: { $in: bookingIds } }).lean(),
    ]);

    // Create lookup maps
    const providerMap = {}, userMap = {}, bookingMap = {};
    providers.forEach(p => providerMap[p._id.toString()] = p);
    users.forEach(u => userMap[u._id.toString()] = u);
    bookings.forEach(b => bookingMap[b._id.toString()] = b);

    // Attach data back
    const flags = rawFlags.map(f => {
      let entityData = null;
      const idStr = f.entityId.toString();
      if (f.entityType === 'PROVIDER') entityData = providerMap[idStr];
      else if (f.entityType === 'USER') entityData = userMap[idStr];
      else if (f.entityType === 'BOOKING') entityData = bookingMap[idStr];
      
      return { ...f, entityData };
    });

    res.json({
      success: true,
      data: { flags, total, page: Number(page), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// @POST /api/admin/fraud/action
exports.takeFraudAction = async (req, res, next) => {
  try {
    const { flagId, action, reason } = req.body; 
    // action: 'warn' | 'block' | 'resolve'
    // reason: optional message from admin
    
    const flag = await FraudFlag.findById(flagId);
    if (!flag) return res.status(404).json({ success: false, message: 'Fraud flag not found' });

    if (action === 'resolve') {
      flag.isResolved = true;
      await flag.save();
      return res.json({ success: true, message: 'Flag resolved' });
    }

    if (flag.entityType === 'PROVIDER') {
      const provider = await Provider.findById(flag.entityId);
      if (!provider) return res.status(404).json({ success: false, message: 'Provider no longer exists' });

      if (action === 'warn') {
        provider.warningCount += 1;
        await provider.save();
        flag.isResolved = true; // Typically resolved after taking action
        await flag.save();
        return res.json({ success: true, message: 'Provider warned successfully', data: { provider } });
      } else if (action === 'block') {
        provider.isBlocked = true;
        await provider.save();
        flag.isResolved = true;
        await flag.save();
        return res.json({ success: true, message: 'Provider blocked successfully', data: { provider } });
      }
    }

    // Default response if no action handled
    return res.status(400).json({ success: false, message: 'Unsupported action or entity type' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  SERVICEABLE PINCODES ENDPOINTS
// ─────────────────────────────────────────────────────────────

// @POST /api/admin/pincodes/add
exports.addPincode = async (req, res, next) => {
  try {
    const { pincode, areaName, city, state, isActive } = req.body;
    
    let existing = await ServiceablePincode.findOne({ pincode });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Pincode already exists in service areas.' });
    }

    const newPincode = await ServiceablePincode.create({ pincode, areaName, city, state, isActive });
    res.status(201).json({ success: true, message: 'Service area added successfully', data: { pincode: newPincode } });
  } catch (err) {
    next(err);
  }
};

// @GET /api/admin/pincodes/list
exports.listPincodes = async (req, res, next) => {
  try {
    const pincodes = await ServiceablePincode.find().sort({ createdAt: -1 });
    res.json({ success: true, data: { pincodes } });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/admin/pincodes/:id/toggle
exports.togglePincodeState = async (req, res, next) => {
  try {
    const pincodeDoc = await ServiceablePincode.findById(req.params.id);
    if (!pincodeDoc) return res.status(404).json({ success: false, message: 'Pincode not found' });
    
    pincodeDoc.isActive = !pincodeDoc.isActive;
    await pincodeDoc.save();

    res.json({ success: true, message: `Pincode ${pincodeDoc.pincode} is now ${pincodeDoc.isActive ? 'active' : 'inactive'}`, data: { pincode: pincodeDoc } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  SUBSCRIPTIONS & PACKAGES ENDPOINTS
// ─────────────────────────────────────────────────────────────

// @POST /api/admin/plans/create
exports.createPlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
    res.status(201).json({ success: true, message: 'Plan created', data: { plan } });
  } catch (err) { next(err); }
};

// @GET /api/admin/plans
exports.getPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find().sort({ createdAt: -1 });
    res.json({ success: true, data: { plans } });
  } catch (err) { next(err); }
};

// @PUT /api/admin/plans/:id
exports.updatePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, message: 'Plan updated', data: { plan } });
  } catch (err) { next(err); }
};

// @POST /api/admin/packages/create
exports.createPackage = async (req, res, next) => {
  try {
    const pkg = await Package.create(req.body);
    res.status(201).json({ success: true, message: 'Package created', data: { package: pkg } });
  } catch (err) { next(err); }
};

// @GET /api/admin/packages
exports.getPackages = async (req, res, next) => {
  try {
    const packages = await Package.find().sort({ createdAt: -1 });
    res.json({ success: true, data: { packages } });
  } catch (err) { next(err); }
};

// @PUT /api/admin/packages/:id
exports.updatePackage = async (req, res, next) => {
  try {
    const pkg = await Package.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!pkg) return res.status(404).json({ success: false, message: 'Package not found' });
    res.json({ success: true, message: 'Package updated', data: { package: pkg } });
  } catch (err) { next(err); }
};

// @GET /api/admin/assignments/pending
exports.getPendingAssignments = async (req, res, next) => {
  try {
     const pendingSubs = await PatientSubscription.find({ status: 'PENDING_ASSIGNMENT' }).populate('user', 'name email phone avatar').populate('plan').sort({ createdAt: -1 });
     const pendingPkgs = await PatientPackage.find({ status: 'PENDING_ASSIGNMENT' }).populate('user', 'name email phone avatar').populate('package').sort({ createdAt: -1 });
     res.json({ success: true, data: { pendingSubs, pendingPkgs } });
  } catch (err) { next(err); }
};

// @POST /api/admin/assign-provider
exports.assignProvider = async (req, res, next) => {
  try {
    const { referenceId, type, providerId, notes } = req.body;
    
    const provider = await Provider.findById(providerId);
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    let target;
    if (type === 'SUBSCRIPTION') {
      target = await PatientSubscription.findById(referenceId);
    } else {
      target = await PatientPackage.findById(referenceId);
    }

    if (!target) return res.status(404).json({ success: false, message: 'Request not found' });
    if (target.status !== 'PENDING_ASSIGNMENT') return res.status(400).json({ success: false, message: 'Request already assigned or active' });

    // Ensure we don't duplicate pending assignments
    const existing = await ServiceAssignment.findOne({ type, referenceId, status: 'PENDING' });
    if (existing) return res.status(400).json({ success: false, message: 'This request is already pending acceptance by another provider' });

    const assignment = await ServiceAssignment.create({
      patient: target.user,
      provider: providerId,
      type,
      referenceId,
      modelType: type === 'SUBSCRIPTION' ? 'PatientSubscription' : 'PatientPackage',
      notes
    });

    res.json({ success: true, message: 'Request assigned to Provider successfully', data: { assignment } });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
//  SERVICE PRICING MANAGEMENT
// ─────────────────────────────────────────────────────────────

// @GET /api/admin/services/pricing
exports.getServicePricing = async (req, res, next) => {
  try {
    const services = await Service.find().sort({ name: 1 });
    res.json({ success: true, data: { services } });
  } catch (err) { next(err); }
};

// @PUT /api/admin/services/:id/pricing
exports.updateServicePricing = async (req, res, next) => {
  try {
    const { basePrice, maxMarkupAllowed } = req.body;
    const update = {};
    if (basePrice !== undefined) update.basePrice = basePrice;
    if (maxMarkupAllowed !== undefined) update.maxMarkupAllowed = maxMarkupAllowed;

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    if (!service) return res.status(404).json({ success: false, message: 'Service not found' });
    res.json({ success: true, message: 'Service pricing updated', data: { service } });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
//  ADMIN PRICE OVERRIDE
// ─────────────────────────────────────────────────────────────

// @PUT /api/admin/bookings/:id/set-price
exports.setAdminPrice = async (req, res, next) => {
  try {
    const { overridePrice, reason } = req.body;

    // Validation
    if (!overridePrice || Number(overridePrice) <= 0) {
      return res.status(400).json({ success: false, message: 'A valid overridePrice is required' });
    }
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: 'A reason is required for admin price override' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Cannot override after payment
    if (normalizePaymentStatus(booking.paymentStatus) === PAYMENT_STATUS.PAID) {
      return res.status(400).json({ success: false, message: 'Cannot override price after payment has been made' });
    }

    // Cannot override cancelled booking
    if (normalizeBookingStatus(booking.status) === BOOKING_STATUS.CANCELLED) {
      return res.status(400).json({ success: false, message: 'Cannot override price on a cancelled booking' });
    }

    const oldPrice = booking.finalPrice || booking.totalAmount;
    const newPrice = Number(overridePrice);

    booking.pricingType = 'OVERRIDE';
    booking.overridePrice = newPrice;
    booking.overrideReason = reason.trim();
    booking.priceSetBy = 'ADMIN';
    booking.finalPrice = newPrice;
    booking.totalAmount = newPrice;
    booking.priceUpdated = true;
    booking.priceApprovedByPatient = true; // Admin override auto-approved (admin authority)

    booking.priceHistory.push({
      changedBy: 'admin',
      changedByUserId: req.user._id,
      oldPrice,
      newPrice,
      reason: reason.trim(),
      action: 'admin_override',
    });

    await booking.save();

    // Notify patient
    const Notification = require('../models/Notification');
    const socketHelper = require('../socket');

    const notification = await Notification.create({
      user: booking.patient,
      title: 'Price Adjusted by Admin',
      message: `Your booking price has been updated to ₹${newPrice} by the platform. Reason: ${reason.trim()}`,
      type: 'BOOKING',
      linkId: booking._id,
    });
    try {
      socketHelper.getIO().to(booking.patient.toString()).emit('notification', notification);
      socketHelper.getIO().to(booking.patient.toString()).emit('price-updated', {
        bookingId: booking._id,
        newFinalPrice: newPrice,
        reason: reason.trim(),
        setBy: 'ADMIN',
      });
    } catch (e) {}

    // Notify provider too
    const providerDoc = await Provider.findById(booking.provider);
    if (providerDoc) {
      const pNotif = await Notification.create({
        user: providerDoc.user,
        title: 'Price Adjusted by Admin',
        message: `The price for booking has been set to ₹${newPrice} by the platform admin.`,
        type: 'BOOKING',
        linkId: booking._id,
      });
      try {
        socketHelper.getIO().to(providerDoc.user.toString()).emit('notification', pNotif);
      } catch (e) {}
    }

    await booking.populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'provider', populate: { path: 'user', select: 'name email phone' } },
    ]);

    res.json({
      success: true,
      message: `Admin price override applied: ₹${newPrice}`,
      data: { booking },
    });
  } catch (err) { next(err); }
};

// ---------------------- CMS: Pages & Blogs ----------------------
const Page = require('../models/Page');
const Blog = require('../models/Blog');
const emailService = require('../services/emailService');

// @POST /api/admin/content/pages
exports.createPage = async (req, res, next) => {
  try {
    const { title, slug, content, meta, isActive } = req.body;
    const existing = await Page.findOne({ slug });
    if (existing) return res.status(400).json({ success: false, message: 'Slug already in use' });
    const page = await Page.create({ title, slug, content, meta, isActive, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Page created', data: { page } });
  } catch (err) { next(err); }
};

// @GET /api/admin/content/pages
exports.listPages = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const filter = {};
    if (search) filter.$or = [ { title: { $regex: search, $options: 'i' } }, { slug: { $regex: search, $options: 'i' } } ];
    const total = await Page.countDocuments(filter);
    const pages = await Page.find(filter).sort({ createdAt: -1 }).limit(Number(limit)).skip((Number(page)-1)*Number(limit));
    res.json({ success: true, data: { pages, total, page: Number(page), totalPages: Math.ceil(total/limit) } });
  } catch (err) { next(err); }
};

// @GET /api/admin/content/pages/:id
exports.getPage = async (req, res, next) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    res.json({ success: true, data: { page } });
  } catch (err) { next(err); }
};

// @PUT /api/admin/content/pages/:id
exports.updatePage = async (req, res, next) => {
  try {
    const update = { ...req.body, updatedBy: req.user._id };
    const page = await Page.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    res.json({ success: true, message: 'Page updated', data: { page } });
  } catch (err) { next(err); }
};

// @DELETE /api/admin/content/pages/:id
exports.deletePage = async (req, res, next) => {
  try {
    const page = await Page.findByIdAndDelete(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    res.json({ success: true, message: 'Page deleted' });
  } catch (err) { next(err); }
};

// @POST /api/admin/content/pages/:id/hero (multipart form-data file: image)
exports.uploadPageHero = async (req, res, next) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    // multer-storage-cloudinary exposes file.path as URL in many configs
    const url = req.file.path || req.file.secure_url || req.file.url;
    const publicId = req.file.filename || req.file.public_id || req.file.publicId;
    page.heroImage = { url, publicId };
    await page.save();
    res.json({ success: true, message: 'Hero image uploaded', data: { page } });
  } catch (err) { next(err); }
};

// ---------------- Blogs ----------------
// @POST /api/admin/blogs
exports.createBlog = async (req, res, next) => {
  try {
    const { title, slug, excerpt, content, tags = [], status } = req.body;
    const existing = await Blog.findOne({ slug });
    if (existing) return res.status(400).json({ success: false, message: 'Slug already in use' });
    const blog = await Blog.create({ title, slug, excerpt, content, tags, status: status || 'DRAFT', author: req.user._id, createdBy: req.user._id });
    if (blog.status === 'PUBLISHED') blog.publishedAt = new Date();
    await blog.save();
    res.status(201).json({ success: true, message: 'Blog created', data: { blog } });
  } catch (err) { next(err); }
};

// @GET /api/admin/blogs
exports.listBlogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$or = [ { title: { $regex: search, $options: 'i' } }, { slug: { $regex: search, $options: 'i' } }, { excerpt: { $regex: search, $options: 'i' } } ];
    const total = await Blog.countDocuments(filter);
    const blogs = await Blog.find(filter).populate('author', 'name email').sort({ createdAt: -1 }).limit(Number(limit)).skip((Number(page)-1)*Number(limit));
    res.json({ success: true, data: { blogs, total, page: Number(page), totalPages: Math.ceil(total/limit) } });
  } catch (err) { next(err); }
};

// @GET /api/admin/blogs/:id
exports.getBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author', 'name email');
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, data: { blog } });
  } catch (err) { next(err); }
};

// @PUT /api/admin/blogs/:id
exports.updateBlog = async (req, res, next) => {
  try {
    const update = { ...req.body, updatedBy: req.user._id };
    const blog = await Blog.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    if (blog.status === 'PUBLISHED' && !blog.publishedAt) blog.publishedAt = new Date();
    await blog.save();
    res.json({ success: true, message: 'Blog updated', data: { blog } });
  } catch (err) { next(err); }
};

// @DELETE /api/admin/blogs/:id
exports.deleteBlog = async (req, res, next) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.json({ success: true, message: 'Blog deleted' });
  } catch (err) { next(err); }
};

// @POST /api/admin/blogs/:id/hero (multipart form-data file: image)
exports.uploadBlogHero = async (req, res, next) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const url = req.file.path || req.file.secure_url || req.file.url;
    const publicId = req.file.filename || req.file.public_id || req.file.publicId;
    blog.heroImage = { url, publicId };
    await blog.save();
    res.json({ success: true, message: 'Hero image uploaded', data: { blog } });
  } catch (err) { next(err); }
};

// @GET /api/admin/reconciliation/report
exports.getReconciliationReport = async (req, res, next) => {
  try {
    const report = await reconciliationService.runReconciliationCheck();
    res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
};

// @POST /api/admin/reconciliation/fix/:bookingId
exports.fixReconciliationIssue = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const payment = await Payment.findOne({ booking: bookingId, status: 'SUCCESS' });
    if (payment && normalizePaymentStatus(booking.paymentStatus) !== PAYMENT_STATUS.PAID) {
      booking.paymentStatus = PAYMENT_STATUS.PAID;
      await booking.save();
      return res.json({ success: true, message: 'Booking status synchronized with payment.' });
    }

    res.status(400).json({ success: false, message: 'No automated fix available for this issue.' });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  OPERATIONAL ADMIN ENDPOINTS
// ─────────────────────────────────────────────────────────────

// @GET /api/admin/bookings/unpaid-completed
// Lists completed bookings where payment has not been received
exports.getUnpaidCompletedBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const filter = {
      status: { $in: [BOOKING_STATUS.COMPLETED, 'completed', 'COMPLETED'] },
      paymentStatus: { $nin: [PAYMENT_STATUS.PAID, 'paid', 'PAID', PAYMENT_STATUS.COLLECTED, 'COLLECTED', 'collected'] },
    };
    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('patient', 'name email phone')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name email phone' } })
      .populate('service', 'name slug')
      .sort({ completedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const now = new Date();
    const enriched = bookings.map(b => ({
      ...b,
      ageHours: b.completedAt ? Math.round((now - new Date(b.completedAt)) / 3600000) : null,
      paymentStatusNormalized: normalizePaymentStatus(b.paymentStatus),
    }));

    res.json({ success: true, data: { bookings: enriched, total, page: Number(page), totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

// @GET /api/admin/disputes
// Lists bookings where a cash dispute has been raised by the patient
exports.getDisputes = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, resolved } = req.query;
    const filter = { disputeRaised: true };
    // If resolved=true query param, show only confirmed (patient accepted after initial dispute)
    // Currently we have no resolution tracking so we just surface all disputed
    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('patient', 'name email phone')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name email phone' } })
      .populate('service', 'name slug')
      .sort({ updatedAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    res.json({ success: true, data: { bookings, total, page: Number(page), totalPages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

// @GET /api/admin/bookings/stuck
// Lists bookings stuck in operational states past expected thresholds
exports.getStuckBookings = async (req, res, next) => {
  try {
    const now = new Date();

    // REQUESTED bookings past their expiry window
    const expiredRequested = await Booking.find({
      status: { $in: [BOOKING_STATUS.REQUESTED, 'REQUESTED', 'pending', 'PENDING'] },
      expiresAt: { $lt: now },
    }).populate('patient', 'name phone').populate({ path: 'provider', populate: { path: 'user', select: 'name phone' } }).lean();

    // CONFIRMED bookings with PENDING payment older than 24h
    const staleCutoff24h = new Date(now - 24 * 60 * 60 * 1000);
    const unpaidConfirmed = await Booking.find({
      status: { $in: [BOOKING_STATUS.CONFIRMED, 'CONFIRMED', 'confirmed', 'accepted', 'ACCEPTED'] },
      paymentStatus: { $nin: [PAYMENT_STATUS.PAID, 'PAID', 'paid', PAYMENT_STATUS.COLLECTED, 'COLLECTED'] },
      updatedAt: { $lt: staleCutoff24h },
    }).populate('patient', 'name phone').populate({ path: 'provider', populate: { path: 'user', select: 'name phone' } }).lean();

    // IN_PROGRESS bookings running for more than 12h
    const staleCutoff12h = new Date(now - 12 * 60 * 60 * 1000);
    const longRunning = await Booking.find({
      status: { $in: [BOOKING_STATUS.IN_PROGRESS, 'IN_PROGRESS', 'in-progress', 'in_progress', 'started', 'STARTED'] },
      startedAt: { $lt: staleCutoff12h },
    }).populate('patient', 'name phone').populate({ path: 'provider', populate: { path: 'user', select: 'name phone' } }).lean();

    // COMPLETED but unpaid for more than 48h
    const staleCutoff48h = new Date(now - 48 * 60 * 60 * 1000);
    const unpaidCompleted = await Booking.find({
      status: { $in: [BOOKING_STATUS.COMPLETED, 'COMPLETED', 'completed'] },
      paymentStatus: { $nin: [PAYMENT_STATUS.PAID, 'PAID', 'paid', PAYMENT_STATUS.COLLECTED, 'COLLECTED', 'collected'] },
      completedAt: { $lt: staleCutoff48h },
    }).populate('patient', 'name phone').populate({ path: 'provider', populate: { path: 'user', select: 'name phone' } }).lean();

    res.json({
      success: true,
      data: {
        summary: {
          expiredRequested: expiredRequested.length,
          unpaidConfirmed: unpaidConfirmed.length,
          longRunningInProgress: longRunning.length,
          unpaidCompleted: unpaidCompleted.length,
          totalAlerts: expiredRequested.length + unpaidConfirmed.length + longRunning.length + unpaidCompleted.length,
        },
        expiredRequested,
        unpaidConfirmed,
        longRunning,
        unpaidCompleted,
      },
    });
  } catch (err) { next(err); }
};

// ─────────────────────────────────────────────────────────────
//  DISPUTE RESOLUTION — Phase 2
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/admin/disputes/:id/resolve
 *
 * Resolution types:
 *   APPROVE_PROVIDER  — credit provider full amount, mark PAID
 *   REJECT_PROVIDER   — no payout, mark closed (stays DISPUTED)
 *   PARTIAL_SETTLEMENT — credit approvedAmount, mark resolved
 *
 * Idempotency: checks for existing CREDIT transaction before any payout.
 * Audit trail: writes complete resolution record to booking.disputeResolution.
 */
exports.resolveDispute = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { resolutionType, adminNotes, approvedAmount } = req.body;

    const VALID_TYPES = ['APPROVE_PROVIDER', 'REJECT_PROVIDER', 'PARTIAL_SETTLEMENT'];
    if (!resolutionType || !VALID_TYPES.includes(resolutionType)) {
      return res.status(400).json({
        success: false,
        message: `resolutionType must be one of: ${VALID_TYPES.join(', ')}`,
      });
    }

    if (resolutionType === 'PARTIAL_SETTLEMENT') {
      const amt = Number(approvedAmount);
      if (!amt || amt <= 0) {
        return res.status(400).json({ success: false, message: 'approvedAmount is required and must be > 0 for PARTIAL_SETTLEMENT' });
      }
    }

    const Wallet = require('../models/Wallet');
    const Transaction = require('../models/Transaction');
    const Notification = require('../models/Notification');

    const booking = await Booking.findById(id)
      .populate('patient', 'name phone _id')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name phone _id' } });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Idempotency: already resolved → return current state
    if (booking.disputeResolution?.disputeResolved === true) {
      return res.status(200).json({
        success: true,
        message: 'Dispute already resolved. No changes made.',
        data: booking,
      });
    }

    if (!booking.disputeRaised) {
      return res.status(400).json({ success: false, message: 'No dispute has been raised on this booking.' });
    }

    const mongoose = require('mongoose');
    const session = await mongoose.startSession();

    try {
      session.startTransaction();

      // ── Build the audit trail record ──────────────────────────────────────
      const resolution = {
        resolvedBy: req.user._id,
        resolvedAt: new Date(),
        resolutionType,
        adminNotes: adminNotes || '',
        originalCollectedAmount: booking.collectedAmount || booking.totalAmount || 0,
        approvedAmount: resolutionType === 'PARTIAL_SETTLEMENT' ? Number(approvedAmount) : undefined,
        disputeResolved: true,
      };

      // ── APPROVE_PROVIDER ──────────────────────────────────────────────────
      if (resolutionType === 'APPROVE_PROVIDER') {
        // Check idempotency before any credit
        const existingTx = await Transaction.findOne({
          referenceId: booking._id,
          referenceType: 'Booking',
          type: 'CREDIT',
        }).session(session);

        if (!existingTx) {
          const provider = booking.provider;
          const providerUserId = provider?.user?._id || provider?.user;

          if (providerUserId) {
            const platformFee = booking.platformFee || Math.round((booking.totalAmount || 0) * 0.2);
            const netAmount = (booking.collectedAmount || booking.totalAmount || 0) - platformFee;

            const providerWallet = await Wallet.findOneAndUpdate(
              { user: providerUserId },
              { $inc: { balance: netAmount } },
              { new: true, upsert: true, session }
            );

            await Transaction.create([{
              wallet: providerWallet._id,
              type: 'CREDIT',
              amount: netAmount,
              description: `Dispute Approved — Provider credited (Booking: ${booking._id})`,
              referenceType: 'Booking',
              referenceId: booking._id,
            }], { session });

            console.info(`[resolveDispute] APPROVE_PROVIDER: credited ₹${netAmount} for booking ${booking._id}`);
          }
        } else {
          console.warn(`[resolveDispute] APPROVE_PROVIDER: duplicate credit prevented for booking ${booking._id}`);
        }

        booking.status = BOOKING_STATUS.PAID;
        booking.paymentStatus = PAYMENT_STATUS.PAID;
        booking.patientConfirmed = true;
        booking.patientConfirmedAt = booking.patientConfirmedAt || new Date();

      // ── REJECT_PROVIDER ───────────────────────────────────────────────────
      } else if (resolutionType === 'REJECT_PROVIDER') {
        // No wallet credit. Booking stays COLLECTED/DISPUTED, just mark resolved.
        booking.paymentStatus = 'DISPUTED'; // stays disputed, no payout
        console.info(`[resolveDispute] REJECT_PROVIDER: no credit for booking ${booking._id}`);

      // ── PARTIAL_SETTLEMENT ────────────────────────────────────────────────
      } else if (resolutionType === 'PARTIAL_SETTLEMENT') {
        const settlementAmount = Number(approvedAmount);

        // Idempotency check
        const existingTx = await Transaction.findOne({
          referenceId: booking._id,
          referenceType: 'Booking',
          type: 'CREDIT',
        }).session(session);

        if (!existingTx) {
          const provider = booking.provider;
          const providerUserId = provider?.user?._id || provider?.user;

          if (providerUserId) {
            const providerWallet = await Wallet.findOneAndUpdate(
              { user: providerUserId },
              { $inc: { balance: settlementAmount } },
              { new: true, upsert: true, session }
            );

            await Transaction.create([{
              wallet: providerWallet._id,
              type: 'CREDIT',
              amount: settlementAmount,
              description: `Partial Settlement — Dispute resolved (Booking: ${booking._id})`,
              referenceType: 'Booking',
              referenceId: booking._id,
            }], { session });

            console.info(`[resolveDispute] PARTIAL_SETTLEMENT: credited ₹${settlementAmount} for booking ${booking._id}`);
          }
        } else {
          console.warn(`[resolveDispute] PARTIAL_SETTLEMENT: duplicate credit prevented for booking ${booking._id}`);
        }

        // Mark booking resolved — partial means we settle at approved amount
        booking.status = BOOKING_STATUS.PAID;
        booking.paymentStatus = PAYMENT_STATUS.PAID;
      }

      // ── Write audit trail ────────────────────────────────────────────────
      booking.disputeResolution = resolution;
      await booking.save({ session });

      await session.commitTransaction();
      session.endSession();
    } catch (txErr) {
      await session.abortTransaction();
      session.endSession();
      throw txErr;
    }

    // ── Notify patient and provider (best-effort, outside transaction) ──────
    try {
      const patientMsg = {
        APPROVE_PROVIDER: 'Your payment dispute has been reviewed. Admin confirmed the provider\'s collection was valid.',
        REJECT_PROVIDER: 'Your payment dispute has been reviewed. Admin has noted the discrepancy. No provider payment was made.',
        PARTIAL_SETTLEMENT: `Your payment dispute has been reviewed. Admin approved a partial settlement of ₹${approvedAmount}.`,
      }[resolutionType];

      const providerMsg = {
        APPROVE_PROVIDER: `Your disputed payment for booking #${booking._id.toString().slice(-6).toUpperCase()} has been approved. Your wallet has been credited.`,
        REJECT_PROVIDER: `Your disputed payment for booking #${booking._id.toString().slice(-6).toUpperCase()} was rejected by admin. No credit was issued.`,
        PARTIAL_SETTLEMENT: `Partial settlement approved for booking #${booking._id.toString().slice(-6).toUpperCase()}. ₹${approvedAmount} credited to your wallet.`,
      }[resolutionType];

      const providerUserId = booking.provider?.user?._id || booking.provider?.user;

      await Promise.allSettled([
        Notification.create({
          user: booking.patient._id || booking.patient,
          title: 'Payment dispute resolved',
          message: patientMsg,
          type: 'PAYMENT',
          linkId: booking._id,
        }),
        providerUserId && Notification.create({
          user: providerUserId,
          title: 'Dispute resolution',
          message: providerMsg,
          type: 'PAYMENT',
          linkId: booking._id,
        }),
      ].filter(Boolean));
      
      // 📧 Send Dispute Resolved Emails
      try {
        const patientUser = booking.patient;
        if (patientUser && patientUser.email) {
          emailService.sendDisputeResolved(
            patientUser.email,
            patientUser.name,
            booking._id,
            resolutionType,
            resolutionType === 'PARTIAL_SETTLEMENT' ? approvedAmount : null
          );
        }
      } catch (e) { console.error('Failed to send dispute resolved email', e); }

    } catch (e) {
      console.warn('[resolveDispute] notification failed', e?.message);
    }

    const updated = await Booking.findById(id)
      .populate('patient', 'name phone')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name phone' } })
      .populate('disputeResolution.resolvedBy', 'name')
      .lean();

    res.json({
      success: true,
      message: `Dispute resolved: ${resolutionType}`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// @GET /api/admin/disputes/resolved
// Lists disputes that have been resolved by admin
exports.getResolvedDisputes = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const filter = {
      disputeRaised: true,
      'disputeResolution.disputeResolved': true,
    };

    const total = await Booking.countDocuments(filter);
    const bookings = await Booking.find(filter)
      .populate('patient', 'name phone email')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name phone' } })
      .populate('disputeResolution.resolvedBy', 'name')
      .sort({ 'disputeResolution.resolvedAt': -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    res.json({
      success: true,
      data: { bookings, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
};

// @POST /api/admin/test-email
// Admin endpoint to test email delivery
exports.testEmail = async (req, res, next) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ success: false, message: 'Recipient email required' });
    
    await emailService.sendWelcome(to, 'Admin Test User');
    res.json({ success: true, message: 'Test email dispatched' });
  } catch (err) { next(err); }
};
