const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const Service = require('../models/Service');
const fraudService = require('../services/fraudService');
const { updateProviderEarnings } = require('../services/providerEarningsService');
const { maskPhone, maskAddress } = require('../utils/helpers');
const Notification = require('../models/Notification');
const socketHelper = require('../socket');
const ServiceablePincode = require('../models/ServiceablePincode');
const { cleanString } = require('../utils/sanitizeInput');
const { BOOKING_STATUS, PAYMENT_STATUS, VALID_BOOKING_TRANSITIONS, normalizeBookingStatus, normalizePaymentStatus } = require('../constants/bookingStatus');
const emailService = require('../services/emailService');
const { calculateVisitPricing } = require('../services/visitPricingService');
const generateOrderId = () => {
  return "ORD-" + Date.now().toString(36).toUpperCase();
};

const billingLogger = require('../utils/billingLogger');

// Safegaurd: Ensure SubscriptionPlan exists
try {
  require.resolve('../models/SubscriptionPlan');
} catch (e) {
  throw new Error("SubscriptionPlan model missing");
}

const formatBookingResponse = (booking, userRole) => {
  const b = booking.toObject ? booking.toObject() : booking;
  
  // Normalize current status
  const currentStatus = normalizeBookingStatus(b.status);
  
  if (userRole === 'provider' && ![BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETED].includes(currentStatus)) {
    if (b.patient && b.patient.phone) b.patient.phone = maskPhone(b.patient.phone);
    if (b.address) b.address = maskAddress(b.address);
  }

  // Add a normalized payment status to responses for safe standardization
  b.paymentStatusNormalized = normalizePaymentStatus(b.paymentStatus);

  // Ensure monetary fields are present and normalized for frontend
  const finalAmountVal = b.finalAmount || b.finalPrice || b.totalAmount || 0;
  if (typeof b.providerEarning !== 'number') {
    b.providerEarning = Math.round(finalAmountVal * 0.8);
  }
  if (typeof b.platformFee !== 'number') {
    b.platformFee = Math.round(finalAmountVal - b.providerEarning);
  }

  // Standardized normalizedStatus for frontend
  b.normalizedStatus = currentStatus.toUpperCase();
  
  return b;
};

