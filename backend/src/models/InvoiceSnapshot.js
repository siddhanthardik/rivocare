const mongoose = require('mongoose');

const InvoiceItemSchema = new mongoose.Schema({
  code: String,
  description: String,
  quantity: { type: Number, default: 1 },
  unitPrice: Number,
  total: Number,
  tax: Number,
  metadata: mongoose.Schema.Types.Mixed,
});

const InvoiceSnapshotSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  labOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'LabOrder' },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
  items: [InvoiceItemSchema],
  subtotal: { type: Number, required: true },
  taxes: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  finalAmount: { type: Number, required: true },
  paymentMethod: { type: String },
  paymentStatus: { type: String },
  invoicePdfUrl: { type: String },
  invoiceHtml: { type: String },
  generatedAt: { type: Date, default: Date.now },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  snapshotVersion: { type: String, default: 'v1' },
  metadata: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

module.exports = mongoose.model('InvoiceSnapshot', InvoiceSnapshotSchema);
