const mongoose = require('mongoose');

const LabReviewSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'LabOrder', required: true, unique: true },
  
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, trim: true },
  
  // Specific diagnostic metrics
  phlebotomistRating: { type: Number },
  reportClarity: { type: Number },
  onTimeCollection: { type: Boolean },
  
}, { timestamps: true });

// Recalculate Lab Rating after saving
LabReviewSchema.post('save', async function () {
  const LabProfile = require('./LabProfile');
  const result = await mongoose.model('LabReview').aggregate([
    { $match: { partner: this.partner } },
    { $group: { _id: '$partner', avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  
  if (result.length > 0) {
    await LabProfile.findOneAndUpdate({ partner: this.partner }, {
      rating: parseFloat(result[0].avgRating.toFixed(1)),
      totalReviews: result[0].count,
    });
  }
});

module.exports = mongoose.model('LabReview', LabReviewSchema);