// @POST /api/bookings
exports.createBooking = async (req, res, next) => {
  console.log('[BOOKING_AUDIT] Incoming Payload:', JSON.stringify(req.body, null, 2));
  
  try {
    const { providerId, service: serviceId, address, pincode, scheduledAt, durationHours, notes, testId, offeringId, planId } = req.body;
    const forbiddenPricingFields = ['price', 'amount', 'totalAmount', 'finalPrice', 'finalAmount', 'estimatedPrice', 'platformFee', 'providerEarning'];
    const tamperedField = forbiddenPricingFields.find((field) => req.body[field] !== undefined);
    if (tamperedField) {
      return res.status(400).json({
        success: false,
        message: `${tamperedField} is calculated by the server and cannot be supplied by the client.`,
      });
    }

    // 🛡️ Strict Field Validation
    if (!providerId || !serviceId || !address || !pincode || !scheduledAt) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required booking fields (provider, service, address, pincode, or schedule).' 
      });
    }

    // 🕒 Reject Past Bookings
    const bookingDate = new Date(scheduledAt);
    if (bookingDate < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create a booking for a past date or time.'
      });
    }

    // 📍 Service Area Validation
    const validPincode = await ServiceablePincode.findOne({ pincode, isActive: true });
    if (!validPincode) {
      return res.status(400).json({ success: false, message: 'We are not available in your area yet.' });
    }

    const Booking = require('../models/Booking');
    const Service = require('../models/Service');
    const User = require('../models/User');
    const Wallet = require('../models/Wallet');
    const Transaction = require('../models/Transaction');
    const Offering = require('../models/Offering');

    // 🧩 STEP 11: HARD FAIL SAFETY (Plan Required)
    if (!planId) {
      return res.status(400).json({
        success: false,
        error: "Plan is required for booking"
      });
    }

    // Determine price
    
    if (!planId) {
      return res.status(400).json({ success: false, error: "Plan ID is required" });
    }

    const plan = await Offering.findOne({ _id: planId, isActive: true });
    if (!plan) {
      console.error('[BOOKING_ERROR] Plan not found for ID:', planId);
      return res.status(404).json({ success: false, message: 'Selected plan no longer exists' });
    }

    // Resolve serviceId: accept either ObjectId or slug/name from client
    let resolvedServiceId = serviceId;
    try {
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(serviceId)) {
        // try to find by slug or name (case-insensitive)
        const maybe = await Service.findOne({ $or: [ { slug: serviceId }, { name: serviceId }, { label: serviceId } ] });
        if (maybe) resolvedServiceId = maybe._id;
        else {
          console.warn('[bookingController] Invalid service identifier received from client:', serviceId);
          return res.status(400).json({ success: false, message: 'Invalid service identifier' });
        }
      }
    } catch (e) {
      console.warn('[bookingController] Service resolution error:', e && e.message);
      return res.status(400).json({ success: false, message: 'Invalid service identifier' });
    }

    const serviceDoc = await Service.findById(resolvedServiceId);
    if (!serviceDoc) return res.status(404).json({ success: false, message: 'Service not found' });
    if (plan.service && plan.service.toString() !== serviceDoc._id.toString()) {
      return res.status(400).json({ success: false, message: 'Selected plan does not belong to this service' });
    }

    const provider = await Provider.findById(providerId);
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    if (provider.isBlocked) return res.status(403).json({ success: false, message: 'This provider is currently unavailable.' });
    if (!provider.isOnline) return res.status(400).json({ success: false, message: 'Provider is offline' });
    
    // Check if provider offers this service
    if (!provider.services.some(s => s.toString() === resolvedServiceId.toString())) {
      return res.status(400).json({ success: false, message: 'Provider does not offer this service' });
    }

    // Check for double-booking
    const scheduledDate = new Date(scheduledAt);
    const requestedDurationHours = Number(durationHours) || 1;
    const scheduledEnd = new Date(scheduledDate.getTime() + requestedDurationHours * 60 * 60 * 1000);

    const duplicatePatientBooking = await Booking.findOne({
      patient: req.user._id,
      scheduledAt: scheduledDate,
      status: { $in: [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS] },
    });
    if (duplicatePatientBooking) {
      return res.status(409).json({ success: false, message: 'Duplicate booking for this time slot' });
    }

    const conflict = await Booking.findOne({
      provider: providerId,
      scheduledAt: { $lt: scheduledEnd },
      status: { $in: [BOOKING_STATUS.REQUESTED, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS] },
      $expr: {
        $gt: [
          { $add: ['$scheduledAt', { $multiply: [{ $ifNull: ['$durationHours', 1] }, 60 * 60 * 1000] }] },
          scheduledDate,
        ],
      },
    });
    if (conflict) {
      return res.status(409).json({ success: false, message: 'Slot not available' });
    }

    // 🧩 STEP 2: REMOVE SERVICE PRICING COMPLETELY
    const baseServicePrice = Number(plan.price);
    if (!Number.isFinite(baseServicePrice) || baseServicePrice < 0) {
      return res.status(400).json({ success: false, message: 'Selected plan has invalid pricing' });
    }

    // Calculate Visit Pricing (Phase 1 Additive)
    const { visitCharge, distanceCharge, distanceTier, pricingBreakdown } = await calculateVisitPricing({
      serviceType: serviceDoc.name || serviceDoc.slug,
      city: 'Default', // Default for now
      serviceAmount: baseServicePrice,
      distanceKm: 0 // Distance engine not implemented yet
    });

    const totalAmountWithVisit = pricingBreakdown.totalAmount;

    const orderId = generateOrderId();
    const cleanAddress = cleanString(address, 500);
    const cleanNotes = cleanString(notes || '', 500);

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // 🧩 STEP 1: GUARANTEE BOOKING SUCCESS
    let booking;
    try {
      booking = await Booking.create({
        orderId,
        patient: req.user._id,
        provider: providerId,
        service: resolvedServiceId,
        offering: plan._id,
        planName: plan.name,
        price: baseServicePrice,
        address: cleanAddress,
        pincode,
        scheduledAt: scheduledDate,
        durationHours: requestedDurationHours,
        notes: cleanNotes,
        totalAmount: totalAmountWithVisit,
        finalAmount: totalAmountWithVisit,
        finalPrice: totalAmountWithVisit,
        planPrice: baseServicePrice,
        
        // Additive Phase 1 fields
        visitCharge,
        distanceCharge,
        distanceTier,
        travelDistanceKm: 0,
        pricingBreakdown,

        pricingSource: "PLAN",
        estimatedPrice: totalAmountWithVisit,
        platformFee: Math.round(totalAmountWithVisit * 0.2),
        providerEarning: Math.round(totalAmountWithVisit * 0.8),
        paymentStatus: "PENDING",
        status: BOOKING_STATUS.REQUESTED,
        expiresAt,
      });
      try {
        billingLogger.logBookingCreated({
          bookingId: booking._id && booking._id.toString(),
          userId: req.user._id && req.user._id.toString(),
          providerId: providerId && providerId.toString(),
          amount: booking.totalAmount,
          status: booking.status,
          requestId: req.requestId,
          ip: req.ip,
          endpoint: req.originalUrl,
          metadata: { orderId }
        });
      } catch (e) {}
    } catch (err) {
      console.error('❌ BOOKING CREATION FAILED:', err);
      return res.status(500).json({ success: false, message: 'Booking failed to save' });
    }

    // Update user profile if address or pincode is missing
    let userModified = false;
    if (!req.user.address) { req.user.address = cleanAddress; userModified = true; }
    if (!req.user.pincode) { req.user.pincode = pincode; userModified = true; }
    if (userModified) await req.user.save();

    await booking.populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'provider', populate: { path: 'user', select: 'name email phone' } },
    ]);

    // 🔔 Notify Provider
    const providerProjectedEarnings = Math.round(booking.totalAmount * 0.8);
    const notification = await Notification.create({
      user: provider.user,
      title: 'New Booking Request',
      message: `New booking near you! Earn ₹${providerProjectedEarnings} — Accept now.`,
      type: 'BOOKING',
      linkId: booking._id
    });
    // 🔔 REAL-TIME NOTIFICATIONS (Harden Emit)
    try {
      const io = socketHelper.getIO();
      if (!io) {
        console.error('❌ Socket IO not initialized');
      } else {
        const providerUserId = provider.user.toString();
        console.log('📡 Emitting new-booking to provider user room:', providerUserId);
        
        io.to(providerUserId).emit('new-booking', {
          bookingId: booking._id,
          message: `New booking request for ${serviceDoc.name}`,
          service: serviceDoc.name,
          scheduledAt: scheduledDate
        });

        // Add persistent notification log
        const Notification = require('../models/Notification');
        await Notification.create({
          user: provider.user,
          title: 'New Booking Request',
          message: `You have a new request for ${serviceDoc.name}.`,
          type: 'BOOKING_REQUEST',
          linkId: booking._id,
          status: 'SENT'
        });
      }
    } catch (e) {
      console.error('❌ Socket Notification Failed:', e.message);
    }

    // 📧 EMAIL NOTIFICATION (Fallback Wrap)
    try {
      const providerUser = await User.findById(provider.user);
      if (providerUser && providerUser.email) {
        await sendEmail({
          email: providerUser.email,
          subject: '⚡ New Booking Request — Action Required',
          message: `Hello ${providerUser.name},\n\nYou have received a new booking request for ${serviceDoc.name}.\n\nPlease log in to your RIVO dashboard within 30 minutes to accept.\n\nThank you,\nRIVO Team`
        });
        console.log('📧 Email alert sent to:', providerUser.email);
      }
    } catch (e) {
      console.error('❌ Email Alert Failed:', e.message);
    }

    res.status(201).json({ 
      success: true, 
      message: 'Booking created successfully', 
      data: { 
        bookingId: booking._id,
        orderId: booking.orderId,
        service: booking.service,
        plan: booking.offering,
        finalPrice: booking.finalPrice,
        status: booking.status,
        booking 
      } 
    });
  } catch (err) {
    next(err);
  }
};

