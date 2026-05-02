const express = require('express');
const router = express.Router();
const { 
  getServices, adminGetServices, createService, updateService,
  getPricingRules, upsertPricingRule,
  getPlansByService, adminGetPlans, createPlan, updatePlan, deletePlan
} = require('../controllers/pricingController');
const { protect, requireRole } = require('../middleware/auth');

// Public Routes
router.get('/services', getServices);
router.get('/services/:serviceId/plans', getPlansByService);

// Admin Routes
router.use(protect, requireRole('admin'));

router.get('/admin/services', adminGetServices);
router.post('/admin/services', createService);
router.put('/admin/services/:id', updateService);

router.get('/admin/rules', getPricingRules);
router.post('/admin/rules', upsertPricingRule);

router.get('/admin/plans', adminGetPlans);
router.post('/admin/plans', createPlan);
router.put('/admin/plans/:id', updatePlan);
router.delete('/admin/plans/:id', deletePlan);

module.exports = router;
