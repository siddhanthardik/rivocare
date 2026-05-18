const express = require('express');
// legacy webhook controller kept for compatibility
const { handleRazorpay } = require('../controllers/webhookController');
const razorpayController = require('../controllers/razorpayWebhookController');

const router = express.Router();

// Public webhook endpoint for Razorpay (signature-verified)
// New API handler (more production-grade) mounted alongside legacy handler for safe rollout.
router.post('/razorpay', razorpayController.handle);

module.exports = router;
