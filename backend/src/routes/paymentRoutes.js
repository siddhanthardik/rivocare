const express = require('express');
const { createOrder, verifyPayment, payWithWallet, createLabPayment, verifyLabPayment, initiateLabPayment, markCashCollectedBooking, confirmCash, reportCashIssue } = require('../controllers/paymentController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Patients generate orders for confirmed bookings
router.post('/create-order', requireRole('patient'), createOrder);

// Verification callback from the frontend Razorpay success handler
router.post('/verify', requireRole('patient'), verifyPayment);

// Cash collection endpoint for bookings (provider or admin)
router.post('/mark-cash-collected/:id', protect, markCashCollectedBooking);

// Patient confirmation endpoints
router.post('/confirm-cash/:id', requireRole('patient'), confirmCash);
router.post('/report-cash-issue/:id', requireRole('patient'), reportCashIssue);

// Pay using wallet balance
router.post('/pay-with-wallet', requireRole('patient'), payWithWallet);

// Strict lab payment endpoint used by /api/payments
router.post('/', requireRole('patient'), initiateLabPayment);

// Lab Order Razorpay flow
router.post('/lab/create-order', requireRole('patient'), createLabPayment);
router.post('/lab/verify', requireRole('patient'), verifyLabPayment);

module.exports = router;
