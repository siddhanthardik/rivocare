const router = require('express').Router();
const {
  getProviders,
  getProviderById,
  toggleAvailability,
  updateProviderProfile,
  getServices,
  getAssignments,
  updateAssignmentStatus,
} = require('../controllers/providerController');
const {
  captureProviderLead,
  getMyReferral,
} = require('../controllers/leadController');
const { protect, requireRole } = require('../middleware/auth');

// Public: list providers & get provider by id
router.get('/', getProviders);
router.get('/services', getServices);
router.get('/:id', getProviderById);

// Public: lead capture (no auth needed)
router.post('/lead', captureProviderLead);

// Protected routes
router.use(protect);

router.put('/availability', requireRole('provider'), toggleAvailability);
router.put('/profile', requireRole('provider'), updateProviderProfile);
router.get('/me/assignments', requireRole('provider'), getAssignments);
router.put('/me/assignments/:id', requireRole('provider'), updateAssignmentStatus);
router.get('/me/referral', requireRole('provider'), getMyReferral);

module.exports = router;