// Helper: credit provider if not already credited and payment is fully confirmed (PAID status only)
// COD Hold Flow: this MUST only fire when booking.status === PAID (i.e., patient has confirmed).
// It must NOT fire at COLLECTED — the provider holds until patient confirms.
const creditProviderIfNeeded = async (booking) => {
  try {
    const Wallet = require('../models/Wallet');
    const Transaction = require('../models/Transaction');
    const Provider = require('../models/Provider');

    // Only credit when the booking is fully PAID — never at COLLECTED
    const isFullyPaid = normalizeBookingStatus(booking.status) === BOOKING_STATUS.PAID
      || normalizePaymentStatus(booking.paymentStatus) === PAYMENT_STATUS.PAID;
    if (!isFullyPaid) return;

    const provider = await Provider.findById(booking.provider).populate('user');
    if (!provider) return;

    const providerCut = booking.providerEarning || Math.round((booking.totalAmount || 0) * 0.8);

    // Idempotency: standardized check using referenceType: 'Booking'
    const existingProviderTx = await Transaction.findOne({
      referenceId: booking._id,
      referenceType: 'Booking',
      type: 'CREDIT',
    });
    if (existingProviderTx) return;

    const wallet = await Wallet.findOneAndUpdate(
      { user: provider.user?._id || provider.user },
      { $inc: { balance: providerCut } },
      { new: true, upsert: true }
    );

    await Transaction.create({
      wallet: wallet._id,
      type: 'CREDIT',
      amount: providerCut,
      description: `Earnings for Service (Booking: ${booking._id})`,
      referenceType: 'Booking',
      referenceId: booking._id,
    });

    await updateProviderEarnings(booking.provider);
  } catch (e) {
    console.error('creditProviderIfNeeded failed', e);
  }
};

// Exported helper for confirmCash to trigger referral bonus post-confirmation
exports.triggerReferralBonus = async (booking) => {
  // Referral bonus is only for first completed booking — safe to call from confirmCash
  // The idempotency guard inside the stage 3 logic will prevent duplicates
  try {
    const provider = await require('../models/Provider').findById(booking.provider);
    if (provider && provider.completedBookings === 1 && provider.referredByCode) {
      const Wallet = require('../models/Wallet');
      const Transaction = require('../models/Transaction');
      const referrer = await require('../models/Provider').findOne({ referralCode: provider.referredByCode });
      if (referrer) {
        const existingRefTx = await Transaction.findOne({
          type: 'CREDIT',
          referenceId: booking._id,
          description: /Referral First Booking Bonus/i,
        });
        if (!existingRefTx) {
          const referrerWallet = await Wallet.findOneAndUpdate(
            { user: referrer.user },
            { $inc: { balance: 100 } },
            { upsert: true, new: true }
          );
          await Transaction.create({
            wallet: referrerWallet._id,
            type: 'CREDIT',
            amount: 100,
            description: `Referral First Booking Bonus (Booking: ${booking._id})`,
            referenceId: booking._id,
            referenceType: 'Booking',
          });
        }
      }
    }
  } catch (e) {
    console.error('[triggerReferralBonus] failed', e);
  }
};

// Provider marks cash collected (creates notification) — minimal and safe
exports.collectCash = async (req, res, next) => {
  try {
    const { amount } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const providerProfile = await Provider.findOne({ user: req.user._id });
    if (!providerProfile || booking.provider.toString() !== providerProfile._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only assigned provider can collect cash' });
    }

    const nps = normalizePaymentStatus(booking.paymentStatus);
    if (nps === PAYMENT_STATUS.COLLECTED || nps === PAYMENT_STATUS.PAID) {
      return res.json({ success: true, message: 'Payment already collected or paid.', data: { booking } });
    }

    const currentStatus = normalizeBookingStatus(booking.status);
    if (currentStatus !== BOOKING_STATUS.COMPLETED && currentStatus !== BOOKING_STATUS.IN_PROGRESS) {
      return res.status(400).json({ success: false, message: 'Can only collect cash for in-progress or completed services' });
    }

    booking.collectedAmount = Number(amount) || booking.totalAmount || 0;
    booking.collectedBy = req.user._id;
    booking.collectedAt = new Date();
    booking.paymentStatus = PAYMENT_STATUS.COLLECTED;
    booking.patientConfirmed = null; // awaiting patient confirmation

    await booking.save();

    const n = await Notification.create({
      user: booking.patient,
      title: 'Cash Collected',
      message: `Provider collected ₹${booking.collectedAmount}. Please confirm the payment or report an issue.`,
      type: 'PAYMENT',
      linkId: booking._id,
    });
    try { socketHelper.getIO().to(booking.patient.toString()).emit('notification', n); } catch (e) {}

    res.json({ success: true, message: 'Marked cash collected. Awaiting patient confirmation.', data: { booking } });
  } catch (err) { next(err); }
};

