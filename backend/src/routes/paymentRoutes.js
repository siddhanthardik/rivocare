const express = require('express');
const { createOrder, verifyPayment } = require('../controllers/paymentController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Patients generate orders for confirmed bookings
router.post('/create-order', requireRole('patient'), createOrder);

// Verification callback from the frontend Razorpay success handler
router.post('/verify', requireRole('patient'), verifyPayment);

module.exports = router;
