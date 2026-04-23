const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Provider',
      required: true,
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      unique: true, // ← One review per booking — enforced at DB level
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      default: '',
    },
  },
  { timestamps: true }
);

// After saving a review, recalculate provider's cached rating
reviewSchema.post('save', async function () {
  const Provider = require('./Provider');
  const result = await mongoose.model('Review').aggregate([
    { $match: { provider: this.provider } },
    { $group: { _id: '$provider', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  if (result.length > 0) {
    await Provider.findByIdAndUpdate(this.provider, {
      rating: parseFloat(result[0].avgRating.toFixed(1)),
      totalRatings: result[0].count,
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
