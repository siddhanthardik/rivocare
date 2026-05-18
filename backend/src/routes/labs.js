const express = require('express');
const { getLabs, getLabById, searchTests, bookTest, getMyOrders, getInvoice, getReport, getDepartments } = require('../controllers/labController');
const { protect, requireRole } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { bookingLimiter } = require('../middleware/rateLimit');
const {
  familyMemberValidator,
  savedAddressValidator,
  labBookingValidator,
  mongoIdParamValidator,
} = require('../validators/labValidator');

const router = express.Router();

router.get('/', getLabs);
router.get('/tests', searchTests);
router.get('/departments', getDepartments);
router.get('/:id', getLabById);

// Protected patient routes
router.use(protect, requireRole('patient'));
router.post('/book', bookingLimiter, labBookingValidator, validateRequest, bookTest);
router.post('/orders', bookingLimiter, labBookingValidator, validateRequest, bookTest);
router.get('/me/orders', getMyOrders);
router.get('/me/orders/:id/invoice', getInvoice);
router.get('/invoices/:id', mongoIdParamValidator, validateRequest, getInvoice);
router.get('/reports/:id', mongoIdParamValidator, validateRequest, getReport);

// Profiles & Retention
const { 
  getFamilyMembers, addFamilyMember, 
  updateFamilyMember, deleteFamilyMember,
  getSavedAddresses, addSavedAddress,
  updateSavedAddress, deleteSavedAddress,
} = require('../controllers/labController');

router.get('/me/family', getFamilyMembers);
router.post('/me/family', familyMemberValidator, validateRequest, addFamilyMember);
router.put('/me/family/:id', mongoIdParamValidator, familyMemberValidator, validateRequest, updateFamilyMember);
router.delete('/me/family/:id', mongoIdParamValidator, validateRequest, deleteFamilyMember);
router.get('/me/addresses', getSavedAddresses);
router.post('/me/addresses', savedAddressValidator, validateRequest, addSavedAddress);
router.put('/me/addresses/:id', mongoIdParamValidator, savedAddressValidator, validateRequest, updateSavedAddress);
router.delete('/me/addresses/:id', mongoIdParamValidator, validateRequest, deleteSavedAddress);

module.exports = router;
