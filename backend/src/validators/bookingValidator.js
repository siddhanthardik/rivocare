const { body } = require('express-validator');

const bookingValidator = [
  body('providerId').isMongoId().withMessage('Valid providerId is required'),
  body('service').isMongoId().withMessage('Valid service id is required'),
  body('planId').isMongoId().withMessage('Valid planId is required'),
  body('address').isString().trim().isLength({ min: 5, max: 500 }).withMessage('Address must be 5-500 characters'),
  body('pincode').isString().matches(/^\d{6}$/).withMessage('Pincode must be 6 digits'),
  body('scheduledAt').isISO8601().withMessage('Valid scheduledAt date is required'),
  body('durationHours').optional().isInt({ min: 1, max: 24 }).withMessage('durationHours must be between 1 and 24'),
  body('notes').optional().isString().trim().isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  body('price').not().exists().withMessage('Price is calculated by the server'),
  body('amount').not().exists().withMessage('Amount is calculated by the server'),
  body('totalAmount').not().exists().withMessage('Total amount is calculated by the server'),
  body('finalPrice').not().exists().withMessage('Final price is calculated by the server'),
];

module.exports = { bookingValidator };
