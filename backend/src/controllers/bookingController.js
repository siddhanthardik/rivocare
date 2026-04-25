const Booking = require('../models/Booking');
const Provider = require('../models/Provider');
const Service = require('../models/Service');
const fraudService = require('../services/fraudService');
const { maskPhone, maskAddress } = require('../utils/helpers');
const Notification = require('../models/Notification');
const socketHelper = require('../socket');
const ServiceablePincode = require('../models/ServiceablePincode');

const formatBookingResponse = (booking, userRole) => {
  const b = booking.toObject ? booking.toObject() : booking;
  if (userRole === 'provider' && !['confirmed', 'in-progress', 'completed'].includes(b.status)) {
    if (b.patient && b.patient.phone) b.patient.phone = maskPhone(b.patient.phone);
    if (b.address) b.address = maskAddress(b.address);
  }
  return b;
};

// @POST /api/bookings
exports.createBooking = async (req, res, next) => {
  try {
    const { providerId, service, address, pincode, scheduledAt, durationHours, notes } = req.body;

    // 📍 Service Area Validation
    const validPincode = await ServiceablePincode.findOne({ pincode, isActive: true });
    if (!validPincode) {
      return res.status(400).json({ success: false, message: 'We are not available in your area yet.' });
    }

    const provider = await Provider.findById(providerId);
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    if (provider.isBlocked) return res.status(403).json({ success: false, message: 'This provider is currently unavailable for new bookings.' });
    if (!provider.isOnline) return res.status(400).json({ success: false, message: 'Provider is currently offline' });
    if (!provider.services.includes(service)) {
      return res.status(400).json({ success: false, message: 'Provider does not offer this service' });
    }

    // Check for provider double-booking
    const scheduledDate = new Date(scheduledAt);
    const conflict = await Booking.findOne({
      provider: providerId,
      scheduledAt: scheduledDate,
      status: { $in: ['pending', 'confirmed', 'in-progress'] },
    });
    if (conflict) {
      return res.status(409).json({ success: false, message: 'Provider is already booked at this time' });
    }

    const hours = durationHours || 1;

    // 💰 Pricing Snapshot: fetch admin base price + provider markup
    const serviceDoc = await Service.findOne({ name: service, isActive: true });
    const servicBasePrice = serviceDoc ? serviceDoc.basePrice : provider.pricePerHour;
    const provMarkup = provider.markup || 0;
    const estimatedPrice = (servicBasePrice + provMarkup) * hours;

    // Booking expires in 5 minutes (300 seconds) if not accepted
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const booking = await Booking.create({
      patient: req.user._id,
      provider: providerId,
      service,
      address,
      pincode,
      scheduledAt: scheduledDate,
      durationHours: hours,
      notes,
      totalAmount: estimatedPrice,
      basePrice: servicBasePrice,
      providerMarkup: provMarkup,
      estimatedPrice,
      expiresAt,
    });

    // Update user profile if address or pincode is missing
    let userModified = false;
    if (!req.user.address) { req.user.address = address; userModified = true; }
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
    try {
      socketHelper.getIO().to(provider.user.toString()).emit('notification', notification);
    } catch (e) {
      // socket not ready
    }

    res.status(201).json({ success: true, message: 'Booking created successfully', data: { booking } });
  } catch (err) {
    next(err);
  }
};

