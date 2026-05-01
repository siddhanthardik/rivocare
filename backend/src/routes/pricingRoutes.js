const express = require('express');
const router = express.Router();
const { getAllPricing, upsertPricing, calculatePrice } = require('../controllers/pricingController');
const { protect, requireRole } = require('../middleware/auth');

// Public calculation
router.post('/calculate', calculatePrice);

// Admin only management
router.use(protect);
router.use(requireRole('admin'));

router.get('/admin/list', getAllPricing);
router.post('/admin/upsert', upsertPricing);

module.exports = router;
