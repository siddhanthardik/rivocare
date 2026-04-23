const express = require('express');
const {
  submitReview,
  getBookingReview,
  getProviderReviews,
} = require('../controllers/reviewController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

// Patient submits a review
router.post('/', protect, requireRole('patient'), submitReview);

// Check if a specific booking has been reviewed (patient/provider/admin)
router.get('/booking/:bookingId', protect, getBookingReview);

// Public: get all reviews for a provider
router.get('/provider/:providerId', getProviderReviews);

module.exports = router;
