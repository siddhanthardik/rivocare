const express = require('express');
const { 
  registerPartner, loginPartner, getMe, getProfile, updateProfile,
  getDashboardStats, getFinancialSummary, getOrders, updateOrderStatus,
  markPaymentCollected,
  getTests, addTest, bulkUploadTests, updateTest, deleteTest,
  getStaff, addStaff, updateStaffStatus, updateStaff, deleteStaff,
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
router.post('/orders/:id/mark-payment-collected', markPaymentCollected);
router.post('/orders/:id/report', upload.single('report'), uploadOrderReport);

router.get('/staff', getStaff);
router.post('/staff', addStaff);
router.put('/staff/:id', updateStaff);
router.delete('/staff/:id', deleteStaff);
router.put('/staff/:id/status', updateStaffStatus);

router.get('/wallet/transactions', getTransactions);

router.get('/tests', getTests);
router.post('/tests', addTest);
router.put('/tests/:id', updateTest);
router.delete('/tests/:id', deleteTest);
router.post('/tests/bulk', bulkUploadTests);

module.exports = router;
