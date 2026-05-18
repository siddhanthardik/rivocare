const BOOKING_STATUS = {
  REQUESTED: 'REQUESTED',   // Initial state
  CONFIRMED: 'CONFIRMED',   // Provider accepted
  IN_PROGRESS: 'IN_PROGRESS', // Service started
  COMPLETED: 'COMPLETED',   // Service finished
  COLLECTED: 'COLLECTED',   // COD cash collected by provider — awaiting patient confirmation
  PAID: 'PAID',             // Payment confirmed (final state)
  CANCELLED: 'CANCELLED'    // Cancelled by any party
};

const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  COLLECTED: 'COLLECTED',           // Legacy: cash collected (use PENDING_CONFIRMATION for new bookings)
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION', // Cash collected, awaiting patient confirmation
  DISPUTED: 'DISPUTED',             // Patient reported an issue with the cash amount
  REFUNDED: 'REFUNDED'
};

const LAB_ORDER_STATUS = {
  PLACED: 'PLACED',
  ACCEPTED: 'ACCEPTED',
  ASSIGNED: 'TECHNICIAN_ASSIGNED',
  COLLECTED: 'SAMPLE_COLLECTED',
  PROCESSING: 'PROCESSING',
  READY: 'REPORT_UPLOADED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

/**
 * Robust normalization for Booking Status
 */
const normalizeBookingStatus = (status) => {
  if (!status) return BOOKING_STATUS.REQUESTED;
  const s = String(status).toUpperCase().trim().replace(/-/g, '_').replace(/ /g, '_');

  if (s === 'PENDING' || s === 'NEW' || s === 'REQUESTED') return BOOKING_STATUS.REQUESTED;
  if (s === 'CONFIRMED' || s === 'ACCEPTED') return BOOKING_STATUS.CONFIRMED;
  if (s === 'IN_PROGRESS' || s === 'STARTED') return BOOKING_STATUS.IN_PROGRESS;
  if (s === 'COMPLETED' || s === 'FINISHED') return BOOKING_STATUS.COMPLETED;
  if (s === 'COLLECTED') return BOOKING_STATUS.COLLECTED;
  if (s === 'PAID') return BOOKING_STATUS.PAID;
  if (s === 'CANCELLED' || s === 'REJECTED') return BOOKING_STATUS.CANCELLED;

  return s;
};

/**
 * Robust normalization for Payment Status
 */
const normalizePaymentStatus = (status) => {
  if (!status) return PAYMENT_STATUS.PENDING;
  const s = String(status).toUpperCase().trim().replace(/-/g, '_').replace(/ /g, '_');

  if (s === 'PENDING' || s === 'UNPAID') return PAYMENT_STATUS.PENDING;
  if (s === 'PAID' || s === 'SUCCESS' || s === 'SUCCESSFUL') return PAYMENT_STATUS.PAID;
  if (s === 'FAILED' || s === 'FAILURE') return PAYMENT_STATUS.FAILED;
  if (s === 'COLLECTED' || s === 'CASH_COLLECTED') return PAYMENT_STATUS.COLLECTED;
  if (s === 'PENDING_CONFIRMATION') return PAYMENT_STATUS.PENDING_CONFIRMATION;
  if (s === 'DISPUTED') return PAYMENT_STATUS.DISPUTED;
  if (s === 'REFUNDED') return PAYMENT_STATUS.REFUNDED;

  return s;
};

/**
 * COD Hold Flow — new safe lifecycle:
 *   REQUESTED → CONFIRMED → IN_PROGRESS → COMPLETED → COLLECTED → PAID
 *
 * Provider wallet credit fires ONLY at PAID (after patient confirms).
 * NEVER at COLLECTED.
 */
const VALID_BOOKING_TRANSITIONS = {
  [BOOKING_STATUS.REQUESTED]:  [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.CONFIRMED]:  [BOOKING_STATUS.IN_PROGRESS, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.IN_PROGRESS]: [BOOKING_STATUS.COMPLETED, BOOKING_STATUS.CANCELLED],
  [BOOKING_STATUS.COMPLETED]:  [BOOKING_STATUS.COLLECTED, BOOKING_STATUS.PAID], // PAID kept for online/prepaid path
  [BOOKING_STATUS.COLLECTED]:  [BOOKING_STATUS.PAID],   // Only after patient confirms
  [BOOKING_STATUS.PAID]:       [], // Final state
  [BOOKING_STATUS.CANCELLED]:  [] // Final state
};

module.exports = {
  BOOKING_STATUS,
  PAYMENT_STATUS,
  LAB_ORDER_STATUS,
  normalizeBookingStatus,
  normalizePaymentStatus,
  VALID_BOOKING_TRANSITIONS
};
