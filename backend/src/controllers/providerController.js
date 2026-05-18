const mongoose = require('mongoose');
const Provider = require('../models/Provider');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const ServiceAssignment = require('../models/ServiceAssignment');
const PatientSubscription = require('../models/PatientSubscription');
const PatientPackage = require('../models/PatientPackage');
const { calculateProviderScore, resolvePincode } = require('../services/matchingEngine');
const { getProviderEarningsSnapshot } = require('../services/providerEarningsService');
const { BOOKING_STATUS, normalizeBookingStatus } = require('../constants/bookingStatus');
const emailService = require('../services/emailService');

// ── Onboarding progress calculator ────────────────────────────────────────────
const calcOnboardingProgress = (p, user) => {
  let pct = 0;
  if (user && user.name && p.bio && p.profession) pct += 20;  // profile
  if (p.kycDetails && p.kycDetails.aadhaarUrl && p.kycDetails.panUrl && p.kycDetails.bankAccount) pct += 20; // kyc uploaded
  if (p.professionalDocs && p.professionalDocs.length > 0) pct += 30; // docs
  if (p.declaration && p.declaration.accepted) pct += 10;   // declaration
  if (p.onboardingStatus === 'ACTIVE') pct += 20;            // admin approved
  return Math.min(pct, 100);
};

exports.calcOnboardingProgress = calcOnboardingProgress;

// @GET /api/providers?service=nurse&pincode=400001
exports.getProviders = async (req, res, next) => {
  try {
    const { service, pincode, page = 1, limit = 12 } = req.query;
    // Scoring and matching

    const filter = { isVerified: true, isBlocked: { $ne: true } }; 

    let serviceId = null;
    if (service) {
      if (mongoose.Types.ObjectId.isValid(service)) {
        serviceId = service;
      } else {
        const sDoc = await Service.findOne({ 
          $or: [
            { name: { $regex: new RegExp(`^${service}$`, 'i') } },
            { slug: String(service).toLowerCase() }
          ]
        });
        if (sDoc) serviceId = sDoc._id;
      }
      if (serviceId) filter.services = serviceId;
    }

    // 🚀 Broad fetch for scoring
    let rawProviders = await Provider.find(filter)
      .populate('user', 'name email phone avatar')
      .lean();

    // Perform scoring

    // 🧩 STEP 4: ADD FALLBACK
    if (rawProviders.length === 0) {
      console.warn("[MATCH_DEBUG] No exact service match, using fallback (all verified providers)");
      rawProviders = await Provider.find({ isVerified: true, isBlocked: { $ne: true } })
        .limit(10)
        .populate('user', 'name email phone avatar')
        .lean();
    }

    const targetCoords = resolvePincode(pincode);
    
    // 🧮 Score and Rank
    const scoredProviders = rawProviders.map(p => {
      const isExactMatch = p.pincodesServed && p.pincodesServed.includes(String(pincode));
      const { score, distance } = calculateProviderScore(p, targetCoords, isExactMatch);
      
      return {
        ...p,
        matchScore: score,
        distance: parseFloat(distance.toFixed(2)),
        isExactMatch,
        tier: isExactMatch ? 'EXACT' : (distance < 10 ? 'NEARBY' : 'FLEXIBLE')
      };
    });

    // Sort by score descending
    scoredProviders.sort((a, b) => b.matchScore - a.matchScore);

    // Paginate in-memory
    const startIndex = (Number(page) - 1) * Number(limit);
    const paginatedProviders = scoredProviders.slice(startIndex, startIndex + Number(limit));

    res.json({
      success: true,
      data: { 
        providers: paginatedProviders, 
        total: scoredProviders.length, 
        page: Number(page), 
        totalPages: Math.ceil(scoredProviders.length / limit),
        metadata: {
          searchCoords: targetCoords,
          tierCounts: {
            exact: scoredProviders.filter(p => p.tier === 'EXACT').length,
            nearby: scoredProviders.filter(p => p.tier === 'NEARBY').length,
            flexible: scoredProviders.filter(p => p.tier === 'FLEXIBLE').length
          }
        }
      },
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

// @GET /api/providers/me — authenticated provider fetches their own full profile
exports.getMyProfile = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ user: req.user._id })
      .populate('user', 'name email phone avatar');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });
    res.json({ success: true, data: { provider } });
  } catch (err) {
    next(err);
  }
};

