const crypto = require('crypto');
const mongoose = require('mongoose');
const WebhookLog = require('../models/WebhookLog');
const Payment = require('../models/Payment');
const Refund = require('../models/Refund');
const billingLogger = require('../utils/billingLogger');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test', key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy' });

// POST /api/webhooks/razorpay
exports.handle = async (req, res) => {
  try {
    const raw = req.rawBody || JSON.stringify(req.body || {});
    const signature = req.headers['x-razorpay-signature'] || req.headers['X-Razorpay-Signature'];
    const eventId = req.headers['x-razorpay-event-id'] || req.body?.id;
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    billingLogger.logWebhookReceived({ eventId, provider: 'razorpay', eventType: req.body?.event, requestId: req.requestId, ip: req.ip, endpoint: req.originalUrl });

    if (!secret) {
      console.error('[razorpayWebhook] missing secret');
      return res.status(500).json({ success: false, message: 'Webhook secret not configured' });
    }

    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
    if (!signature || expected !== signature) {
      console.warn('[razorpayWebhook] signature mismatch');
      await WebhookLog.create({ eventId, provider: 'razorpay', eventType: req.body?.event, payload: req.body, signature, headers: req.headers, processed: false, requestId: req.requestId, payloadHash: crypto.createHash('sha256').update(raw).digest('hex') });
      billingLogger.logReconciliationIssue({ eventId, status: 'INVALID_SIGNATURE', requestId: req.requestId });
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const payloadHash = crypto.createHash('sha256').update(raw).digest('hex');
    const existing = await WebhookLog.findOne({ $or: [{ eventId }, { payloadHash }] });
    if (existing && existing.processed) {
      return res.json({ success: true, message: 'Already processed' });
    }

    const log = await WebhookLog.create({ eventId, provider: 'razorpay', eventType: req.body?.event, payload: req.body, signature, headers: req.headers, processed: false, requestId: req.requestId, payloadHash });

    const eventType = req.body?.event || req.body?.payload?.event;
    // Process main events safely
    if (eventType === 'payment.captured' || eventType === 'payment.failed' || eventType === 'refund.processed' || eventType === 'order.paid') {
      const session = await mongoose.startSession();
      try {
        session.startTransaction();

        if (eventType === 'payment.captured') {
          const paymentEntity = req.body.payload?.payment?.entity || req.body?.payload?.payment;
          const rpId = paymentEntity?.id;
          const orderId = paymentEntity?.order_id;
          const amount = paymentEntity?.amount; // paise

          // Try find local payment
          let payment = await Payment.findOne({ razorpayPaymentId: rpId }).session(session);
          if (!payment) payment = await Payment.findOne({ razorpayOrderId: orderId }).session(session);

          if (payment) {
            // validate amount
            const expectedPaise = Math.round((payment.amount || 0) * 100);
            if (amount && amount !== expectedPaise) {
              billingLogger.logReconciliationIssue({ paymentId: payment._id.toString(), amount, metadata: { expectedPaise } });
              // do not mark processed; leave for manual review
            } else if (payment.status !== 'SUCCESS') {
              payment.razorpayPaymentId = rpId;
              payment.status = 'SUCCESS';
              payment.processedAt = new Date();
              payment.requestId = req.requestId;
              await payment.save({ session });
            }
          }
        }

        if (eventType === 'payment.failed') {
          const paymentEntity = req.body.payload?.payment?.entity;
          const rpId = paymentEntity?.id;
          const payment = await Payment.findOne({ razorpayPaymentId: rpId }).session(session);
          if (payment && payment.status !== 'SUCCESS') {
            payment.status = 'FAILED';
            payment.requestId = req.requestId;
            await payment.save({ session });
          }
        }

        if (eventType === 'refund.processed') {
          const refundEntity = req.body.payload?.refund?.entity || req.body.payload?.refund;
          const rpRefundId = refundEntity?.id;
          const rpPaymentId = refundEntity?.payment_id;
          // Create/Update Refund record
          let refund = await Refund.findOne({ gatewayRefundId: rpRefundId }).session(session);
          if (!refund) {
            // map to payment
            const payment = await Payment.findOne({ razorpayPaymentId: rpPaymentId }).session(session);
            refund = await Refund.create([{
              payment: payment?._id,
              amount: (refundEntity?.amount || 0) / 100,
              reason: refundEntity?.notes || 'Gateway refund',
              refundStatus: 'COMPLETED',
              gatewayRefundId: rpRefundId,
              initiatedBy: null,
              processedAt: new Date(),
              metadata: { raw: refundEntity }
            }], { session });
          }
        }

        await WebhookLog.findByIdAndUpdate(log._id, { processed: true, processedAt: new Date() }, { session });
        await session.commitTransaction();
        session.endSession();
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        console.error('[razorpayWebhook] processing error', err);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[razorpayWebhook] fatal error', err);
    return res.status(500).json({ success: false, message: 'Webhook processing error' });
  }
};

exports.razorpay = razorpay; // expose for tests
