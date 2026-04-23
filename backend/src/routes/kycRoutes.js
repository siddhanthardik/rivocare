const express = require('express');
const {
  submitKYC,
  getProviderKYCStatus,
  getPendingKYC,
  getKYCDetails,
  approveKYC,
  rejectKYC
} = require('../controllers/kycController');
const { protect, requireRole } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');

const router = express.Router();

// ─── PROVIDER KYC ROUTES ────────────────────────────────────

// Only Providers can submit their own KYC docs
router.post(
  '/submit',
  protect,
  requireRole('provider'),
  upload.fields([
    { name: 'govtId', maxCount: 1 },
    { name: 'degree', maxCount: 1 },
    { name: 'cheque', maxCount: 1 }
  ]),
  submitKYC
);

router.get('/status', protect, requireRole('provider'), getProviderKYCStatus);

// ─── ADMIN KYC ROUTES ───────────────────────────────────────

// Only Admins can view/approve/reject submissions
router.get('/pending', protect, requireRole('admin'), getPendingKYC);
router.get('/:id', protect, requireRole('admin'), getKYCDetails); // Includes decrypted bank info
router.put('/:id/approve', protect, requireRole('admin'), approveKYC);
router.put('/:id/reject', protect, requireRole('admin'), rejectKYC);

module.exports = router;