// @GET /api/bookings — role-aware
exports.getBookings = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (req.user.role === 'patient') {
      filter.patient = req.user._id;
    } else if (req.user.role === 'provider') {
      const providerProfile = await Provider.findOne({ user: req.user._id });
      if (!providerProfile) return res.status(404).json({ success: false, message: 'Provider profile not found' });
      filter.provider = providerProfile._id;
    }
    // admin sees all

    if (status) filter.status = status;

    const total = await Booking.countDocuments(filter);
    let bookings = await Booking.find(filter)
      .populate('patient', 'name email phone avatar')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name email phone avatar' } })
      .sort({ scheduledAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    bookings = bookings.map(b => formatBookingResponse(b, req.user.role));

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
      .populate({ path: 'provider', populate: { path: 'user', select: 'name email phone avatar' } });

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

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
    const { status, cancelReason } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // SECURITY FIX: Insecure Direct Object Reference (IDOR) protection
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

    const validTransitions = {
      patient: { pending: ['cancelled'], confirmed: ['cancelled'], 'in-progress': ['cancelled'] },
      provider: { pending: ['confirmed', 'cancelled'], confirmed: ['in-progress'], 'in-progress': ['completed'] },
      admin: { pending: ['confirmed', 'cancelled'], confirmed: ['cancelled'], 'in-progress': ['completed', 'cancelled'] },
    };

    const allowed = validTransitions[req.user.role]?.[booking.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition booking from '${booking.status}' to '${status}'`,
      });
    }

    // ⏳ EXPIRY STRICT ENFORCEMENT
    if (status === 'confirmed' || status === 'in-progress') {
      if (booking.expiresAt && new Date() > booking.expiresAt && booking.status === 'pending') {
        booking.status = 'cancelled';
        booking.cancelReason = 'System: Provider failed to accept request within 5 minute expiration window.';
        await booking.save();
        return res.status(400).json({ success: false, message: 'This booking request has expired and was automatically cancelled.' });
      }
    }

    // 🔒 ACTIVE BOOKING LOCK: Prevent provider from juggling multiple jobs
    if ((status === 'confirmed' || status === 'in-progress') && req.user.role === 'provider') {
      const activeJob = await Booking.findOne({
        provider: booking.provider,
        status: { $in: ['in-progress', 'confirmed'] },
        _id: { $ne: booking._id }
      });
      if (activeJob) {
          return res.status(409).json({ success: false, message: 'Complete current booking to accept new ones.' });
      }
    }

    if (status === 'in-progress') {
      booking.startedAt = new Date();
    }

    booking.status = status;

    // 🔔 Notify Patient on Confirm
    if (status === 'confirmed') {
      const n = await Notification.create({
        user: booking.patient,
        title: 'Payment Required: Booking Confirmed',
        message: 'Your booking has been accepted! Please proceed to pay securely via your dashboard.',
        type: 'PAYMENT',
        linkId: booking._id
      });
      try { socketHelper.getIO().to(booking.patient.toString()).emit('notification', n); } catch(e) {}

      // 📧 Send warning email to Patient to pay
      try {
        const User = require('../models/User');
        const sendEmail = require('../utils/sendEmail');
        const patientUser = await User.findById(booking.patient);
        if (patientUser) {
          await sendEmail({
            email: patientUser.email,
            subject: 'Payment Required: Your RIVO Booking is Confirmed',
            message: `Hello ${patientUser.name},\n\nYour home healthcare booking has been accepted by the provider!\n\nTo proceed and finalize the appointment, please log in to your RIVO dashboard and click the "Pay Now" button on your confirmed booking.\n\nThank you,\nThe RIVO Team`
          });
        }
      } catch (err) {
        console.error('Failed to send confirmation payment email', err);
      }
    }
    
    if (status === 'cancelled') {
      booking.cancelReason = cancelReason || 'No reason provided';

      // 💰 50% CANCELLATION FEE: If patient cancels while service is in-progress
      if (req.user.role === 'patient' && booking.status === 'in-progress') {
        const effectivePrice = booking.finalPrice || booking.estimatedPrice || booking.totalAmount;
        const oldPrice = booking.totalAmount;
        booking.totalAmount = Math.round(effectivePrice * 0.5);
        booking.finalPrice = booking.totalAmount;
        booking.priceUpdateReason = 'Patient cancelled during in-progress service — 50% charged';
        booking.priceUpdated = true;
        booking.priceApprovedByPatient = true;
        booking.priceHistory.push({
          changedBy: 'system',
          changedByUserId: req.user._id,
          oldPrice,
          newPrice: booking.totalAmount,
          reason: 'Patient cancelled during in-progress service — 50% cancellation fee applied',
          action: 'cancel_50pct',
        });
      }

      // Track provider cancellations
      if (req.user.role === 'provider') {
        const Provider = require('../models/Provider');
        await Provider.findByIdAndUpdate(booking.provider, { $inc: { cancellationCount: 1 } });
        await fraudService.analyzeProviderMetrics(booking.provider);
      }
    }
    
    if (status === 'completed') {
      // 🔒 PRICE APPROVAL GUARD: Cannot complete if price was updated but patient hasn't approved
      if (booking.priceUpdated && !booking.priceApprovedByPatient) {
        return res.status(400).json({
          success: false,
          message: 'Patient must approve the updated price before completing the service.',
        });
      }
      booking.completedAt = new Date();
      
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
        provider.totalEarnings += booking.totalAmount;
        await provider.save();

        // 💰 Stage 3: Referral First Booking Bonus (₹100)
        if (provider.completedBookings === 1 && provider.referredByCode) {
          try {
            const referrer = await Provider.findOne({ referralCode: provider.referredByCode });
            if (referrer) {
              const Wallet = require('../models/Wallet');
              const Transaction = require('../models/Transaction');
              
              let referrerWallet = await Wallet.findOne({ user: referrer.user });
              if (!referrerWallet) referrerWallet = await Wallet.create({ user: referrer.user, balance: 0 });

              referrerWallet.balance += 100;
              await referrerWallet.save();

              await Transaction.create({
                wallet: referrerWallet._id,
                type: 'CREDIT',
                amount: 100,
                description: `Referral First Booking Bonus (Provider: ${req.user.name})`,
                referenceId: booking._id,
              });
            }
          } catch (err) {
            console.error('Failed to credit Stage 3 referral bonus', err);
          }
        }

        // 🔔 Notify both parties
        const pNotif = await Notification.create({
          user: booking.patient,
          title: 'Service Completed',
          message: 'Service completed. Please verify the completion.',
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
      }

      // 💰 WALLET CREDIT LOGIC (80% to Provider)
      // Credit wallet upon completion so history always shows
      const Wallet = require('../models/Wallet');
      const Transaction = require('../models/Transaction');
      
      let wallet = await Wallet.findOne({ user: provider.user });
      if (!wallet) {
        wallet = await Wallet.create({ user: provider.user, balance: 0 });
      }

      const commissionRate = 0.8; // 80% to provider, 20% platform fee
      const providerCut = Math.round(booking.totalAmount * commissionRate);

      wallet.balance += providerCut;
      await wallet.save();

      await Transaction.create({
        wallet: wallet._id,
        type: 'CREDIT',
        amount: providerCut,
        description: `Earnings for Service (Booking: ${booking._id})`,
        referenceId: booking._id,
      });
    }

    await booking.save();
    await booking.populate([
      { path: 'patient', select: 'name email phone' },
      { path: 'provider', populate: { path: 'user', select: 'name email phone' } },
    ]);

    const formattedBooking = formatBookingResponse(booking, req.user.role);

    res.json({ success: true, message: `Booking ${status}`, data: { booking: formattedBooking } });
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

    if (booking.status !== 'completed') {
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
    if (['completed', 'cancelled'].includes(booking.status)) {
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

    // BEFORE service started (pending / confirmed) → Cancel the booking
    if (['pending', 'confirmed'].includes(booking.status)) {
      const oldPrice = booking.totalAmount;
      booking.status = 'cancelled';
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
    if (booking.status === 'in-progress') {
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
