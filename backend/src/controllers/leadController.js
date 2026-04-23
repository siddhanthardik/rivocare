const ProviderLead = require('../models/ProviderLead');
const Provider = require('../models/Provider');
const ServiceablePincode = require('../models/ServiceablePincode');

// ─────────────────────────────────────────────────────────────────────────────
// @POST /api/providers/lead  (PUBLIC — no auth required)
// Capture interest from a prospective provider
// ─────────────────────────────────────────────────────────────────────────────
exports.captureProviderLead = async (req, res, next) => {
  try {
    const { name, phone, email, serviceType, pincode, city, experience, source, referralCode } = req.body;

    if (!name || !phone || !serviceType || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, serviceType, and pincode are required',
      });
    }

    // Deduplicate: same phone + pincode = don't create a second lead
    const existing = await ProviderLead.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'A lead with this phone number already exists. Our team will reach out soon!',
      });
    }

    // Resolve referral
    let referredBy = null;
    if (referralCode) {
      const referrer = await Provider.findOne({ referralCode: referralCode.trim().toUpperCase() });
      if (referrer) referredBy = referrer._id;
    }

    const lead = await ProviderLead.create({
      name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
      serviceType,
      pincode: pincode.trim(),
      city: city?.trim() || '',
      experience: Number(experience) || 0,
      source: source || 'WEBSITE',
      referredBy,
      referralCode: referralCode || null,
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Our team will contact you within 24 hours to get you started.',
      data: { leadId: lead._id },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @GET /api/admin/leads  (Admin only)
// List all provider leads with filters
// ─────────────────────────────────────────────────────────────────────────────
exports.getProviderLeads = async (req, res, next) => {
  try {
    const { status, source, pincode, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (source) filter.source = source;
    if (pincode) filter.pincode = pincode;

    const total = await ProviderLead.countDocuments(filter);
    const leads = await ProviderLead.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('referredBy', 'user')
      .lean();

    // Stats summary
    const [totalNew, totalContacted, totalOnboarded, totalRejected] = await Promise.all([
      ProviderLead.countDocuments({ status: 'NEW' }),
      ProviderLead.countDocuments({ status: 'CONTACTED' }),
      ProviderLead.countDocuments({ status: 'ONBOARDED' }),
      ProviderLead.countDocuments({ status: 'REJECTED' }),
    ]);

    const conversionRate = total > 0 ? Math.round((totalOnboarded / total) * 100) : 0;

    res.json({
      success: true,
      data: {
        leads,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
        stats: {
          total,
          new: totalNew,
          contacted: totalContacted,
          onboarded: totalOnboarded,
          rejected: totalRejected,
          conversionRate,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @PUT /api/admin/leads/:id  (Admin only)
// Update lead status + notes
// ─────────────────────────────────────────────────────────────────────────────
exports.updateLeadStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const validStatuses = ['NEW', 'CONTACTED', 'ONBOARDED', 'REJECTED'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const lead = await ProviderLead.findByIdAndUpdate(
      req.params.id,
      { ...(status && { status }), ...(notes !== undefined && { notes }) },
      { new: true }
    );
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    res.json({ success: true, message: 'Lead updated', data: { lead } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @PUT /api/admin/providers/:id/onboarding-status  (Admin only)
// Update provider onboarding status and auto-activate
// ─────────────────────────────────────────────────────────────────────────────
exports.updateProviderOnboardingStatus = async (req, res, next) => {
  try {
    const { onboardingStatus } = req.body;
    const validStatuses = ['INCOMPLETE', 'KYC_PENDING', 'VERIFIED', 'ACTIVE'];
    if (!validStatuses.includes(onboardingStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid onboardingStatus' });
    }

    const provider = await Provider.findById(req.params.id);
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    provider.onboardingStatus = onboardingStatus;

    // Auto-set isVerified when status reaches VERIFIED or ACTIVE
    if (onboardingStatus === 'VERIFIED' || onboardingStatus === 'ACTIVE') {
      provider.isVerified = true;
    }

    // ACTIVE = KYC verified + availability ON
    if (onboardingStatus === 'ACTIVE') {
      provider.isAvailable = true;
      provider.isOnline = true;
    }

    await provider.save();

    await provider.populate('user', 'name email phone');

    res.json({
      success: true,
      message: `Provider onboarding status set to ${onboardingStatus}`,
      data: { provider },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @GET /api/admin/supply-gaps  (Admin only)
// Show pincodes with demand but low provider supply
// ─────────────────────────────────────────────────────────────────────────────
exports.getSupplyGaps = async (req, res, next) => {
  try {
    const Booking = require('../models/Booking');

    // Get booking demand by pincode (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const demandByPincode = await Booking.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$pincode', bookingCount: { $sum: 1 } } },
      { $sort: { bookingCount: -1 } },
    ]);

    // Count active providers per pincode
    const providersByPincode = await Provider.aggregate([
      { $match: { isVerified: true, isOnline: true } },
      { $unwind: '$pincodesServed' },
      { $group: { _id: '$pincodesServed', providerCount: { $sum: 1 } } },
    ]);

    const pincodeMap = {};
    providersByPincode.forEach((p) => { pincodeMap[p._id] = p.providerCount; });

    // Combine: find pincodes with demand but few/no providers
    const gaps = demandByPincode.map((d) => ({
      pincode: d._id,
      bookings: d.bookingCount,
      activeProviders: pincodeMap[d._id] || 0,
      gap: d.bookingCount - (pincodeMap[d._id] || 0) * 3, // rough gap metric
      severity: (pincodeMap[d._id] || 0) === 0 ? 'CRITICAL' : (pincodeMap[d._id] || 0) < 2 ? 'HIGH' : 'MODERATE',
    })).filter((d) => d.gap > 0)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 20);

    // Active provider stats
    const totalActive = await Provider.countDocuments({ isVerified: true, isOnline: true });
    const totalVerified = await Provider.countDocuments({ isVerified: true });
    const totalIncomplete = await Provider.countDocuments({ onboardingStatus: 'INCOMPLETE' });
    const totalKycPending = await Provider.countDocuments({ onboardingStatus: 'KYC_PENDING' });

    res.json({
      success: true,
      data: {
        gaps,
        providerStats: { totalActive, totalVerified, totalIncomplete, totalKycPending },
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @GET /api/providers/my-referral  (Provider only)
// Get provider's own referral code + stats
// ─────────────────────────────────────────────────────────────────────────────
exports.getMyReferral = async (req, res, next) => {
  try {
    let provider = await Provider.findOne({ user: req.user._id });
    if (!provider) return res.status(404).json({ success: false, message: 'Provider profile not found' });

    // Generate referral code if not set
    if (!provider.referralCode) {
      const code = `CARE${req.user.name.slice(0, 3).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      provider.referralCode = code;
      await provider.save();
    }

    // How many leads used this code
    const referralLeads = await ProviderLead.countDocuments({ referralCode: provider.referralCode });
    const onboardedViaReferral = await ProviderLead.countDocuments({
      referralCode: provider.referralCode,
      status: 'ONBOARDED',
    });

    res.json({
      success: true,
      data: {
        referralCode: provider.referralCode,
        referralLink: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/join?ref=${provider.referralCode}`,
        totalLeads: referralLeads,
        onboarded: onboardedViaReferral,
      },
    });
  } catch (err) {
    next(err);
  }
};
