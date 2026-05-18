const crypto = require('crypto');
const WebhookLog = require('../models/WebhookLog');
const Payment = require('../models/Payment');
const billingLogger = require('../utils/billingLogger');
const { PAYMENT_STATUS, normalizePaymentStatus } = require('../constants/bookingStatus');

// Minimal, idempotent Razorpay webhook handler
exports.handleRazorpay = async (req, res) => {
  try {
    try {
      billingLogger.logWebhookReceived({
        eventId: req.headers['x-razorpay-event-id'] || req.body?.id,
        provider: 'razorpay',
        eventType: req.body?.event || null,
        requestId: req.requestId,
        ip: req.ip,
        endpoint: req.originalUrl,
        metadata: { rawLength: (req.rawBody || '').length }
      });
    } catch(e){}
    const signature = req.headers['x-razorpay-signature'] || req.headers['X-Razorpay-Signature'];
    const eventId = req.headers['x-razorpay-event-id'] || req.headers['X-Razorpay-Event-Id'] || (req.body && req.body.id);
    const raw = req.rawBody || JSON.stringify(req.body || {});
    const payloadHash = crypto.createHash('sha256').update(raw).digest('hex');

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      console.error('[webhook] No webhook secret configured');
      return res.status(500).json({ success: false, message: 'Webhook secret not configured' });
    }

    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    if (!signature || expected !== signature) {
      console.warn('[webhook] Signature mismatch');
      // Persist the event for forensic analysis
      await WebhookLog.create({ eventId, provider: 'razorpay', eventType: req.body?.event || req.body?.payload?.event, payload: req.body, signature, headers: req.headers, processed: false, requestId: req.requestId });
      try { billingLogger.logWebhookReceived({ eventId, provider: 'razorpay', status: 'INVALID_SIGNATURE', requestId: req.requestId, ip: req.ip, endpoint: req.originalUrl }); } catch(e){}
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // Deduplicate by eventId or payloadHash when available
    const existing = await WebhookLog.findOne({ $or: [ { eventId }, { payloadHash } ].filter(Boolean) });
    if (existing) {
      if (existing.processed) return res.json({ success: true, message: 'Already processed' });
    }

    const log = await WebhookLog.create({ eventId, provider: 'razorpay', eventType: req.body?.event || req.body?.payload?.event, payload: req.body, payloadHash, signature, headers: req.headers, processed: false, requestId: req.requestId });

    // Basic processor for payment.captured — use transaction if available
    const eventType = req.body?.event || req.body?.payload?.event;
    if (eventType === 'payment.captured' || (req.body?.payload && req.body.payload.payment && req.body.payload.payment.entity && req.body.payload.payment.entity.status === 'captured')) {
      const paymentEntity = req.body.payload?.payment?.entity || req.body?.entity || req.body?.payload?.payment?.entity;
      const razorpayPaymentId = paymentEntity?.id;
      const amount = paymentEntity?.amount; // paise

      if (razorpayPaymentId) {
        const mongoose = require('mongoose');
        const session = await mongoose.startSession();
        try {
          session.startTransaction();

          // Try to find payment by razorpayPaymentId or by order mapping
          let payment = await Payment.findOne({ razorpayPaymentId }).session(session);
          if (!payment) {
            // try by order mapping if paymentId not yet set
            payment = await Payment.findOne({ razorpayOrderId: req.body?.payload?.payment?.entity?.order_id || req.body?.order_id }).session(session);
          }

          if (!payment) {
            await session.commitTransaction();
            session.endSession();
          } else {
            if (normalizePaymentStatus(payment.status) === PAYMENT_STATUS.PAID) {
              await session.commitTransaction();
              session.endSession();
            } else {
              // Compare amounts (convert stored amount to paise if needed)
              const expectedPaise = Math.round((payment.amount || 0) * 100);
              if (!amount || amount === expectedPaise) {
                payment.razorpayPaymentId = razorpayPaymentId;
                payment.status = PAYMENT_STATUS.PAID;
                await payment.save({ session });

                // Update booking paymentStatus atomically if booking exists
                if (payment.booking) {
                  const Booking = require('../models/Booking');
                  const booking = await Booking.findById(payment.booking).session(session);
                  const { normalizePaymentStatus: nps } = require('../constants/bookingStatus');
                  if (booking && nps(booking.paymentStatus) !== PAYMENT_STATUS.PAID) {
                    booking.paymentStatus = PAYMENT_STATUS.PAID;
                    await booking.save({ session });
                  }
                }

                // Mark webhook log processed within transaction
                await WebhookLog.findByIdAndUpdate(log._id, { processed: true, processedAt: new Date() }, { session });

                await session.commitTransaction();
                session.endSession();
              } else {
                // amount mismatch — do not mark payment; keep for manual review
                await session.abortTransaction();
                session.endSession();
              }
            }
          }
        } catch (err) {
          await session.abortTransaction();
          session.endSession();
          throw err;
        }
      }
    }
    return res.json({ success: true });
  } catch (err) {
    console.error('[webhook] error', err);
    return res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
};
