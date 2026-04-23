const router = require('express').Router();
const {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  verifyCompletion,
  checkPincode,
  updateBookingPrice,
  approveBookingPrice,
  rejectBookingPrice,
} = require('../controllers/bookingController');
const { protect, requireRole } = require('../middleware/auth');

// Public route for wizard validation
router.get('/check-pincode/:pincode', checkPincode);

router.use(protect);

router.route('/').get(getBookings).post(requireRole('patient'), createBooking);
router.route('/:id').get(getBookingById).delete(requireRole('admin'), deleteBooking);
router.put('/:id/status', updateBookingStatus);
router.put('/:id/verify-completion', requireRole('patient'), verifyCompletion);
router.put('/:id/update-price', requireRole('provider'), updateBookingPrice);
router.put('/:id/approve-price', requireRole('patient'), approveBookingPrice);
router.put('/:id/reject-price', requireRole('patient'), rejectBookingPrice);

module.exports = router;

