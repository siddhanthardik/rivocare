/**
 * Rivo Design System - System Constants
 * Enforces strict consistency for states and statuses.
 */

export const BOOKING_STATUS = {
  REQUESTED: 'requested',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  COLLECTED: 'collected',   // COD: cash collected, awaiting patient confirmation
  PAID: 'paid',
  CANCELLED: 'cancelled',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  COLLECTED: 'collected',
  PENDING_CONFIRMATION: 'pending_confirmation',
  DISPUTED: 'disputed',
};

export const LAB_ORDER_STATUS = {
  PLACED: 'placed',
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
  requested: 'bg-amber-50 text-amber-600 border-amber-100',
  pending: 'bg-amber-50 text-amber-600 border-amber-100',
  confirmed: 'bg-blue-50 text-blue-600 border-blue-100',
  accepted: 'bg-blue-50 text-blue-600 border-blue-100',
  in_progress: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  started: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  completed: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  finished: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  collected: 'bg-amber-50 text-amber-600 border-amber-100',   // awaiting patient confirmation
  paid: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  cancelled: 'bg-slate-50 text-slate-400 border-slate-100',
  rejected: 'bg-red-50 text-red-600 border-red-100',

  // Lab Specific
  technician_assigned: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  sample_collected: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  processing: 'bg-purple-50 text-purple-600 border-purple-100',
  report_uploaded: 'bg-emerald-50 text-emerald-600 border-emerald-100',

  // Payment
  pending_confirmation: 'bg-amber-50 text-amber-600 border-amber-200',
  disputed: 'bg-red-50 text-red-600 border-red-200',
  cash_collected: 'bg-amber-50 text-amber-600 border-amber-100',
  failed: 'bg-red-50 text-red-600 border-red-100',
  refunded: 'bg-slate-50 text-slate-400 border-slate-100',
};
