const express = require('express');
const { listPayouts, processPayout, approvePayout, failPayout, rejectPayout } = require('../controllers/payoutController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(protect);
router.use(requireRole('admin'));

router.get('/', listPayouts);
router.post('/:id/process', processPayout);
router.post('/:id/approve', approvePayout);
router.post('/:id/fail', failPayout);
router.post('/:id/reject', rejectPayout);

module.exports = router;
