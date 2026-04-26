const Review = require('../models/Review');
const Booking = require('../models/Booking');
const Provider = require('../models/Provider');

// ─── POST /api/reviews ────────────────────────────────────────
// Patient submits a review for a completed booking
exports.submitReview = async (req, res) => {
  try {
    const { bookingId, rating, comment, tags } = req.body;

    if (!bookingId || !rating) {
      return res.status(400).json({ success: false, message: 'bookingId and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Load and validate the booking
    const booking = await Booking.findById(bookingId).populate('provider');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Must be the booking's patient
    if (booking.patient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only review your own bookings' });
    }

    // Booking must be completed
    if (booking.status !== 'completed') {
      return res.status(400).json({ success: false, message: 'You can only review completed bookings' });
    }

    // Prevent duplicate reviews (also enforced by unique index on booking field)
    const existing = await Review.findOne({ booking: bookingId });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this booking' });
    }

    const review = await Review.create({
      patient: req.user._id,
      provider: booking.provider._id,
      booking: bookingId,
      rating,
      comment: comment || '',
      tags: tags || [],
    });

    await review.populate('patient', 'name avatar');

    res.status(201).json({ success: true, message: 'Review submitted successfully', data: review });
  } catch (err) {
    // Handle mongo duplicate key on booking field
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this booking' });
    }
    console.error('Submit Review Error:', err);
    res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
};

// ─── GET /api/reviews/booking/:bookingId ──────────────────────
// Check if a specific booking already has a review (to toggle "Rate Now" button)
exports.getBookingReview = async (req, res) => {
  try {
    const review = await Review.findOne({ booking: req.params.bookingId });
    res.json({ success: true, data: review }); // null if not yet reviewed
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to check review' });
  }
};

// ─── GET /api/reviews/provider/:providerId ────────────────────
// Get all reviews for a provider (public)
exports.getProviderReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const filter = { provider: req.params.providerId };

    const total = await Review.countDocuments(filter);
    const reviews = await Review.find(filter)
      .populate('patient', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    // Calculate average
    const aggResult = await Review.aggregate([
      { $match: { provider: require('mongoose').Types.ObjectId.createFromHexString(req.params.providerId) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);

    const avgRating = aggResult.length > 0 ? parseFloat(aggResult[0].avgRating.toFixed(1)) : 0;
    const totalReviews = aggResult.length > 0 ? aggResult[0].count : 0;

    res.json({
      success: true,
      data: {
        reviews,
        avgRating,
        totalReviews,
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('Get Provider Reviews Error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
};
