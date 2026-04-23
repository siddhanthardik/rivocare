const express = require('express');
const { getWalletInfo, getTransactions, requestPayout } = require('../controllers/walletController');
const { protect, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Shared
router.get('/', getWalletInfo);
router.get('/transactions', getTransactions);

// Provider specific
router.post('/payout', requireRole('provider'), requestPayout);

module.exports = router;
