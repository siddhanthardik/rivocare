const mongoose = require('mongoose');

const LabOrderSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  partner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner', required: true },
  tests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LabTest' }],
  
  status: { 
    type: String, 
    enum: ['new', 'accepted', 'rejected', 'technician_assigned', 'sample_collected', 'processing', 'report_uploaded', 'completed', 'cancelled'],
    default: 'new' 
  },
  
  totalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['pending', 'payment_link_sent', 'cash_due', 'collected', 'failed', 'refunded', 'waived'], default: 'pending' },
  paymentMethod: { type: String, enum: ['cod', 'upi', 'razorpay'], default: 'cod' },
  paymentDetails: {
    transactionId: String,
    paymentId: String,
    orderId: String,
  },
  
  scheduledDate: { type: Date, required: true },
  scheduledTime: { type: String }, // e.g., "09:00 AM - 10:00 AM"
  
  collectionType: { type: String, enum: ['home', 'center'], default: 'home' },
  collectionAddress: {
    pincode: String,
    city: String,
    locality: String,
    fullAddress: String,
  },
  
  assignedStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'PartnerStaff' },
  
  reportUrl: { type: String }, // URL to uploaded PDF report
  
  // Payment & Report Security
  paymentCollectedAt: { type: Date },
  paymentCollectedBy: { type: String }, // 'admin', 'system', 'partner'
  reportLocked: { type: Boolean, default: true },
  reportReleasedAt: { type: Date },
  releaseReason: { type: String },
  
  // Reminders & Retention
  reminderDate: { type: Date }, // For repeat test reminders
  isReminderSent: { type: Boolean, default: false },
  
  // B2B Scalability
  slaDeadline: { type: Date },
  isSlaBreached: { type: Boolean, default: false },
  rejectionReason: { type: String },
  penaltyAmount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('LabOrder', LabOrderSchema);
