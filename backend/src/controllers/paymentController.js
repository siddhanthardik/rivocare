const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const billingLogger = require('../utils/billingLogger');
const InvoiceSnapshot = require('../models/InvoiceSnapshot');
const invoicePdfService = require('../services/invoicePdfService');
const { BOOKING_STATUS, normalizeBookingStatus } = require('../constants/bookingStatus');
const emailService = require('../services/emailService');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykey',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummysecret',
});

// Production safety: ensure live keys are configured
if (process.env.NODE_ENV === 'production') {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_ID.includes('test') || process.env.RAZORPAY_KEY_SECRET.includes('dummy')) {
    console.error('[paymentController] Razorpay keys missing or not configured for production. Aborting live payment operations until configured.');
  }
}

// @POST /api/payment/create-order
exports.createOrder = async (req, res, next) => {
  try {
    // Accept either existing bookingId (legacy) or bookingIntent for prepaid flow
    const { bookingId, bookingIntent } = req.body;

    let booking = null;
    if (bookingId) {
      booking = await Booking.findById(bookingId);
      if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
      if (booking.patient.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      if (normalizePaymentStatus(booking.paymentStatus) === PAYMENT_STATUS.PAID) {
        return res.status(400).json({ success: false, message: 'Payment already completed for this booking' });
      }
      if (normalizeBookingStatus(booking.status) !== BOOKING_STATUS.CONFIRMED) {
        return res.status(400).json({ success: false, message: `Payment rejected: Booking status is ${booking.status}. Only confirmed bookings can be paid.` });
      }
    } else if (!bookingIntent) {
      return res.status(400).json({ success: false, message: 'Required parameter bookingId or bookingIntent is missing' });
    }


    // 🔒 Block payment if price updated but not approved
    if (booking.priceUpdated && !booking.priceApprovedByPatient) {
      return res.status(400).json({ success: false, message: 'Please approve the updated price before making payment' });
    }

    // Use the correct price: finalPrice if updated & approved, else totalAmount
    // Determine payable amount from existing booking or intent
    let payableAmount = 0;
    if (booking) {
      if (booking.priceUpdated && booking.priceApprovedByPatient && booking.finalPrice) {
        payableAmount = booking.finalPrice;
      } else {
        payableAmount = booking.pricingBreakdown?.totalAmount || booking.totalAmount || booking.finalPrice;
      }
    } else if (bookingIntent) {
      payableAmount = bookingIntent.totalAmount || 0;
    }

    // Razorpay works in paise (amount * 100)
    const amountInPaise = Math.round(payableAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${booking._id}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ success: false, message: 'Failed to create Razorpay Order' });
    }

    // Store payment intent
    // create payment intent. If bookingIntent provided, attach it and do not create Booking yet.
    const paymentPayload = booking ? { booking: booking._id, amount: booking.totalAmount } : { bookingIntent, amount: bookingIntent.totalAmount };
    const payment = await Payment.create(Object.assign({ user: req.user._id, currency: 'INR', razorpayOrderId: order.id }, paymentPayload));
    
    try {
      billingLogger.logPaymentCreated({
        bookingId: booking._id && booking._id.toString(),
        paymentId: payment._id && payment._id.toString(),
        userId: req.user._id && req.user._id.toString(),
        amount: payment.amount,
        status: payment.status,
        requestId: req.requestId,
        ip: req.ip,
        endpoint: req.originalUrl,
        metadata: { razorpayOrderId: order.id }
      });
    } catch (e) {}
    res.json({ success: true, data: { order, payment, keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykey' } });
  } catch (err) {
    next(err);
  }
};

// @POST /api/payment/verify
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }

    // Lookup payment intent
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    // Verify Signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummysecret')
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      // Mark failed and return
      payment.status = PAYMENT_STATUS.FAILED;
      await payment.save();
      try { billingLogger.logPaymentVerified({ paymentId: payment._id && payment._id.toString(), status: PAYMENT_STATUS.FAILED, requestId: req.requestId, ip: req.ip, endpoint: req.originalUrl, metadata: { reason: 'SIGNATURE_MISMATCH' } }); } catch(e){}
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Idempotency: if already processed, return success
    if (normalizePaymentStatus(payment.status) === PAYMENT_STATUS.PAID) {
      return res.json({ success: true, message: 'Payment already verified' });
    }

    // Defense-in-depth: fetch payment details from Razorpay and verify amount/status
    let rpPayment;
    try {
      // wrap fetch with a timeout to avoid hangs
      const fetchPromise = razorpay.payments.fetch(razorpay_payment_id);
      const timeoutMs = 5000;
      rpPayment = await Promise.race([
        fetchPromise,
        new Promise((_, rej) => setTimeout(() => rej(new Error('Razorpay fetch timeout')), timeoutMs))
      ]);
    } catch (err) {
      console.warn('[verifyPayment] Failed to fetch payment from Razorpay (continuing with signature only):', err.message || err);
      // proceed cautiously: only rely on signature if fetch fails
    }

    const payablePaise = Math.round((payment.amount || 0) * 100);
    if (rpPayment) {
      if (rpPayment.status !== 'captured') {
        payment.status = PAYMENT_STATUS.FAILED;
        await payment.save();
        return res.status(400).json({ success: false, message: 'Payment not captured at gateway' });
      }
      if (rpPayment.amount && rpPayment.amount !== payablePaise) {
        // amount mismatch — do not mark paid automatically
        console.error(`[verifyPayment] Amount mismatch! Expected: ${payablePaise}, Razorpay: ${rpPayment.amount}`);
        await Payment.findByIdAndUpdate(payment._id, { status: PAYMENT_STATUS.FAILED, razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature });
        return res.status(400).json({ success: false, message: `Payment amount mismatch. Expected ${payment.amount} INR but received ${rpPayment.amount/100} INR.` });
      }
    }

    // Use a transaction to atomically update payment and booking
    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      payment.razorpayPaymentId = razorpay_payment_id;
      payment.razorpaySignature = razorpay_signature;
      payment.status = PAYMENT_STATUS.PAID;
      payment.processedAt = new Date();
      if (req.user && req.user._id) payment.processedBy = req.user._id;
      payment.requestId = req.requestId;
      await payment.save({ session });

      // If this payment was made against a bookingIntent, create Booking now (prepaid flow)
      let booking = null;
      if (payment.booking) {
        booking = await Booking.findById(payment.booking).session(session);
        if (booking && normalizePaymentStatus(booking.paymentStatus) !== PAYMENT_STATUS.PAID) {
          booking.paymentStatus = PAYMENT_STATUS.PAID;
          await booking.save({ session });
        }
      } else if (payment.bookingIntent) {
        const intent = payment.bookingIntent;
        const mongoose = require('mongoose');
        const Service = require('../models/Service');
        let resolvedService = intent.service;
        try {
          if (!mongoose.Types.ObjectId.isValid(resolvedService)) {
            const svc = await Service.findOne({ $or: [{ slug: resolvedService }, { name: resolvedService }, { label: resolvedService }] });
            if (svc) resolvedService = svc._id;
            else {
              const fallback = await Service.findOne({}).sort({ _id: 1 });
              if (fallback) resolvedService = fallback._id;
              else resolvedService = null;
            }
          }
        } catch (e) {
          console.warn('[verifyPayment] Error resolving service for bookingIntent:', e && e.message);
          resolvedService = null;
        }

        if (resolvedService) {
          const orderObj = {
            patient: payment.user,
            provider: intent.provider,
            service: resolvedService,
            address: intent.address,
            scheduledAt: intent.scheduledAt || new Date(),
            totalAmount: payment.amount,
            finalAmount: payment.amount,
            status: BOOKING_STATUS.CONFIRMED,
            paymentStatus: PAYMENT_STATUS.PAID,
          };

          const created = await Booking.create([orderObj], { session });
          booking = created[0];
          payment.booking = booking._id;
          await payment.save({ session });

          // Credit provider wallet (guarded)
          try {
            const Provider = require('../models/Provider');
            const Wallet = require('../models/Wallet');
            const Transaction = require('../models/Transaction');

            const provider = await Provider.findById(booking.provider).session(session);
            if (provider) {
              const platformFee = booking.platformFee || Math.round(booking.totalAmount * 0.2 * 100) / 100;
              const netAmount = booking.totalAmount - platformFee;

              const providerWallet = await Wallet.findOneAndUpdate({ user: provider.user }, { $inc: { balance: netAmount } }, { new: true, upsert: true, session });

              const existingTx = await Transaction.findOne({ referenceId: booking._id, referenceType: 'Booking', description: /Booking payment/i }).session(session);
              if (!existingTx) {
                await Transaction.create([{ wallet: providerWallet._id, type: 'CREDIT', amount: netAmount, description: `Booking payment for Booking #${booking._id}`, referenceType: 'Booking', referenceId: booking._id }], { session });
              }
            }
          } catch (err) {
            console.warn('[verifyPayment] provider wallet credit failed', err && err.message);
          }
        } else {
          console.warn('[verifyPayment] Skipping booking creation because service could not be resolved for payment', payment._id && payment._id.toString());
        }
      }

      // Commit
      await session.commitTransaction();
      session.endSession();

      // Create immutable InvoiceSnapshot and generate PDF (best-effort)
      try {
        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
        let invoiceItems = [];
        let discount = 0;
        let subtotal = payment.amount || 0;
        
        if (booking && booking.pricingBreakdown && (booking.pricingBreakdown.visitCharge > 0 || booking.pricingBreakdown.distanceCharge > 0)) {
           invoiceItems.push({ code: 'SERVICE', description: 'Service Fee', quantity: 1, unitPrice: booking.pricingBreakdown.serviceAmount || 0, total: booking.pricingBreakdown.serviceAmount || 0, tax: 0 });
           if (booking.pricingBreakdown.visitCharge > 0) invoiceItems.push({ code: 'VISIT_FEE', description: 'Home Visit Fee', quantity: 1, unitPrice: booking.pricingBreakdown.visitCharge, total: booking.pricingBreakdown.visitCharge, tax: 0 });
           if (booking.pricingBreakdown.distanceCharge > 0) invoiceItems.push({ code: 'DISTANCE_FEE', description: 'Distance Fee', quantity: 1, unitPrice: booking.pricingBreakdown.distanceCharge, total: booking.pricingBreakdown.distanceCharge, tax: 0 });
           discount = booking.pricingBreakdown.discountAmount || 0;
           subtotal = (booking.pricingBreakdown.serviceAmount || 0) + (booking.pricingBreakdown.visitCharge || 0) + (booking.pricingBreakdown.distanceCharge || 0);
        } else {
           invoiceItems = [{ code: 'BOOKING', description: `Booking #${booking?._id}`, quantity: 1, unitPrice: payment.amount || 0, total: payment.amount || 0, tax: 0 }];
        }

        const snapshot = await InvoiceSnapshot.create({
          invoiceNumber,
          booking: booking?._id,
          patient: booking?.patient,
          provider: booking?.provider,
          items: invoiceItems,
          subtotal,
          taxes: 0,
          discount,
          finalAmount: payment.amount || 0,
          paymentMethod: 'razorpay',
          paymentStatus: 'PAID',
          generatedBy: req.user?._id,
        });

        try {
          const pdfRes = await invoicePdfService.generatePdf(snapshot);
          snapshot.invoicePdfUrl = pdfRes.url;
          snapshot.invoiceHtml = await invoicePdfService.renderInvoiceHtml(snapshot);
          await snapshot.save();
        } catch (err) {
          console.warn('[verifyPayment] invoice PDF generation failed', err && err.message);
        }
      } catch (err) {
        console.warn('[verifyPayment] invoice snapshot creation failed', err && err.message);
      }

      // 🔔 Notify Provider (outside transaction)
      if (booking) {
        try {
          const Notification = require('../models/Notification');
          const socketHelper = require('../socket');
          const Provider = require('../models/Provider');
          const provider = await Provider.findById(booking.provider);
          if (provider) {
            const pNotif = await Notification.create({
              user: provider.user,
              title: 'Payment Successful',
              message: `Payment of ₹${payment.amount} received.`,
              type: 'PAYMENT',
              linkId: booking._id
            });
            try {
              socketHelper.getIO().to(provider.user.toString()).emit('notification', pNotif);
            } catch(e) {}
          }
          
          // 📧 Email Payment Success to Patient
          try {
            await booking.populate('patient', 'name email');
            if (booking.patient && booking.patient.email) {
              emailService.sendPaymentSuccess(booking.patient.email, booking.patient.name, payment.amount, booking._id, 'Razorpay');
            }
          } catch(e) { console.error('Failed to send payment success email', e); }
        } catch (e) {
          console.warn('[verifyPayment] best-effort notifications failed', e && e.message);
        }
      }

      // Log payment verification
      try {
        billingLogger.logPaymentVerified({
          paymentId: payment._id && payment._id.toString(),
          bookingId: payment.booking && payment.booking.toString(),
          userId: payment.user && payment.user.toString(),
          amount: payment.amount,
          status: 'SUCCESS',
          requestId: req.requestId,
          ip: req.ip,
          endpoint: req.originalUrl
        });
      } catch (e) {}

      return res.json({ success: true, message: 'Payment successfully verified' });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

// @POST /api/payment/pay-with-wallet
exports.payWithWallet = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const Wallet = require('../models/Wallet');
    const Transaction = require('../models/Transaction');

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    if (booking.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (normalizePaymentStatus(booking.paymentStatus) === PAYMENT_STATUS.PAID) {
      return res.status(400).json({ success: false, message: 'Booking is already paid' });
    }

    // Amount to be paid
    let payableAmount = 0;
    if (booking.priceUpdated && booking.priceApprovedByPatient && booking.finalPrice) {
      payableAmount = booking.finalPrice;
    } else {
      payableAmount = booking.pricingBreakdown?.totalAmount || booking.totalAmount || booking.finalPrice;
    }

    // Atomically deduct from wallet to avoid race conditions
    const updatedWallet = await Wallet.findOneAndUpdate(
      { user: req.user._id, balance: { $gte: payableAmount } },
      { $inc: { balance: -payableAmount } },
      { new: true }
    );

    if (!updatedWallet) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    // Create Transaction
    await Transaction.create({
      wallet: updatedWallet._id,
      type: 'DEBIT',
      amount: payableAmount,
      description: `Payment for Booking (Booking ID: ${booking._id})`,
      referenceId: booking._id,
    });

    try {
      billingLogger.logWalletDebit({
        bookingId: booking._id && booking._id.toString(),
        userId: req.user._id && req.user._id.toString(),
        amount: payableAmount,
        status: 'COMPLETED',
        requestId: req.requestId,
        ip: req.ip,
        endpoint: req.originalUrl
      });
    } catch (e) {}

    // Mark Booking Paid
    booking.paymentStatus = PAYMENT_STATUS.PAID;
    await booking.save();

    // 🔔 Notify Provider
    const Notification = require('../models/Notification');
    const socketHelper = require('../socket');
    const Provider = require('../models/Provider');
    const provider = await Provider.findById(booking.provider);
    if (provider) {
      const pNotif = await Notification.create({
        user: provider.user,
        title: 'Payment Successful (Wallet)',
        message: `Payment of ₹${payableAmount} received via patient wallet.`,
        type: 'PAYMENT',
        linkId: booking._id
      });
      try {
        socketHelper.getIO().to(provider.user.toString()).emit('notification', pNotif);
      } catch(e) {}
    }

    res.json({ success: true, message: 'Payment successful using wallet balance', data: { booking } });
  } catch (err) {
    next(err);
  }
};

