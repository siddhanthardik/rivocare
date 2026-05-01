const express = require('express');
const { 
  getPartners, updatePartnerStatus, getAllOrders, getAnalytics,
  getWarRoomStats, getPartnersPerformance, manageOrder,
  getFinanceMetrics, processSettlement, manageFinanceStatus
} = require('../controllers/adminLabController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(protect, requireRole('admin'));

router.get('/partners', getPartners);
router.put('/partners/:id/status', updatePartnerStatus);
router.get('/partners/performance', getPartnersPerformance);

router.get('/orders', getAllOrders);
router.put('/orders/:id/manage', manageOrder);

router.get('/analytics', getAnalytics);
router.get('/war-room', getWarRoomStats);

router.get('/finance/metrics', getFinanceMetrics);
router.post('/finance/settlements', processSettlement);
router.put('/orders/:id/finance-status', manageFinanceStatus);

module.exports = router;
