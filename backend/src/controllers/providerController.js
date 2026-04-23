const Provider = require('../models/Provider');
const Service = require('../models/Service');
const ServiceAssignment = require('../models/ServiceAssignment');
const PatientSubscription = require('../models/PatientSubscription');
const PatientPackage = require('../models/PatientPackage');

// @GET /api/providers?service=nurse&pincode=400001
exports.getProviders = async (req, res, next) => {
  try {
    const { service, pincode, page = 1, limit = 12 } = req.query;
    const filter = { isVerified: true, isOnline: true, isBlocked: { $ne: true } };

    if (service) filter.services = service;
    if (pincode) filter.pincodesServed = pincode;

    const total = await Provider.countDocuments(filter);
    const providers = await Provider.find(filter)
      .populate('user', 'name email phone')
      .sort({ rating: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    res.json({
      success: true,
      data: { providers, total, page: Number(page), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// @GET /api/providers/:id
exports.getProviderById = async (req, res, next) => {
  try {
    const provider = await Provider.findById(req.params.id).populate('user', 'name email phone');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    res.json({ success: true, data: { provider } });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/providers/availability — toggle online/offline
exports.toggleAvailability = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ user: req.user._id });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });

    provider.isOnline = !provider.isOnline;
    await provider.save();

    res.json({
      success: true,
      message: `You are now ${provider.isOnline ? 'online' : 'offline'}`,
      data: { isOnline: provider.isOnline },
    });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/providers/profile — update provider profile
exports.updateProviderProfile = async (req, res, next) => {
  try {
    const { bio, experience, pincodesServed, pricePerHour, services, markup } = req.body;
    const provider = await Provider.findOneAndUpdate(
      { user: req.user._id },
      { bio, experience, pincodesServed, pricePerHour, services, markup },
      { new: true, runValidators: true }
    ).populate('user', 'name email phone avatar');

    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });
    res.json({ success: true, data: { provider } });
  } catch (err) {
    next(err);
  }
};

// @GET /api/services
exports.getServices = async (req, res, next) => {
  try {
    const services = await Service.find({ isActive: true });
    res.json({ success: true, data: { services } });
  } catch (err) {
    next(err);
  }
};

// @GET /api/providers/me/assignments
exports.getAssignments = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ user: req.user._id });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    const assignments = await ServiceAssignment.find({ provider: provider._id })
      .populate('patient', 'name email phone avatar address pincode')
      .populate({ path: 'referenceId' })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { assignments } });
  } catch (err) { next(err); }
};

// @PUT /api/providers/me/assignments/:id
exports.updateAssignmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // 'ACCEPTED' | 'REJECTED'
    const assignment = await ServiceAssignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Assignment not found' });
    
    // Authorization check
    const provider = await Provider.findOne({ user: req.user._id });
    if (assignment.provider.toString() !== provider._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (assignment.status !== 'PENDING') {
      return res.status(400).json({ success: false, message: 'Assignment is already processed' });
    }

    assignment.status = status;
    await assignment.save();

    if (status === 'ACCEPTED') {
      // Activate the subscription or package
      if (assignment.type === 'SUBSCRIPTION') {
         await PatientSubscription.findByIdAndUpdate(assignment.referenceId, {
            status: 'ACTIVE',
            provider: provider._id,
            startDate: new Date()
         });
      } else {
         const patientPkg = await PatientPackage.findById(assignment.referenceId).populate('package');
         const expiryDate = new Date();
         expiryDate.setDate(expiryDate.getDate() + patientPkg.package.validityDays);
         await PatientPackage.findByIdAndUpdate(assignment.referenceId, {
            status: 'ACTIVE',
            provider: provider._id,
            startDate: new Date(),
            expiryDate
         });
      }
    } else {
      // If rejected, set package back to PENDING_ASSIGNMENT for admin if needed, 
      // but actually we don't change the package status, it remains PENDING_ASSIGNMENT.
      if (assignment.type === 'SUBSCRIPTION') {
         await PatientSubscription.findByIdAndUpdate(assignment.referenceId, { status: 'PENDING_ASSIGNMENT' });
      } else {
         await PatientPackage.findByIdAndUpdate(assignment.referenceId, { status: 'PENDING_ASSIGNMENT' });
      }
    }

    res.json({ success: true, message: `Assignment ${status.toLowerCase()}`, data: { assignment } });
  } catch (err) { next(err); }
};