// @POST /api/payment/lab/create-order
exports.createLabPayment = async (req, res, next) => {
  try {
    const { orderId, labIntent } = req.body;
    const LabOrder = require('../models/LabOrder');
    const LabTest = require('../models/LabTest');

    let amount = 0;
    let paymentPayload = {};

    if (orderId) {
      const labOrder = await LabOrder.findById(orderId);
      if (!labOrder) return res.status(404).json({ success: false, message: 'Lab Order not found' });
      if (labOrder.patient.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
      if (normalizePaymentStatus(labOrder.paymentStatus) === PAYMENT_STATUS.PAID) {
        return res.status(400).json({ success: false, message: 'Lab Order is already paid' });
      }
      amount = labOrder.totalAmount;
      paymentPayload = { labOrder: labOrder._id };
    } else if (labIntent) {
      // labIntent expected: { partnerId, testIds: [], scheduledDate, scheduledTime, collectionType, collectionAddress, memberId }
      if (!labIntent.testIds || !Array.isArray(labIntent.testIds) || !labIntent.testIds.length) {
        return res.status(400).json({ success: false, message: 'Invalid labIntent: testIds required' });
      }
      const tests = await LabTest.find({ _id: { $in: labIntent.testIds } });
      if (tests.length !== labIntent.testIds.length) {
        return res.status(400).json({ success: false, message: 'One or more tests invalid for labIntent' });
      }
      amount = tests.reduce((s, t) => s + (t.price || 0), 0);
      paymentPayload = { labIntent };
    } else {
      return res.status(400).json({ success: false, message: 'orderId or labIntent required' });
    }

    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_lab_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      return res.status(500).json({ success: false, message: 'Failed to create Razorpay Order' });
    }

    const payment = await Payment.create(Object.assign({
      user: req.user._id,
      amount: amount,
      currency: 'INR',
      razorpayOrderId: order.id,
    }, paymentPayload));

    try {
      billingLogger.logPaymentCreated({
        paymentId: payment._id && payment._id.toString(),
        userId: req.user._id && req.user._id.toString(),
        amount: payment.amount,
        status: payment.status,
        requestId: req.requestId,
        ip: req.ip,
        endpoint: req.originalUrl,
        metadata: { razorpayOrderId: order.id, labOrder: payment.labOrder }
      });
    } catch(e) {}

    res.json({ success: true, data: { order, payment, keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykey' } });
  } catch (err) {
    next(err);
  }
};

// @POST /api/payment/lab/verify
exports.verifyLabPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment details' });
    }
    
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });

    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'dummysecret')
      .update(body.toString())
      .digest('hex');
      
    if (expectedSignature !== razorpay_signature) {
      payment.status = 'FAILED';
      await payment.save();
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    if (normalizePaymentStatus(payment.status) === PAYMENT_STATUS.PAID) {
      const LabOrder = require('../models/LabOrder');
      const labOrder = await LabOrder.findById(payment.labOrder);
      return res.json({ success: true, message: 'Payment already verified', data: labOrder });
    }

    // Fetch Razorpay payment for defense-in-depth
    let rpPayment;
    try {
      rpPayment = await razorpay.payments.fetch(razorpay_payment_id);
    } catch (err) {
      console.warn('[verifyLabPayment] Failed to fetch payment from Razorpay:', err.message || err);
    }

    const payablePaise = Math.round((payment.amount || 0) * 100);
    if (rpPayment) {
      if (rpPayment.status !== 'captured') {
        payment.status = 'FAILED';
        await payment.save();
        return res.status(400).json({ success: false, message: 'Payment not captured at gateway' });
      }
      if (rpPayment.amount && rpPayment.amount !== payablePaise) {
        await Payment.findByIdAndUpdate(payment._id, { status: 'FAILED', razorpayPaymentId: razorpay_payment_id, razorpaySignature: razorpay_signature });
        return res.status(400).json({ success: false, message: 'Payment amount mismatch' });
      }
    }

    // Atomic updates: Payment + LabOrder + PartnerWallet + PartnerTransaction
    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      payment.razorpayPaymentId = razorpay_payment_id;
      payment.razorpaySignature = razorpay_signature;
      payment.status = 'SUCCESS';
      payment.processedAt = new Date();
      if (req.user && req.user._id) payment.processedBy = req.user._id;
      payment.requestId = req.requestId;
      await payment.save({ session });

      const LabOrder = require('../models/LabOrder');
      const PartnerWallet = require('../models/PartnerWallet');
      const PartnerTransaction = require('../models/PartnerTransaction');

      // If this payment was created as a labIntent (prepaid flow), create the LabOrder now
      let labOrder = null;
      if (payment.labOrder) {
        labOrder = await LabOrder.findById(payment.labOrder).session(session);
      } else if (payment.labIntent) {
        // Build order payload from labIntent and create order atomically
        const intent = payment.labIntent;
        const orderObj = {
          orderId: `LAB-${Date.now()}`,
          patient: payment.user,
          partner: intent.partnerId,
          tests: intent.testIds,
          member: intent.memberId,
          address: intent.addressId,
          totalAmount: payment.amount,
          platformFee: intent.platformFee || 0,
          labPayout: intent.labPayout || payment.amount,
          commissionUsed: intent.commissionUsed,
          commissionSource: intent.commissionSource,
          scheduledDate: intent.scheduledDate,
          scheduledTime: intent.scheduledTime,
          collectionType: intent.collectionType,
          collectionAddress: intent.collectionAddress,
          paymentStatus: 'paid',
          paymentMethod: 'razorpay',
          paymentCollectedAt: Date.now(),
          paymentCollectedBy: 'system',
          reportLocked: false,
          reportReleasedAt: Date.now(),
          releaseReason: 'Online Payment Verified',
        };

        const created = await LabOrder.create([orderObj], { session });
        labOrder = created[0];
        payment.labOrder = labOrder._id;
        await payment.save({ session });
      }

      if (labOrder) {
        labOrder.paymentStatus = PAYMENT_STATUS.PAID;
        if (normalizeBookingStatus(labOrder.status) === 'NEW') labOrder.status = BOOKING_STATUS.CONFIRMED;
        labOrder.paymentMethod = 'razorpay';
        labOrder.paymentCollectedAt = Date.now();
        labOrder.paymentCollectedBy = 'system';
        labOrder.reportLocked = false;
        labOrder.reportReleasedAt = Date.now();
        labOrder.releaseReason = 'Online Payment Verified';
        await labOrder.save({ session });
      }

      // If order already completed/report_uploaded, credit partner (guarded by existingTx)
      const nbs = normalizeBookingStatus(labOrder.status);
      if (labOrder && (nbs === BOOKING_STATUS.COMPLETED || nbs === 'REPORT_UPLOADED')) {
          const existingTx = await PartnerTransaction.findOne({ order: labOrder._id, type: 'credit' }).session(session);
          if (!existingTx) {
              const platformFee = labOrder.totalAmount * 0.2;
              const netAmount = labOrder.totalAmount - platformFee;

              const wallet = await PartnerWallet.findOneAndUpdate(
                  { partner: labOrder.partner },
                  { $inc: { balance: netAmount, totalEarned: netAmount } },
                  { new: true, upsert: true, session }
              );

              await PartnerTransaction.create([{
                  partner: labOrder.partner,
                  wallet: wallet._id,
                  order: labOrder._id,
                  type: 'credit',
                  amount: labOrder.totalAmount,
                  platformCommission: platformFee,
                  netAmount: netAmount,
                  description: `Earnings for Lab Order #${labOrder._id.toString().slice(-6).toUpperCase()} (Online Payment)`
              }], { session });
          }
      }

      await session.commitTransaction();
      session.endSession();

      // Create immutable InvoiceSnapshot and try to generate PDF (best-effort)
      try {
        const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
        const snapshot = await InvoiceSnapshot.create({
          invoiceNumber,
          labOrder: labOrder?._id,
          patient: labOrder?.patient || payment.user,
          provider: labOrder?.partner,
          items: [{ code: 'LAB', description: `Lab Order #${labOrder?._id}`, quantity: 1, unitPrice: payment.amount || 0, total: payment.amount || 0, tax: 0 }],
          subtotal: payment.amount || 0,
          taxes: 0,
          discount: 0,
          finalAmount: payment.amount || 0,
          paymentMethod: 'razorpay',
          paymentStatus: 'PAID',
          generatedBy: req.user?._id,
        });

        try {
          const pdfRes = await invoicePdfService.generatePdf(snapshot);
          snapshot.invoicePdfUrl = pdfRes.url;
          snapshot.invoiceHtml = await invoicePdfService.renderInvoiceHtml(snapshot);
          await snapshot.save();
        } catch (err) {
          console.warn('[verifyLabPayment] invoice PDF generation failed', err && err.message);
        }
      } catch (err) {
        console.warn('[verifyLabPayment] invoice snapshot creation failed', err && err.message);
      }

      res.json({ success: true, message: 'Payment successfully verified', data: labOrder });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

// @POST /api/payments
// Strict simulated lab payment endpoint. Frontend sends only { orderId }.
exports.initiateLabPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Order ID required' });
    }

    const LabOrder = require('../models/LabOrder');
    const order = await LabOrder.findOne({
      _id: orderId,
      patient: req.user.id,
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const nps = normalizePaymentStatus(order.paymentStatus);
    if (nps === PAYMENT_STATUS.PAID || nps === PAYMENT_STATUS.COLLECTED) {
      return res.status(400).json({ success: false, message: 'Payment already completed' });
    }

    if (order.paymentMethod === 'cod') {
      return res.status(400).json({
        success: false,
        message: 'Cash at collection must be marked collected by admin or lab partner',
      });
    }

    order.paymentStatus = 'paid';
    if (order.status === 'new') order.status = 'confirmed';
    order.paymentCollectedAt = Date.now();
    order.paymentCollectedBy = 'system';
    order.reportLocked = false;
    order.reportReleasedAt = Date.now();
    order.releaseReason = 'Payment Completed';
    await order.save();

    return res.json({
      success: true,
      message: 'Payment successful',
      data: { order },
    });
  } catch (err) {
    return next(err);
  }
};

