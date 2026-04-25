const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykey',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummysecret',
});

// @POST /api/payment/create-order
exports.createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (booking.paymentStatus === 'PAID') {
      return res.status(400).json({ success: false, message: 'Booking is already paid' });
    }
    if (booking.status !== 'confirmed') {
      return res.status(400).json({ success: false, message: 'Only confirmed bookings can be paid' });
    }

    // 🔒 Block payment if price updated but not approved
    if (booking.priceUpdated && !booking.priceApprovedByPatient) {
      return res.status(400).json({ success: false, message: 'Please approve the updated price before making payment' });
    }

    // Use the correct price: finalPrice if updated & approved, else totalAmount
    const payableAmount = (booking.priceUpdated && booking.priceApprovedByPatient && booking.finalPrice)
      ? booking.finalPrice
      : booking.totalAmount;

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
    const payment = await Payment.create({
      user: req.user._id,
      booking: booking._id,
      amount: booking.totalAmount, // Store in actual INR internally
      currency: 'INR',
      razorpayOrderId: order.id,
    });

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

    if (isAuthentic) {
      // Mark Payment success
      payment.razorpayPaymentId = razorpay_payment_id;
      payment.razorpaySignature = razorpay_signature;
      payment.status = 'SUCCESS';
      await payment.save();

      // Mark Booking Paid
      const booking = await Booking.findByIdAndUpdate(payment.booking, { paymentStatus: 'PAID' }, { new: true });

      // 🔔 Notify Provider
      if (booking) {
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
      }

      res.json({ success: true, message: 'Payment successfully verified' });
    } else {
      payment.status = 'FAILED';
      await payment.save();
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
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

    if (booking.paymentStatus === 'PAID') {
      return res.status(400).json({ success: false, message: 'Booking is already paid' });
    }

    // Amount to be paid
    const payableAmount = (booking.priceUpdated && booking.priceApprovedByPatient && booking.finalPrice)
      ? booking.finalPrice
      : booking.totalAmount;

    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet || wallet.balance < payableAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient wallet balance' });
    }

    // Deduct from wallet
    wallet.balance -= payableAmount;
    await wallet.save();

    // Create Transaction
    await Transaction.create({
      wallet: wallet._id,
      type: 'DEBIT',
      amount: payableAmount,
      description: `Payment for Booking (Booking ID: ${booking._id})`,
      referenceId: booking._id,
    });

    // Mark Booking Paid
    booking.paymentStatus = 'PAID';
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
