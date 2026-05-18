const router = require('express').Router();
const {
  getProviders,
  getProviderById,
  getMyProfile,
  getDashboard,
  toggleAvailability,
  updateProviderProfile,
  getServices,
  getAssignments,
  updateAssignmentStatus,
  saveOnboardingProfile,
  submitOnboardingKYC,
  submitOnboardingDocs,
  submitDeclaration,
  getOnboardingStatus,
} = require('../controllers/providerController');
const { getEarningsSummary } = require('../controllers/providerEarningsController');
const {
  getAvailability,
  updateAvailability,
} = require('../controllers/availabilityController');
const {
  captureProviderLead,
  getMyReferral,
} = require('../controllers/leadController');
const { protect, requireRole } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');

// Public: list providers & get provider by id
router.get('/', getProviders);
router.get('/services', getServices);
router.get('/:id([0-9a-fA-F]{24})', getProviderById);

// Public: lead capture (no auth needed)
router.post('/lead', captureProviderLead);

// Protected routes
router.use(protect);

router.get('/dashboard', requireRole('provider'), getDashboard);
router.get('/earnings-summary', requireRole('provider'), getEarningsSummary);
router.put('/availability', requireRole('provider'), toggleAvailability);
router.get('/me', requireRole('provider'), getMyProfile);
router.put('/profile', requireRole('provider'), updateProviderProfile);
router.get('/me/assignments', requireRole('provider'), getAssignments);
router.put('/me/assignments/:id', requireRole('provider'), updateAssignmentStatus);
router.get('/me/availability', requireRole('provider'), getAvailability);
router.put('/me/availability', requireRole('provider'), updateAvailability);
router.get('/me/referral', requireRole('provider'), getMyReferral);

// Onboarding routes
router.get('/onboarding/status', requireRole('provider'), getOnboardingStatus);
router.put('/onboarding/profile', requireRole('provider'), saveOnboardingProfile);
router.post(
  '/onboarding/kyc',
  requireRole('provider'),
  upload.fields([{ name: 'aadhaar', maxCount: 1 }, { name: 'pan', maxCount: 1 }, { name: 'cheque', maxCount: 1 }]),
  submitOnboardingKYC
);
router.post(
  '/onboarding/documents',
  requireRole('provider'),
  upload.single('document'),
  submitOnboardingDocs
);
router.post('/onboarding/submit', requireRole('provider'), submitDeclaration);

module.exports = router;
