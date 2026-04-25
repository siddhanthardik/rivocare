const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String },
  content: { type: String },
  heroImage: {
    url: String,
    publicId: String,
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  tags: [String],
  status: { type: String, enum: ['DRAFT','PUBLISHED'], default: 'DRAFT' },
  publishedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Blog', BlogSchema);