// POST /api/payments/mark-cash-collected/:id
exports.markCashCollectedBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amountCollected, note, proofUrl } = req.body;
    const Booking = require('../models/Booking');
    const Provider = require('../models/Provider');
    const Wallet = require('../models/Wallet');
    const Transaction = require('../models/Transaction');
    const Notification = require('../models/Notification');

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Authorization: admin OR provider owner OR partner (if partner role)
    if (!(req.user.role === 'admin')) {
      const provider = await Provider.findById(booking.provider);
      if (!provider) return res.status(403).json({ success: false, message: 'Unauthorized' });
      if (provider.user.toString() !== req.user._id.toString() && req.user.role !== 'partner') {
        return res.status(403).json({ success: false, message: 'Unauthorized' });
      }
    }

    // Idempotency: already collected or paid — return success
    const currentPaymentStatus = normalizePaymentStatus(booking.paymentStatus);
    if (currentPaymentStatus === PAYMENT_STATUS.PAID) {
      return res.status(200).json({ success: true, message: 'Payment already confirmed as paid', data: booking });
    }
    if (currentPaymentStatus === PAYMENT_STATUS.PENDING_CONFIRMATION || currentPaymentStatus === PAYMENT_STATUS.COLLECTED) {
      return res.status(200).json({ success: true, message: 'Cash already marked as collected — awaiting patient confirmation', data: booking });
    }

    // ── COD Hold Flow: mark COLLECTED, do NOT credit provider yet ──────────────
    booking.collectedAmount = amountCollected || booking.totalAmount;
    booking.collectedBy = req.user._id;
    booking.collectedAt = Date.now();
    booking.paymentCollectionNote = note || booking.paymentCollectionNote;
    // New safe statuses: provider is NOT credited until patient confirms
    booking.status = BOOKING_STATUS.COLLECTED;
    booking.paymentStatus = PAYMENT_STATUS.PENDING_CONFIRMATION;
    booking.patientConfirmed = null;
    booking.disputeRaised = false;
    await booking.save();

    // Generate invoice snapshot (best-effort, no session needed as no financial ops here)
    try {
      const InvoiceSnapshot = require('../models/InvoiceSnapshot');
      const invoicePdfService = require('../services/invoicePdfService');
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
      let invoiceItems = [];
      let discount = 0;
      let subtotal = booking.totalAmount || 0;
      
      if (booking.pricingBreakdown && (booking.pricingBreakdown.visitCharge > 0 || booking.pricingBreakdown.distanceCharge > 0)) {
         invoiceItems.push({ code: 'SERVICE', description: 'Service Fee', quantity: 1, unitPrice: booking.pricingBreakdown.serviceAmount || 0, total: booking.pricingBreakdown.serviceAmount || 0, tax: 0 });
         if (booking.pricingBreakdown.visitCharge > 0) invoiceItems.push({ code: 'VISIT_FEE', description: 'Home Visit Fee', quantity: 1, unitPrice: booking.pricingBreakdown.visitCharge, total: booking.pricingBreakdown.visitCharge, tax: 0 });
         if (booking.pricingBreakdown.distanceCharge > 0) invoiceItems.push({ code: 'DISTANCE_FEE', description: 'Distance Fee', quantity: 1, unitPrice: booking.pricingBreakdown.distanceCharge, total: booking.pricingBreakdown.distanceCharge, tax: 0 });
         discount = booking.pricingBreakdown.discountAmount || 0;
         subtotal = (booking.pricingBreakdown.serviceAmount || 0) + (booking.pricingBreakdown.visitCharge || 0) + (booking.pricingBreakdown.distanceCharge || 0);
      } else {
         invoiceItems = [{ code: 'BOOKING', description: `Booking #${booking._id}`, quantity: 1, unitPrice: booking.totalAmount, total: booking.totalAmount, tax: 0 }];
      }

      const snapshot = await InvoiceSnapshot.create([{
        invoiceNumber,
        booking: booking._id,
        patient: booking.patient,
        provider: booking.provider,
        items: invoiceItems,
        subtotal,
        taxes: 0,
        discount,
        finalAmount: booking.totalAmount,
        paymentMethod: 'CASH',
        paymentStatus: 'PENDING_CONFIRMATION',
      }]);
      try {
        const pdfRes = await invoicePdfService.generatePdf(snapshot[0]);
        snapshot[0].invoicePdfUrl = pdfRes.url;
        snapshot[0].invoiceHtml = await invoicePdfService.renderInvoiceHtml(snapshot[0]);
        await snapshot[0].save();
      } catch (e) {}
    } catch (e) {
      console.warn('[markCashCollectedBooking] invoice generation failed', e && e.message);
    }

    // Notify patient to confirm or dispute (outside transaction)
    try {
      await Notification.create({
        user: booking.patient,
        title: 'Cash payment recorded — please confirm',
        message: `Your care provider marked ₹${booking.collectedAmount} collected in cash. Does this match what you paid? Please confirm or report an issue.`,
        type: 'PAYMENT',
        linkId: booking._id
      });
    } catch (e) {}

    res.json({ success: true, message: 'Cash marked as collected. Awaiting patient confirmation — provider will be paid after confirmation.', data: booking });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/confirm-cash/:id
