const { body, param } = require('express-validator');

const familyMemberValidator = [
  body('name').isString().trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('relationship').optional().isIn(['Spouse', 'Child', 'Parent', 'Sibling', 'Other']).withMessage('Invalid relationship'),
  body('age').optional().isInt({ min: 0, max: 120 }).withMessage('Age must be between 0 and 120'),
  body('gender').optional().isIn(['Male', 'Female', 'Other']).withMessage('Invalid gender'),
  body('phone').optional({ checkFalsy: true }).matches(/^[6-9]\d{9}$/).withMessage('Invalid phone number'),
  body('user').not().exists().withMessage('User ownership is set by the server'),
];

const savedAddressValidator = [
  body('type').optional().isIn(['Home', 'Work', 'Parents', 'Other']).withMessage('Invalid address type'),
  body('fullAddress').isString().trim().isLength({ min: 5, max: 500 }).withMessage('Address must be 5-500 characters'),
  body('city').optional().isString().trim().isLength({ max: 80 }).withMessage('City cannot exceed 80 characters'),
  body('locality').optional().isString().trim().isLength({ max: 120 }).withMessage('Locality cannot exceed 120 characters'),
  body('pincode').optional().matches(/^\d{6}$/).withMessage('Pincode must be 6 digits'),
  body('landmark').optional().isString().trim().isLength({ max: 120 }).withMessage('Landmark cannot exceed 120 characters'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be boolean'),
  body('user').not().exists().withMessage('User ownership is set by the server'),
];

const labBookingValidator = [
  body('partnerId').isMongoId().withMessage('Valid partnerId is required'),
  body('testIds').optional().isArray({ min: 1, max: 20 }).withMessage('At least one test is required'),
  body('testIds.*').optional().isMongoId().withMessage('Every test id must be valid'),
  body('testId').optional().isMongoId().withMessage('Valid testId is required'),
  body('memberId').optional({ nullable: true, checkFalsy: true }).custom((value) => value === 'self' || /^[a-f\d]{24}$/i.test(value)).withMessage('Valid memberId is required'),
  body('addressId').optional({ nullable: true, checkFalsy: true }).isMongoId().withMessage('Valid addressId is required'),
  body('schedule.date').optional().isISO8601().withMessage('Valid schedule.date is required'),
  body('schedule.time').optional().isString().trim().isLength({ max: 60 }).withMessage('Invalid schedule.time'),
  body('scheduledDate').optional().isISO8601().withMessage('Valid scheduledDate is required'),
  body('scheduledTime').optional().isString().trim().isLength({ max: 60 }).withMessage('Invalid scheduledTime'),
  body('collectionType').optional().isIn(['home', 'center']).withMessage('Invalid collectionType'),
  body('paymentMethod').optional().isIn(['cod', 'upi', 'razorpay']).withMessage('Invalid paymentMethod'),
  body('totalAmount').not().exists().withMessage('Total amount is calculated by the server'),
  body('amount').not().exists().withMessage('Amount is calculated by the server'),
  body('price').not().exists().withMessage('Price is calculated by the server'),
];

const mongoIdParamValidator = [
  param('id').isMongoId().withMessage('Valid id is required'),
];

module.exports = {
  familyMemberValidator,
  savedAddressValidator,
  labBookingValidator,
  mongoIdParamValidator,
};
