const router = require('express').Router();
const {
  getPlans,
  getPackages,
  purchasePlan,
  purchasePackage,
  getMySubscriptions,
  getMyPackages,
  logSession,
} = require('../controllers/subscriptionController');
const { protect, requireRole } = require('../middleware/auth');

// Public available plans
router.get('/plans', getPlans);
router.get('/packages', getPackages);

router.use(protect);

router.post('/purchase-plan', requireRole('patient'), purchasePlan);
router.post('/purchase-package', requireRole('patient'), purchasePackage);

router.get('/my-subscriptions', requireRole('patient'), getMySubscriptions);
router.get('/my-packages', requireRole('patient'), getMyPackages);

router.post('/packages/:id/log-session', requireRole('provider', 'admin'), logSession);

module.exports = router;