// Patient confirms the cash amount collected by the provider.
// This is the ONLY point where the provider wallet is credited for COD bookings.
exports.confirmCash = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Booking = require('../models/Booking');
    const booking = await Booking.findById(id).populate('provider');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.patient.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });

    // Idempotency: already confirmed
    if (booking.patientConfirmed === true && normalizePaymentStatus(booking.paymentStatus) === PAYMENT_STATUS.PAID) {
      return res.json({ success: true, message: 'Already confirmed and payment marked as paid' });
    }

    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // ── Transition: COLLECTED → PAID ──────────────────────────────────────
      booking.patientConfirmed = true;
      booking.patientConfirmedAt = Date.now();
      booking.paymentStatus = PAYMENT_STATUS.PAID;
      booking.status = BOOKING_STATUS.PAID;
      await booking.save({ session });

      // ── Credit provider wallet (atomic, idempotent) ───────────────────────
      if (booking.provider) {
        const providerDoc = booking.provider.user
          ? booking.provider       // already populated
          : await Provider.findById(booking.provider).session(session);

        if (providerDoc) {
          const providerUserId = providerDoc.user?._id || providerDoc.user;
          const platformFee = booking.platformFee || Math.round((booking.totalAmount || 0) * 0.2);
          const netAmount = (booking.totalAmount || 0) - platformFee;

          // Idempotency: check for any existing CREDIT for this booking
          const existingTx = await Transaction.findOne({
            referenceId: booking._id,
            referenceType: 'Booking',
            type: 'CREDIT',
          }).session(session);

          if (!existingTx) {
            const providerWallet = await Wallet.findOneAndUpdate(
              { user: providerUserId },
              { $inc: { balance: netAmount } },
              { new: true, upsert: true, session }
            );
            await Transaction.create([{
              wallet: providerWallet._id,
              type: 'CREDIT',
              amount: netAmount,
              description: `COD Payment Confirmed — Booking #${booking._id}`,
              referenceType: 'Booking',
              referenceId: booking._id,
            }], { session });

            console.info(`[confirmCash] Provider credited ₹${netAmount} for booking ${booking._id}`);
          } else {
            console.warn(`[confirmCash] Skipping duplicate credit for booking ${booking._id}`);
          }
        }
      }

      await session.commitTransaction();
      session.endSession();
    } catch (txErr) {
      await session.abortTransaction();
      session.endSession();
      throw txErr;
    }

    // ── Post-confirmation notifications (best-effort, outside transaction) ──
    try {
      await Notification.create({
        user: booking.patient,
        title: 'Payment confirmed ✓',
        message: `Your payment of ₹${booking.collectedAmount || booking.totalAmount} has been confirmed. Thank you!`,
        type: 'PAYMENT',
        linkId: booking._id,
      });
    } catch (e) {}

    // ── Trigger referral bonus (best-effort) ─────────────────────────────────
    try {
      const bookingController = require('./bookingController');
      if (typeof bookingController.triggerReferralBonus === 'function') {
        await bookingController.triggerReferralBonus(booking);
      }
    } catch (e) {}

    // Re-fetch for clean response
    const updated = await Booking.findById(id).lean();
    res.json({ success: true, message: 'Thank you for confirming the cash payment. Provider has been credited.', data: updated });
  } catch (err) {
    next(err);
  }
};

