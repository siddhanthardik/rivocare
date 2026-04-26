const { upload } = require('../utils/cloudinary');
const { 
  register, login, getMe, refreshToken, logout, updateProfile,
  uploadAvatar, removeAvatar,
  verifyOTP, resendOTP, forgotPassword, resetPassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// NOTE: 2FA is temporarily disabled - kept endpoints for future re-enablement
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOTP); // Temporarily disabled - returns 403 error
router.post('/resend-otp', resendOTP); // Temporarily disabled - returns 403 error
router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

router.post('/refresh-token', refreshToken);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.delete('/avatar', protect, removeAvatar);
router.get('/referrals', protect, require('../controllers/authController').getReferrals);

module.exports = router;