// Mark booking as paid (can be called after cash collection or on prepaid verification)
exports.markPaid = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Allow provider or admin or system to mark paid
    const providerProfile = await Provider.findOne({ user: req.user._id });
    const isProvider = providerProfile && booking.provider.toString() === providerProfile._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isPatient = booking.patient.toString() === req.user._id.toString();
    if (!isProvider && !isAdmin && !isPatient) return res.status(403).json({ success: false, message: 'Not authorized to mark paid' });

    booking.paymentStatus = PAYMENT_STATUS.PAID;
    if (!booking.paymentConfirmedAt) booking.paymentConfirmedAt = new Date();
    await booking.save();

    await Notification.create({ user: booking.patient, title: 'Payment Confirmed', message: 'Payment has been recorded. Thank you!', type: 'PAYMENT', linkId: booking._id });
    try { socketHelper.getIO().to(booking.patient.toString()).emit('notification', { message: 'Payment confirmed' }); } catch (e) {}

    // If booking already completed, credit provider now
    await creditProviderIfNeeded(booking);

    // If booking is completed and paid, ask patient for review
    if (normalizeBookingStatus(booking.status) === BOOKING_STATUS.COMPLETED) {
      try {
        const reviewNotif = await Notification.create({
          user: booking.patient,
          title: 'Rate your experience',
          message: 'Please rate your recently completed service. Your feedback helps us improve.',
          type: 'REVIEW',
          linkId: booking._id,
        });
        try { socketHelper.getIO().to(booking.patient.toString()).emit('notification', reviewNotif); } catch (e) {}
        
        // 📧 Email Review Request
        await booking.populate([{ path: 'patient', select: 'name email' }, { path: 'provider', populate: { path: 'user', select: 'name' } }]);
        if (booking.patient?.email) {
          emailService.sendReviewRequest(booking.patient.email, booking.patient.name, booking.provider?.user?.name || 'your provider', booking._id);
        }
      } catch (e) { console.error('Failed to send review request', e); }
    }

    res.json({ success: true, message: 'Payment marked as PAID', data: { booking } });
  } catch (err) { next(err); }
};