// POST /api/payments/report-cash-issue/:id
// Patient reports a dispute with the cash amount collected by the provider.
exports.reportCashIssue = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { issue } = req.body;
    const Booking = require('../models/Booking');
    const booking = await Booking.findById(id)
      .populate('patient', 'name phone')
      .populate({ path: 'provider', populate: { path: 'user', select: 'name phone' } });
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.patient._id.toString() !== req.user._id.toString()) return res.status(403).json({ success: false, message: 'Not authorized' });

    // Idempotency: already disputed
    if (booking.disputeRaised && booking.paymentStatus === PAYMENT_STATUS.DISPUTED) {
      return res.json({ success: true, message: 'Dispute already recorded.' });
    }

    // Set DISPUTED — do NOT credit provider, booking remains COLLECTED
    booking.disputeRaised = true;
    booking.paymentStatus = PAYMENT_STATUS.DISPUTED;
    booking.paymentCollectionNote = (booking.paymentCollectionNote || '') + `\nPATIENT_DISPUTE [${new Date().toISOString()}]: ` + (issue || 'Amount disputed by patient');
    await booking.save();

    // Notify admins with full context
    try {
      const User = require('../models/User');
      const admins = await User.find({ role: 'admin' }).select('_id');
      if (admins && admins.length) {
        const patientName = booking.patient?.name || 'Patient';
        const providerName = booking.provider?.user?.name || 'Provider';
        const amount = booking.collectedAmount || booking.totalAmount || 0;
        const notes = admins.map(a => ({
          user: a._id,
          title: '⚠️ COD Dispute Raised',
          message: `${patientName} disputes ₹${amount} cash collected by ${providerName} for booking #${booking._id.toString().slice(-6).toUpperCase()}. Issue: ${issue || 'Not specified'}`,
          type: 'SYSTEM',
          linkId: booking._id
        }));
        await Notification.insertMany(notes);
        
        // 📧 Email Admins and Patient about Dispute
        try {
          const adminEmails = admins.map(a => a.email).filter(Boolean);
          adminEmails.forEach(email => emailService.sendDisputeRaised(email, 'admin', booking._id));
          
          if (booking.patient && booking.patient.email) {
            emailService.sendDisputeRaised(booking.patient.email, 'patient', booking._id);
          }
          if (booking.provider && booking.provider.user && booking.provider.user.email) {
            emailService.sendDisputeRaised(booking.provider.user.email, 'provider', booking._id);
          }
        } catch (e) { console.error('Failed to send dispute raised emails', e); }
      }
    } catch (e) {}

    res.json({ success: true, message: 'Dispute recorded. Admin will review and follow up within 24 hours.', data: booking });
  } catch (err) {
    next(err);
  }
};

