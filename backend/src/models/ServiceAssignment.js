const mongoose = require('mongoose');

const serviceAssignmentSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['SUBSCRIPTION', 'PACKAGE'],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'modelType', // Dynamic reference depending on type
    },
    modelType: {
      type: String,
      enum: ['PatientSubscription', 'PatientPackage'],
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED'],
      default: 'PENDING',
    },
    notes: {
      type: String, // From admin
    },
  },
  { timestamps: true }
);

// Helper for dynamic ref
serviceAssignmentSchema.pre('validate', function(next) {
  if (this.type === 'SUBSCRIPTION') {
    this.modelType = 'PatientSubscription';
  } else if (this.type === 'PACKAGE') {
    this.modelType = 'PatientPackage';
  }
  next();
});

module.exports = mongoose.model('ServiceAssignment', serviceAssignmentSchema);
