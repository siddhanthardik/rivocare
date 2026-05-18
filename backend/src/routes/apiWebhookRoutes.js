const express = require('express');
const { handle } = require('../controllers/razorpayWebhookController');

const router = express.Router();

// Public Razorpay webhook endpoint (API namespace)
router.post('/razorpay', handle);

module.exports = router;
