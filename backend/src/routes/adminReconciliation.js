const express = require('express');
const { getSummary, getPayments, getPayouts, getFailures } = require('../controllers/adminReconciliationController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(requireRole('admin'));

router.get('/summary', getSummary);
router.get('/payments', getPayments);
router.get('/payouts', getPayouts);
router.get('/failures', getFailures);

module.exports = router;