exports.getDashboard = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ user: req.user._id })
      .populate('user', 'name email phone avatar');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });

    const bookings = await Booking.find({ provider: provider._id })
      .populate('patient', 'name avatar')
      .populate('service', 'name slug')
      .sort({ scheduledAt: 1 });

    const completedBookings = bookings.filter((booking) => normalizeBookingStatus(booking.status) === BOOKING_STATUS.COMPLETED);
    const cancelledBookings = bookings.filter((booking) => normalizeBookingStatus(booking.status) === BOOKING_STATUS.CANCELLED);
    const today = new Date();
    const todayVisits = bookings.filter((booking) => {
      if (!booking.scheduledAt) return false;
      const scheduledAt = new Date(booking.scheduledAt);
      return (
        normalizeBookingStatus(booking.status) !== BOOKING_STATUS.CANCELLED &&
        scheduledAt.getDate() === today.getDate() &&
        scheduledAt.getMonth() === today.getMonth() &&
        scheduledAt.getFullYear() === today.getFullYear()
      );
    });

    const earningsSnapshot = await getProviderEarningsSnapshot(provider._id);
    const completionBase = completedBookings.length + cancelledBookings.length;
    const completionRate = completionBase > 0 ? Math.round((completedBookings.length / completionBase) * 100) : 0;

    res.json({
      success: true,
      data: {
        provider,
        rating: Number(provider.rating.toFixed(1)),
        totalBookings: bookings.length,
        earnings: earningsSnapshot?.netEarnings || 0,
        completionRate,
        todayVisits,
      },
    });
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
    const { bio, experience, pincodesServed, services, markup, notes } = req.body;
    
    // 🛡️ Normalization
    const normalizedPincodes = (pincodesServed || []).map(p => String(p));
    let serviceIds = [];
    if (services && Array.isArray(services)) {
      const sDocs = await Service.find({ 
        $or: [
          { name: { $in: services.map(s => new RegExp(`^${s}$`, 'i')) } },
          { slug: { $in: services.map(s => String(s).toLowerCase()) } },
          { _id: { $in: services.filter(s => mongoose.Types.ObjectId.isValid(s)) } }
        ]
      });
      serviceIds = sDocs.map(s => s._id);
    }

    const provider = await Provider.findOneAndUpdate(
      { user: req.user._id },
      {
        bio,
        experience,
        pincodesServed: normalizedPincodes,
        services: serviceIds,
        markup,
        notes,
        isProfileComplete: true,
      },
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

// ─────────────────────────────────────────────────────────────
//  ONBOARDING ENDPOINTS
// ─────────────────────────────────────────────────────────────

// @PUT /api/providers/onboarding/profile — Step 1: save basic profile data
exports.saveOnboardingProfile = async (req, res, next) => {
  try {
    const { bio, experience, profession, languages, gender, pincodesServed, services, city, notes } = req.body;
    const User = require('../models/User');

    // Update User name/phone/city if provided
    if (req.body.name || req.body.phone || city) {
      await User.findByIdAndUpdate(req.user._id, {
        ...(req.body.name && { name: req.body.name }),
        ...(req.body.phone && { phone: req.body.phone }),
        ...(city && { city }),
      });
    }

    let serviceIds = [];
    if (services && Array.isArray(services) && services.length) {
      const sDocs = await Service.find({
        $or: [
          { _id: { $in: services.filter(s => mongoose.Types.ObjectId.isValid(s)) } },
          { slug: { $in: services.map(s => String(s).toLowerCase()) } },
          { name: { $in: services.map(s => new RegExp(`^${s}$`, 'i')) } },
        ],
      });
      serviceIds = sDocs.map(s => s._id);
    }

    const provider = await Provider.findOneAndUpdate(
      { user: req.user._id },
      {
        bio: bio || '',
        experience: Number(experience) || 0,
        profession: profession || '',
        languages: Array.isArray(languages) ? languages : [],
        gender: gender || 'Prefer not to say',
        pincodesServed: Array.isArray(pincodesServed) ? pincodesServed.map(String) : [],
        notes: notes || '',
        ...(serviceIds.length && { services: serviceIds }),
        isProfileComplete: true,
        // Advance status from INCOMPLETE/DRAFT if this is first save
        $set: {},
      },
      { new: true, runValidators: true, upsert: false }
    ).populate('user', 'name email phone avatar');

    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });

    // Move status forward from INCOMPLETE/DRAFT
    if (['INCOMPLETE', 'DRAFT'].includes(provider.onboardingStatus)) {
      provider.onboardingStatus = 'DRAFT';
      await provider.save();
    }

    const progress = calcOnboardingProgress(provider, provider.user);
    res.json({ success: true, data: { provider, progress } });
  } catch (err) { next(err); }
};

