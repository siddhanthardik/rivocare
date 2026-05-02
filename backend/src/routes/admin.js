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
const { upload } = require('../utils/cloudinary');
const {
  createPage,
  listPages,
  getPage,
  updatePage,
  deletePage,
  uploadPageHero,
  createBlog,
  listBlogs,
  getBlog,
  updateBlog,
  deleteBlog,
  uploadBlogHero,
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

// Lab Pricing (Admin)
const { getAdminTests, updateAdminTestPricing, updateLabDepartmentCommissions, updateLabCommission } = require('../controllers/adminLabController');
router.get('/labs/tests', getAdminTests);
router.put('/labs/tests/:id/pricing', updateAdminTestPricing);
router.put('/labs/:labId/commission', updateLabCommission);
router.put('/labs/partners/:partnerId/department-commissions', updateLabDepartmentCommissions);

// Admin Price Override
router.put('/bookings/:id/set-price', setAdminPrice);

// Provider Leads & Supply Expansion
router.get('/leads', getProviderLeads);
router.put('/leads/:id', updateLeadStatus);
router.put('/providers/:id/onboarding-status', updateProviderOnboardingStatus);
router.get('/supply-gaps', getSupplyGaps);

// Content Management: Pages
router.post('/content/pages', createPage);
router.get('/content/pages', listPages);
router.get('/content/pages/:id', getPage);
router.put('/content/pages/:id', updatePage);
router.delete('/content/pages/:id', deletePage);
router.post('/content/pages/:id/hero', upload.single('image'), uploadPageHero);

// Content Management: Blogs
router.post('/blogs', createBlog);
router.get('/blogs', listBlogs);
router.get('/blogs/:id', getBlog);
router.put('/blogs/:id', updateBlog);
router.delete('/blogs/:id', deleteBlog);
router.post('/blogs/:id/hero', upload.single('image'), uploadBlogHero);

module.exports = router;
