const express = require('express');
const { createOrder, verifyPayment, payWithWallet, createLabPayment, verifyLabPayment } = require('../controllers/paymentController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Patients generate orders for confirmed bookings
router.post('/create-order', requireRole('patient'), createOrder);

// Verification callback from the frontend Razorpay success handler
router.post('/verify', requireRole('patient'), verifyPayment);

// Pay using wallet balance
router.post('/pay-with-wallet', requireRole('patient'), payWithWallet);

// Lab Order Payments
router.post('/lab/create-order', requireRole('patient'), createLabPayment);
router.post('/lab/verify', requireRole('patient'), verifyLabPayment);

module.exports = router;