// @POST /api/payment/sync/:paymentId
exports.syncPaymentStatus = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found' });
    
    if (normalizePaymentStatus(payment.status) === PAYMENT_STATUS.PAID) {
      return res.json({ success: true, message: 'Payment already verified as PAID' });
    }

    if (!payment.razorpayOrderId) {
       return res.status(400).json({ success: false, message: 'No Razorpay Order ID found for this payment' });
    }

    // Fetch from Razorpay
    const rpOrders = await razorpay.orders.fetchPayments(payment.razorpayOrderId);
    const successfulPayment = rpOrders.items.find(p => p.status === 'captured');

    if (successfulPayment) {
       const expectedPaise = Math.round((payment.amount || 0) * 100);
       if (successfulPayment.amount === expectedPaise) {
          payment.status = PAYMENT_STATUS.PAID;
          payment.razorpayPaymentId = successfulPayment.id;
          payment.processedAt = new Date();
          await payment.save();

          if (payment.booking) {
             const booking = await Booking.findById(payment.booking);
             if (booking && normalizePaymentStatus(booking.paymentStatus) !== PAYMENT_STATUS.PAID) {
                booking.paymentStatus = PAYMENT_STATUS.PAID;
                await booking.save();
             }
          }
          
          try {
            billingLogger.logPaymentVerified({
              paymentId: payment._id.toString(),
              status: PAYMENT_STATUS.PAID,
              metadata: { method: 'MANUAL_SYNC', rpPaymentId: successfulPayment.id }
            });
          } catch(e) {}

          return res.json({ success: true, message: 'Payment recovered and verified successfully' });
       } else {
          return res.status(400).json({ success: false, message: `Amount mismatch during recovery. Expected ${payment.amount}, found ${successfulPayment.amount/100}` });
       }
    }

    res.status(404).json({ success: false, message: 'No successful payment found on Razorpay for this order.' });
  } catch (err) {
    next(err);
  }
};
