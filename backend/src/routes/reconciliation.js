const express = require('express');
const {
  getReconciliation,
  getReconciliationOrders,
  settleReconciliation,
  flagReconciliation,
} = require('../controllers/reconciliationController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(protect, requireRole('admin'));

// GET  /api/admin/labs/reconciliation?date=&city=&partnerId=
router.get('/',         getReconciliation);

// GET  /api/admin/labs/reconciliation/orders?partnerId=&date=
router.get('/orders',   getReconciliationOrders);

// POST /api/admin/labs/reconciliation/settle
router.post('/settle',  settleReconciliation);

// PUT  /api/admin/labs/reconciliation/flag
router.put('/flag',     flagReconciliation);

module.exports = router;
