/**
 * Rivo Design System - System Constants
 * Enforces strict consistency for states and statuses.
 */

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  COLLECTED: 'collected',
};

export const LAB_ORDER_STATUS = {
  PLACED: 'new',
  ACCEPTED: 'accepted',
  ASSIGNED: 'technician_assigned',
  COLLECTED: 'sample_collected',
  PROCESSING: 'processing',
  READY: 'report_uploaded',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

export const SLA_LEVELS = {
  URGENT: 'urgent',
  NORMAL: 'normal',
  DELAYED: 'delayed',
};

export const STATUS_COLORS = {
  // Booking / Order Statuses
  [BOOKING_STATUS.PENDING]: 'bg-amber-50 text-amber-600 border-amber-100',
  [BOOKING_STATUS.CONFIRMED]: 'bg-blue-50 text-blue-600 border-blue-100',
  [BOOKING_STATUS.COMPLETED]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  [BOOKING_STATUS.CANCELLED]: 'bg-slate-50 text-slate-400 border-slate-100',
  [BOOKING_STATUS.REJECTED]: 'bg-red-50 text-red-600 border-red-100',

  // Lab Specific
  [LAB_ORDER_STATUS.ASSIGNED]: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  [LAB_ORDER_STATUS.COLLECTED]: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  [LAB_ORDER_STATUS.PROCESSING]: 'bg-purple-50 text-purple-600 border-purple-100',
  [LAB_ORDER_STATUS.READY]: 'bg-emerald-50 text-emerald-600 border-emerald-100',

  // Payment
  [PAYMENT_STATUS.PAID]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  [PAYMENT_STATUS.COLLECTED]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};
