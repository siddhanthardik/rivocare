const User = require('../models/User');
const Provider = require('../models/Provider');
const Booking = require('../models/Booking');
const FraudFlag = require('../models/FraudFlag');
const ServiceablePincode = require('../models/ServiceablePincode');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Package = require('../models/Package');
const PatientSubscription = require('../models/PatientSubscription');
const PatientPackage = require('../models/PatientPackage');
const ServiceAssignment = require('../models/ServiceAssignment');
const Service = require('../models/Service');

// @GET /api/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const [totalUsers, totalProviders, totalBookings, revenueAgg] = await Promise.all([
      User.countDocuments({ role: 'patient' }),
      Provider.countDocuments(),
      Booking.countDocuments(),
      Booking.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
    ]);

    const onlineProviders = await Provider.countDocuments({ isOnline: true });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
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
    const provider = await Provider.findByIdAndUpdate(
      req.params.id,
      { isVerified: req.body.isVerified },
      { new: true }
    ).populate('user', 'name email');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    res.json({ success: true, data: { provider } });
  } catch (err) {
    next(err);
  }
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
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.aggregate([
        { $match: { status: 'completed', paymentStatus: 'PAID' } },
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
          status: 'completed',
          paymentStatus: 'PAID',
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
          status: 'completed',
          paymentStatus: 'PAID',
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
      { $match: { status: 'completed', paymentStatus: 'PAID' } },
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
      { $match: { status: 'completed' } },
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
    if (booking.paymentStatus === 'PAID') {
      return res.status(400).json({ success: false, message: 'Cannot override price after payment has been made' });
    }

    // Cannot override cancelled booking
    if (booking.status === 'cancelled') {
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
