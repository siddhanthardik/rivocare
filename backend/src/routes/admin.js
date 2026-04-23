const router = require('express').Router();
const {
  getStats,
  getUsers,
  updateUser,
  verifyProvider,
  getAllProviders,
  getDashboardSummary,
  getDashboardRevenue,
  getTopProviders,
  getDashboardBookings,
  addPincode,
  listPincodes,
  togglePincodeState,
  createPlan,
  getPlans,
  updatePlan,
  createPackage,
  getPackages,
  updatePackage,
  getPendingAssignments,
  assignProvider,
  getServicePricing,
  updateServicePricing,
  setAdminPrice,
  getProviderDetails,
} = require('../controllers/adminController');
const {
  getProviderLeads,
  updateLeadStatus,
  updateProviderOnboardingStatus,
  getSupplyGaps,
} = require('../controllers/leadController');
const { protect, requireRole } = require('../middleware/auth');

router.use(protect, requireRole('admin'));

router.get('/stats', getStats);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.get('/providers', getAllProviders);
router.get('/providers/:id/details', getProviderDetails);
router.put('/providers/:id/verify', verifyProvider);

// Dashboard analytics routes
router.get('/dashboard/summary', getDashboardSummary);
router.get('/dashboard/revenue', getDashboardRevenue);
router.get('/dashboard/top-providers', getTopProviders);
router.get('/dashboard/bookings', getDashboardBookings);

// Fraud Analytics routes
const { getFraudSummary, getFraudFlags, takeFraudAction } = require('../controllers/adminController');
router.get('/fraud/summary', getFraudSummary);
router.get('/fraud/flags', getFraudFlags);
router.post('/fraud/action', takeFraudAction);

// Serviceable Pincodes routes
router.post('/pincodes/add', addPincode);
router.get('/pincodes/list', listPincodes);
router.put('/pincodes/:id/toggle', togglePincodeState);

// Subscriptions & Packages
router.post('/plans/create', createPlan);
router.get('/plans', getPlans);
router.put('/plans/:id', updatePlan);

router.post('/packages/create', createPackage);
router.get('/packages', getPackages);
router.put('/packages/:id', updatePackage);

router.get('/assignments/pending', getPendingAssignments);
router.post('/assign-provider', assignProvider);

// Service Pricing
router.get('/services/pricing', getServicePricing);
router.put('/services/:id/pricing', updateServicePricing);

// Admin Price Override
router.put('/bookings/:id/set-price', setAdminPrice);

// Provider Leads & Supply Expansion
router.get('/leads', getProviderLeads);
router.put('/leads/:id', updateLeadStatus);
router.put('/providers/:id/onboarding-status', updateProviderOnboardingStatus);
router.get('/supply-gaps', getSupplyGaps);

module.exports = router;
