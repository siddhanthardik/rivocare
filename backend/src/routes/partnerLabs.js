const express = require('express');
const { 
  registerPartner, loginPartner, getMe, getProfile, updateProfile,
  getDashboardStats, getFinancialSummary, getOrders, updateOrderStatus,
  getTests, addTest, bulkUploadTests,
  getStaff, addStaff, updateStaffStatus,
  getTransactions, getLeaderboard, uploadOrderReport
} = require('../controllers/partnerLabController');
const { protectPartner } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');

const router = express.Router();

router.post('/register', registerPartner);
router.post('/login', loginPartner);

router.use(protectPartner);
router.get('/me', getMe);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/dashboard', getDashboardStats);
router.get('/financial-summary', getFinancialSummary);
router.get('/leaderboard', getLeaderboard);

router.get('/orders', getOrders);
router.put('/orders/:id/status', updateOrderStatus);
router.post('/orders/:id/report', upload.single('report'), uploadOrderReport);

router.get('/staff', getStaff);
router.post('/staff', addStaff);
router.put('/staff/:id/status', updateStaffStatus);

router.get('/wallet/transactions', getTransactions);

router.get('/tests', getTests);
router.post('/tests', addTest);
router.post('/tests/bulk', bulkUploadTests);

module.exports = router;