// @GET /api/bookings — role-aware
exports.getBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, q } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = {};

    if (req.user.role === 'patient') {
      filter.patient = new mongoose.Types.ObjectId(req.user._id);
    } else if (req.user.role === 'provider') {
      const providerProfile = await Provider.findOne({ user: req.user._id });
      if (!providerProfile) return res.status(404).json({ success: false, message: 'Provider profile not found' });
      filter.provider = new mongoose.Types.ObjectId(providerProfile._id);
    }

    if (status && status !== 'all') {
      const normalized = normalizeBookingStatus(status);
      // Support searching by both new normalized status and common legacy strings
      const statusVariants = [normalized];
      if (normalized === BOOKING_STATUS.REQUESTED) statusVariants.push('pending', 'PENDING');
      if (normalized === BOOKING_STATUS.CONFIRMED) statusVariants.push('confirmed', 'accepted', 'ACCEPTED');
      if (normalized === BOOKING_STATUS.IN_PROGRESS) statusVariants.push('in-progress', 'in_progress', 'started', 'STARTED');
      if (normalized === BOOKING_STATUS.COMPLETED) statusVariants.push('completed', 'COMPLETED');
      if (normalized === BOOKING_STATUS.CANCELLED) statusVariants.push('cancelled', 'CANCELLED', 'rejected', 'REJECTED');
      
      filter.status = { $in: [...new Set(statusVariants)] };
    }

    // 🔍 Search Logic (ID, Patient Name, Provider Name)
    const pipeline = [{ $match: filter }];

    // Populate Patient and Provider User for searching
    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'patient',
          foreignField: '_id',
          as: 'patientData'
        }
      },
      { $unwind: '$patientData' },
      {
        $lookup: {
          from: 'providers',
          localField: 'provider',
          foreignField: '_id',
          as: 'providerData'
        }
      },
      { $unwind: '$providerData' },
      {
        $lookup: {
          from: 'users',
          localField: 'providerData.user',
          foreignField: '_id',
          as: 'providerUserData'
        }
      },
      { $unwind: '$providerUserData' },
      {
        $lookup: {
          from: 'services',
          localField: 'service',
          foreignField: '_id',
          as: 'serviceData'
        }
      },
      { $unwind: { path: '$serviceData', preserveNullAndEmptyArrays: true } }
    );

    if (q) {
      const searchConditions = [
        { 'patientData.name': { $regex: q, $options: 'i' } },
        { 'providerUserData.name': { $regex: q, $options: 'i' } }
      ];

      if (mongoose.Types.ObjectId.isValid(q)) {
        searchConditions.push({ _id: new mongoose.Types.ObjectId(q) });
      }

      pipeline.push({ $match: { $or: searchConditions } });
    }

    // Clone pipeline for count
    const countPipeline = [...pipeline, { $count: 'total' }];
    const totalResult = await Booking.aggregate(countPipeline);
    const total = totalResult.length > 0 ? totalResult[0].total : 0;

    // Sorting and Pagination
    pipeline.push(
      { $sort: { scheduledAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) }
    );

    let bookings = await Booking.aggregate(pipeline);

    // Format response (mimic populate structure)
    bookings = bookings.map(b => {
      const formatted = {
        ...b,
        patient: {
          _id: b.patientData._id,
          name: b.patientData.name,
          email: b.patientData.email,
          avatar: b.patientData.avatar
        },
        provider: {
          _id: b.providerData._id,
          user: {
            _id: b.providerUserData._id,
            name: b.providerUserData.name,
            email: b.providerUserData.email,
            avatar: b.providerUserData.avatar
          }
        },
        service: b.serviceData ? {
          _id: b.serviceData._id,
          name: b.serviceData.name,
          slug: b.serviceData.slug,
          label: b.serviceData.label,
          icon: b.serviceData.icon
        } : { label: "Service", slug: "nurse", icon: "🩺" }
      };
      delete b.serviceData;
      delete formatted.patientData;
      delete formatted.providerData;
      delete formatted.providerUserData;
      return formatBookingResponse(formatted, req.user.role);
    });



    res.json({
      success: true,
      data: { bookings, total, page: Number(page), totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// @GET /api/bookings/:id
exports.getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('patient', 'name email phone avatar')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name email phone avatar' } })
      .populate('service');

    if (!booking) {
      return res.json({
        success: true,
        data: {}
      });
    }

    // Authorization check
    const isPatient = booking.patient._id.toString() === req.user._id.toString();
    const providerProfile = await Provider.findOne({ user: req.user._id });
    const isProvider = providerProfile && booking.provider._id.toString() === providerProfile._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isPatient && !isProvider && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this booking' });
    }

    const formattedBooking = formatBookingResponse(booking, req.user.role);

    res.json({ success: true, data: { booking: formattedBooking } });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/bookings/:id/status
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status: incomingStatus, cancelReason } = req.body;
    
    // Normalize target status
    const targetStatus = normalizeBookingStatus(incomingStatus);
    
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Current normalized status
    const currentStatus = normalizeBookingStatus(booking.status);

    // 🛡️ IDEMPOTENCY GUARD: If already in target status, return success
    if (currentStatus === targetStatus) {
      const formattedBooking = formatBookingResponse(booking, req.user.role);
      return res.json({ 
        success: true, 
        message: `Booking is already ${targetStatus.toLowerCase()}`, 
        data: { booking: formattedBooking } 
      });
    }

    // SECURITY: IDOR protection
    const isPatient = booking.patient.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    let isAssignedProvider = false;
    
    if (req.user.role === 'provider') {
      const providerProfile = await Provider.findOne({ user: req.user._id });
      isAssignedProvider = providerProfile && booking.provider.toString() === providerProfile._id.toString();
    }

    if (!isPatient && !isAssignedProvider && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this booking' });
    }

    // Role-based transition restrictions (Subset of global state machine)
    const roleBasedAllowed = {
      patient: [BOOKING_STATUS.CANCELLED],
      provider: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED],
      admin: [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED, BOOKING_STATUS.PAID],
    };

    const allowedByRole = roleBasedAllowed[req.user.role] || [];
    const allowedByState = VALID_BOOKING_TRANSITIONS[currentStatus] || [];

    if (!allowedByRole.includes(targetStatus)) {
      return res.status(403).json({ success: false, message: `Role '${req.user.role}' is not allowed to transition to '${targetStatus}'` });
    }

    if (!allowedByState.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition: Cannot move booking from '${currentStatus}' to '${targetStatus}'`,
      });
    }

    // State-specific side effects and extra guards
    if (targetStatus === BOOKING_STATUS.CONFIRMED) {
      if (booking.expiresAt && new Date() > booking.expiresAt) {
        booking.status = BOOKING_STATUS.CANCELLED;
        booking.cancelReason = 'System: Provider failed to accept request within expiration window.';
        await booking.save();
        return res.status(400).json({ success: false, message: 'This booking request has expired and was automatically cancelled.' });
      }
    }

    if (targetStatus === BOOKING_STATUS.IN_PROGRESS) {
      if (!isAssignedProvider && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Only the assigned provider or admin can start the service' });
      }
    }

    // ⚠️ SOFT ACTIVE BOOKING WARNING: Allow acceptance but warn if many pending
    let softWarningPayload = null;
    if ((targetStatus === BOOKING_STATUS.CONFIRMED || targetStatus === BOOKING_STATUS.IN_PROGRESS) && req.user.role === 'provider') {
      const pendingCount = await Booking.countDocuments({
        provider: booking.provider,
        status: { $in: [BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CONFIRMED] },
        _id: { $ne: booking._id }
      });
      if (pendingCount > 2) {
        softWarningPayload = {
          message: 'You have pending completions. Please complete them soon.',
          pendingCount,
          softWarning: true,
        };
      }
    }

    const previousStatus = currentStatus;

    // Provider-focused transition logging
    if (req.user.role === 'provider' && [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.COMPLETED].includes(targetStatus)) {
      try {
        const providerProfile = await Provider.findOne({ user: req.user._id });
        console.log('[BOOKING_TRANSITION]', {
          bookingId: booking._id.toString(),
          providerUser: req.user._id.toString(),
          providerProfileId: providerProfile?._id?.toString(),
          from: previousStatus,
          to: targetStatus,
        });
      } catch (e) {}
    }

    if (targetStatus === BOOKING_STATUS.IN_PROGRESS) {
      booking.startedAt = new Date();
    }

    // Set final status
    booking.status = targetStatus;

    console.log('[BOOKING_AUDIT] Status Updated:', booking._id, 'From:', previousStatus, 'To:', booking.status);
    try {
      billingLogger.logBookingStatusUpdated({
        bookingId: booking._id.toString(),
        userId: req.user._id.toString(),
        status: booking.status,
        requestId: req.requestId,
        metadata: { from: previousStatus, to: targetStatus }
      });
    } catch (e) {}

    // 🔔 Notify Patient on Confirm
    if (targetStatus === BOOKING_STATUS.CONFIRMED) {
      const n = await Notification.create({
        user: booking.patient,
        title: 'Payment Required: Booking Confirmed',
        message: 'Your booking has been accepted! Please proceed to pay securely via your dashboard.',
        type: 'PAYMENT',
        linkId: booking._id
      });
      try { socketHelper.getIO().to(booking.patient.toString()).emit('notification', n); } catch(e) {}

      // 📧 Send booking accepted email to Patient
      try {
        const User = require('../models/User');
        const Service = require('../models/Service');
        const patientUser = await User.findById(booking.patient);
        const providerUser = await User.findById(req.user.role === 'provider' ? req.user._id : booking.provider);
        const serviceDoc = await Service.findById(booking.service);
        
        if (patientUser && patientUser.email) {
          emailService.sendBookingAccepted(
            patientUser.email,
            patientUser.name,
            providerUser ? providerUser.name : 'Your Provider',
            serviceDoc ? serviceDoc.name : 'Healthcare Service',
            booking.scheduledAt,
            booking.paymentMethod
          );
        }
      } catch (err) {
        console.error('Failed to send confirmation payment email', err);
      }
    }
    
    if (targetStatus === BOOKING_STATUS.CANCELLED) {
      // 🛡️ CANCELLATION ENGINE: Cannot cancel after service has started
      if (previousStatus === BOOKING_STATUS.IN_PROGRESS || previousStatus === BOOKING_STATUS.COMPLETED || previousStatus === BOOKING_STATUS.PAID) {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel booking at this stage: Current status is ${previousStatus}.`
        });
      }

      booking.cancelReason = cancelReason || 'No reason provided';

      // Track provider cancellations
      if (req.user.role === 'provider') {
        const Provider = require('../models/Provider');
        await Provider.findByIdAndUpdate(booking.provider, { $inc: { cancellationCount: 1 } });
        await fraudService.analyzeProviderMetrics(booking.provider);
      }
    }
    
    if (targetStatus === BOOKING_STATUS.COMPLETED) {
      // 🛡️ DUPLICATE COMPLETION GUARD (Redundant due to state machine but safe)
      if (currentStatus === BOOKING_STATUS.COMPLETED) {
        return res.json({ success: true, message: 'Booking already completed.', data: { booking } });
      }

      // 🔒 PRICE APPROVAL GUARD: Cannot complete if price was updated but patient hasn't approved
      if (booking.priceUpdated && !booking.priceApprovedByPatient) {
        return res.status(400).json({
          success: false,
          message: 'Patient must approve the updated price before completing the service.',
        });
      }

      const now = new Date();
      booking.completedAt = now;

      // ⏰ LATE COMPLETION DETECTION
      const scheduledEnd = booking.scheduledAt
        ? new Date(booking.scheduledAt.getTime() + (booking.durationHours || 1) * 3600000)
        : null;
      const isLate = scheduledEnd && now > scheduledEnd;
      booking.completionType = isLate ? 'late' : 'manual';
      if (isLate) booking.completionMeta = { markedLate: true };

      console.log('[COMPLETION]', { bookingId: booking._id, completionType: booking.completionType, completedAt: now });

      // ⚠️ FRAUD FLAG: Short duration check (< 10 minutes)
      if (booking.startedAt) {
        const durationMinutes = (booking.completedAt - booking.startedAt) / 60000;
        if (durationMinutes < 10) {
          booking.systemFlags.push('SHORT_COMPLETION_TIME');
        }
      }

      // Analyze for advanced fraud detection
      await fraudService.analyzeBookingCompletion(booking);

      // Update provider stats
      const Provider = require('../models/Provider');
      const provider = await Provider.findById(booking.provider);
        if (provider) {
          provider.completedBookings += 1;
          await provider.save();

          // 💰 Stage 3: Referral First Booking Bonus (₹100)
          if (provider.completedBookings === 1 && provider.referredByCode) {
            try {
              const referrer = await Provider.findOne({ referralCode: provider.referredByCode });
              if (referrer) {
                const Wallet = require('../models/Wallet');
                const Transaction = require('../models/Transaction');

                // 🔒 Idempotency: prevent duplicate referral bonus
                const existingRefTx = await Transaction.findOne({
                  type: 'CREDIT',
                  referenceId: booking._id,
                  description: /Referral First Booking Bonus/i,
                });
                if (!existingRefTx) {
                  // ✅ Atomic wallet credit using $inc
                  const referrerWallet = await Wallet.findOneAndUpdate(
                    { user: referrer.user },
                    { $inc: { balance: 100 } },
                    { upsert: true, new: true }
                  );
                  await Transaction.create({
                    wallet: referrerWallet._id,
                    type: 'CREDIT',
                    amount: 100,
                    description: `Referral First Booking Bonus (Provider: ${req.user.name})`,
                    referenceId: booking._id,
                  });
                } else {
                  console.warn('[bookingController] Skipping duplicate Stage 3 referral bonus for booking', booking._id.toString());
                }
              }
            } catch (err) {
              console.error('Failed to credit Stage 3 referral bonus', err);
            }
          }

          // 🔔 Notify both parties
          const pNotif = await Notification.create({
            user: booking.patient,
            title: 'Service Completed',
            message: 'Your service is complete! Please rate your experience to help us improve.',
            type: 'BOOKING',
            linkId: booking._id
          });
          const dNotif = await Notification.create({
            user: provider.user,
            title: 'Service Completed',
            message: 'Service completed successfully.',
            type: 'BOOKING',
            linkId: booking._id
          });
          try {
            socketHelper.getIO().to(booking.patient.toString()).emit('notification', pNotif);
            socketHelper.getIO().to(provider.user.toString()).emit('notification', dNotif);
          } catch(e) {}
          
          // 📧 Send Service Completed Email
          try {
            const User = require('../models/User');
            const Service = require('../models/Service');
            const patientUser = await User.findById(booking.patient);
            const serviceDoc = await Service.findById(booking.service);
            if (patientUser && patientUser.email) {
              emailService.sendBookingCompleted(patientUser.email, patientUser.name, serviceDoc ? serviceDoc.name : 'Service');
            }
          } catch (e) {
            console.error('Failed to send completion email', e);
          }
        }

        // 💰 PATIENT REFERRAL BONUS (₹100 to Referrer)
        try {
          const User = require('../models/User');
          const patientUser = await User.findById(booking.patient);
          if (patientUser && patientUser.referredByCode) {
            const pastBookingsCount = await Booking.countDocuments({ 
              patient: booking.patient, 
              status: BOOKING_STATUS.COMPLETED, 
              _id: { $ne: booking._id } 
            });
          
          if (pastBookingsCount === 0) {
             // First completed booking - award bonus to referrer
             const referrerUser = await User.findOne({ referralCode: patientUser.referredByCode });
             if (referrerUser) {
               let referrerWallet = await Wallet.findOne({ user: referrerUser._id });
               if (!referrerWallet) referrerWallet = await Wallet.create({ user: referrerUser._id, balance: 0 });

               // Prevent duplicate referral bonus
               const existingRefTx = await Transaction.findOne({ wallet: referrerWallet._id, referenceId: booking._id, description: /Referral Bonus/i });
               if (!existingRefTx) {
                 await Wallet.findOneAndUpdate({ user: referrerUser._id }, { $inc: { balance: 100 } }, { upsert: true });
                 await Transaction.create({
                   wallet: referrerWallet._id,
                   type: 'CREDIT',
                   amount: 100,
                   description: `Referral Bonus (Friend's First Booking: ${patientUser.name})`,
                   referenceId: booking._id,
                 });
               } else {
                 console.warn('[bookingController] Skipping duplicate referral bonus for booking', booking._id.toString());
               }
             }
          }
        }
      } catch (err) {
        console.error('Failed to credit patient referral bonus', err);
      }
    }

    await booking.save();
    
    // 💰 FINAL TRIGGER: Credit provider if payment already confirmed or cash collected
    await creditProviderIfNeeded(booking);

    await booking.populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'provider', populate: { path: 'user', select: 'name email phone' } },
      { path: 'service' }
    ]);

    const formattedBooking = formatBookingResponse(booking, req.user.role);

    res.json({ 
      success: true, 
      message: `Booking ${targetStatus}`, 
      data: { booking: formattedBooking },
      ...(softWarningPayload || {})
    });
  } catch (err) {
    next(err);
  }
};

