export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
};

export function normalizePaymentStatus(raw) {
  if (!raw && raw !== 0) return '';
  return String(raw).trim().toLowerCase().replace(/[\-\s]+/g, '_');
}