// @POST /api/providers/onboarding/kyc — Step 2: upload KYC documents
exports.submitOnboardingKYC = async (req, res, next) => {
  try {
    const { bankAccount, ifsc } = req.body;

    const provider = await Provider.findOne({ user: req.user._id });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });

    const kycUpdate = {
      bankAccount: bankAccount || provider.kycDetails?.bankAccount,
      ifsc: ifsc || provider.kycDetails?.ifsc,
      status: 'PENDING',
    };

    if (req.files?.aadhaar?.[0]) kycUpdate.aadhaarUrl = req.files.aadhaar[0].path;
    if (req.files?.pan?.[0])    kycUpdate.panUrl = req.files.pan[0].path;
    if (req.files?.cheque?.[0]) kycUpdate.chequeUrl = req.files.cheque[0].path;

    provider.kycDetails = { ...provider.kycDetails?.toObject?.() || {}, ...kycUpdate };
    await provider.save();

    await provider.populate('user', 'name email');
    const progress = calcOnboardingProgress(provider, provider.user);
    res.json({ success: true, message: 'KYC documents saved', data: { provider, progress } });
  } catch (err) { next(err); }
};

// @POST /api/providers/onboarding/documents — Step 3: upload professional docs
exports.submitOnboardingDocs = async (req, res, next) => {
  try {
    const { documentType } = req.body;
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const provider = await Provider.findOne({ user: req.user._id });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });

    provider.professionalDocs.push({
      documentType: documentType || 'OTHER',
      fileUrl: req.file.path,
      uploadedAt: new Date(),
      status: 'PENDING',
    });
    await provider.save();

    // Optional: upload police verification
    if (documentType === 'POLICE_VERIFICATION') {
      provider.policeVerificationUrl = req.file.path;
      provider.policeVerificationStatus = 'PENDING';
      await provider.save();
    }

    await provider.populate('user', 'name email');
    const progress = calcOnboardingProgress(provider, provider.user);
    res.json({ success: true, message: 'Document uploaded', data: { provider, progress } });
  } catch (err) { next(err); }
};

// @POST /api/providers/onboarding/submit — Step 4+: accept declaration and submit for review
exports.submitDeclaration = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ user: req.user._id }).populate('user', 'name email');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });

    if (!provider.isProfileComplete) {
      return res.status(400).json({ success: false, message: 'Please complete your basic profile first' });
    }

    provider.declaration = { accepted: true, acceptedAt: new Date() };
    provider.onboardingStatus = 'PENDING_VERIFICATION';
    await provider.save();

    // Email provider and admins
    try {
      emailService.sendOnboardingSubmitted(provider.user.email, provider.user.name);
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin' }).select('email name');
      admins.forEach(a => emailService.sendAdminOnboardingAlert(a.email, provider.user.name));
    } catch (e) { console.error('Onboarding email failed', e); }

    const progress = calcOnboardingProgress(provider, provider.user);
    res.json({ success: true, message: 'Submitted for verification. You will be notified within 24 hours.', data: { provider, progress } });
  } catch (err) { next(err); }
};

// @GET /api/providers/onboarding/status — get current onboarding state + progress
exports.getOnboardingStatus = async (req, res, next) => {
  try {
    const provider = await Provider.findOne({ user: req.user._id }).populate('user', 'name email phone avatar');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });

    const progress = calcOnboardingProgress(provider, provider.user);

    // Determine next step
    let nextStep = null;
    if (!provider.isProfileComplete) nextStep = 'profile';
    else if (!provider.kycDetails?.aadhaarUrl) nextStep = 'kyc';
    else if (!provider.professionalDocs?.length) nextStep = 'documents';
    else if (!provider.declaration?.accepted) nextStep = 'declaration';
    else if (provider.onboardingStatus !== 'ACTIVE') nextStep = 'pending_review';

    res.json({ success: true, data: { provider, progress, nextStep } });
  } catch (err) { next(err); }
};
