const router = require('express').Router();
const {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  deleteBooking,
  verifyCompletion,
  checkPincode,
} = require('../controllers/bookingController');
const { protect, requireRole } = require('../middleware/auth');
const validateRequest = require('../middleware/validateRequest');
const { bookingLimiter } = require('../middleware/rateLimit');
const { bookingValidator } = require('../validators/bookingValidator');

router.use(protect);

router.get('/check-pincode/:pincode', checkPincode);
router.route('/')
  .get(getBookings)
  .post(requireRole('patient'), bookingLimiter, bookingValidator, validateRequest, createBooking);
router.route('/:id').get(getBookingById).delete(requireRole('admin'), deleteBooking);
router.put('/:id/status', updateBookingStatus);
router.put('/:id/verify-completion', requireRole('patient'), verifyCompletion);
// Provider collects cash for booking and marks payment
const { collectCash, markPaid } = require('../controllers/bookingController');
router.post('/:id/collect-cash', requireRole('provider'), collectCash);
router.put('/:id/mark-paid', markPaid);

module.exports = router;