// @DELETE /api/bookings/:id (admin only)
exports.deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking deleted' });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/bookings/:id/verify-completion (Patient only)
exports.verifyCompletion = async (req, res, next) => {
  try {
    const { verified } = req.body;
    if (typeof verified !== 'boolean') {
      return res.status(400).json({ success: false, message: 'boolean "verified" field is required' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the patient can verify completion' });
    }

    if (normalizeBookingStatus(booking.status) !== BOOKING_STATUS.COMPLETED) {
      return res.status(400).json({ success: false, message: 'Booking must be completed before verification' });
    }

    booking.patientVerifiedCompletion = verified;
    
    // ⚠️ FRAUD FLAG: Patient denied completion
    if (verified === false && !booking.systemFlags.includes('PATIENT_DENIED_COMPLETION')) {
      booking.systemFlags.push('PATIENT_DENIED_COMPLETION');
    }

    await booking.save();
    
    res.json({ success: true, message: 'Verification recorded successfully', data: { booking } });
  } catch (err) {
    next(err);
  }
};

// @GET /api/bookings/check-pincode/:pincode
exports.checkPincode = async (req, res, next) => {
  try {
    const { pincode } = req.params;
    const isServiceable = await ServiceablePincode.findOne({ pincode, isActive: true });
    if (!isServiceable) {
      return res.status(404).json({ success: false, message: 'We are not available in your area yet.', isServiceable: false });
    }
    res.json({ success: true, isServiceable: true, data: { city: isServiceable.city, state: isServiceable.state, areaName: isServiceable.areaName } });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
//  PRICE UPDATE & APPROVAL ENDPOINTS
// ─────────────────────────────────────────────────────────────

// @PUT /api/bookings/:id/update-price (Provider only)
exports.updateBookingPrice = async (req, res, next) => {
  try {
    const { newFinalPrice, reason } = req.body;

    if (!newFinalPrice || newFinalPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Valid newFinalPrice is required' });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Authorization: only the assigned provider
    const providerProfile = await Provider.findOne({ user: req.user._id });
    if (!providerProfile || booking.provider.toString() !== providerProfile._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the assigned provider can update the price' });
    }

    // Cannot update after completion or cancellation
    if ([BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED].includes(normalizeBookingStatus(booking.status))) {
      return res.status(400).json({ success: false, message: 'Cannot update price after completion or cancellation' });
    }

    const oldPrice = booking.totalAmount;
    booking.finalPrice = newFinalPrice;
    booking.totalAmount = newFinalPrice;
    booking.priceUpdateReason = reason || 'Price updated by provider';
    booking.priceUpdated = true;
    booking.priceApprovedByPatient = false;
    booking.priceHistory.push({
      changedBy: 'provider',
      changedByUserId: req.user._id,
      oldPrice,
      newPrice: newFinalPrice,
      reason: reason || 'Price updated by provider',
      action: 'update',
    });

    await booking.save();

    // 🔔 Notify Patient about price update
    const notification = await Notification.create({
      user: booking.patient,
      title: 'Price Updated',
      message: `Your booking price has been updated to ₹${newFinalPrice}. Please review and approve.`,
      type: 'BOOKING',
      linkId: booking._id,
    });
    try {
      socketHelper.getIO().to(booking.patient.toString()).emit('notification', notification);
      socketHelper.getIO().to(booking.patient.toString()).emit('price-updated', {
        bookingId: booking._id,
        newFinalPrice,
        reason: booking.priceUpdateReason,
      });
    } catch (e) {}

    await booking.populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'provider', populate: { path: 'user', select: 'name email phone' } },
    ]);

    res.json({ success: true, message: 'Price updated. Awaiting patient approval.', data: { booking } });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/bookings/:id/approve-price (Patient only)
exports.approveBookingPrice = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the patient can approve the price' });
    }

    if (!booking.priceUpdated) {
      return res.status(400).json({ success: false, message: 'No price update to approve' });
    }

    if (booking.priceApprovedByPatient) {
      return res.status(400).json({ success: false, message: 'Price already approved' });
    }

    booking.priceApprovedByPatient = true;
    booking.priceHistory.push({
      changedBy: 'patient',
      changedByUserId: req.user._id,
      oldPrice: booking.totalAmount,
      newPrice: booking.totalAmount,
      reason: 'Patient approved updated price',
      action: 'approve',
    });
    await booking.save();

    // 🔔 Notify Provider that patient approved
    const providerDoc = await Provider.findById(booking.provider);
    if (providerDoc) {
      const notification = await Notification.create({
        user: providerDoc.user,
        title: 'Price Approved',
        message: `Patient approved the updated price of ₹${booking.finalPrice}.`,
        type: 'BOOKING',
        linkId: booking._id,
      });
      try {
        socketHelper.getIO().to(providerDoc.user.toString()).emit('notification', notification);
        socketHelper.getIO().to(providerDoc.user.toString()).emit('price-approved', {
          bookingId: booking._id,
        });
      } catch (e) {}
    }

    res.json({ success: true, message: 'Price approved successfully', data: { booking } });
  } catch (err) {
    next(err);
  }
};

// @PUT /api/bookings/:id/reject-price (Patient only)
exports.rejectBookingPrice = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (booking.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the patient can reject the price' });
    }

    if (!booking.priceUpdated) {
      return res.status(400).json({ success: false, message: 'No price update to reject' });
    }

    if (booking.priceApprovedByPatient) {
      return res.status(400).json({ success: false, message: 'Price already approved — cannot reject now' });
    }

    const currentStatus = normalizeBookingStatus(booking.status);
    // BEFORE service started (pending / confirmed) → Cancel the booking
    if ([BOOKING_STATUS.REQUESTED, BOOKING_STATUS.CONFIRMED].includes(currentStatus)) {
      const oldPrice = booking.totalAmount;
      booking.status = BOOKING_STATUS.CANCELLED;
      booking.cancelReason = 'Patient rejected updated price';
      booking.finalPrice = null;
      booking.totalAmount = booking.estimatedPrice;
      booking.priceUpdated = false;
      booking.priceApprovedByPatient = true;
      booking.priceHistory.push({
        changedBy: 'patient',
        changedByUserId: req.user._id,
        oldPrice,
        newPrice: booking.estimatedPrice,
        reason: 'Patient rejected updated price — booking cancelled',
        action: 'reject',
      });
      await booking.save();

      // Notify provider
      const providerDoc = await Provider.findById(booking.provider);
      if (providerDoc) {
        const notification = await Notification.create({
          user: providerDoc.user,
          title: 'Price Rejected — Booking Cancelled',
          message: 'Patient rejected the updated price. The booking has been cancelled.',
          type: 'BOOKING',
          linkId: booking._id,
        });
        try { socketHelper.getIO().to(providerDoc.user.toString()).emit('notification', notification); } catch(e) {}
      }

      return res.json({ success: true, message: 'Price rejected. Booking cancelled.', data: { booking } });
    }

    // DURING service (in-progress) → Revert to original estimated price, no extras
    if (normalizeBookingStatus(booking.status) === BOOKING_STATUS.IN_PROGRESS) {
      const oldPrice = booking.totalAmount;
      booking.finalPrice = booking.estimatedPrice;
      booking.totalAmount = booking.estimatedPrice;
      booking.priceUpdateReason = 'Patient rejected updated price — reverted to original estimate';
      booking.priceApprovedByPatient = true;
      booking.priceHistory.push({
        changedBy: 'patient',
        changedByUserId: req.user._id,
        oldPrice,
        newPrice: booking.estimatedPrice,
        reason: 'Patient rejected updated price — reverted to original estimated price',
        action: 'reject',
      });
      await booking.save();

      // Notify provider
      const providerDoc = await Provider.findById(booking.provider);
      if (providerDoc) {
        const notification = await Notification.create({
          user: providerDoc.user,
          title: 'Price Rejected',
          message: `Patient rejected the updated price. Original price of ₹${booking.estimatedPrice} will be charged.`,
          type: 'BOOKING',
          linkId: booking._id,
        });
        try { socketHelper.getIO().to(providerDoc.user.toString()).emit('notification', notification); } catch(e) {}
      }

      return res.json({
        success: true,
        message: 'Price rejected. Original estimated price will be charged.',
        data: { booking },
      });
    }

    return res.status(400).json({ success: false, message: 'Cannot reject price in current booking state' });
  } catch (err) {
    next(err);
  }
};
