const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(__dirname, '..', '..', 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.BILLING_LOG_LEVEL || 'info',
  format: jsonFormat,
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'billing-errors.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'billing-combined.log') }),
  ],
  exitOnError: false,
});

// helper to build structured payload with safe fields
function buildPayload({ action, bookingId, paymentId, userId, providerId, amount, status, requestId, ip, endpoint, metadata }) {
  return {
    timestamp: new Date().toISOString(),
    action,
    bookingId: bookingId || null,
    paymentId: paymentId || null,
    userId: userId || null,
    providerId: providerId || null,
    amount: amount ?? null,
    status: status || null,
    requestId: requestId || null,
    ip: ip || null,
    endpoint: endpoint || null,
    metadata: metadata || null,
  };
}

function safeLog(level, payload) {
  try {
    logger.log(level, payload);
  } catch (e) {
    // swallow logging errors — must not disrupt business flow
    try { console.error('[billingLogger] log error', e && e.message); } catch (er) {}
  }
}

module.exports = {
  logBookingCreated: (opts) => safeLog('info', buildPayload({ action: 'BOOKING_CREATED', ...opts })),
  logPaymentCreated: (opts) => safeLog('info', buildPayload({ action: 'PAYMENT_CREATED', ...opts })),
  logPaymentVerified: (opts) => safeLog('info', buildPayload({ action: 'PAYMENT_VERIFIED', ...opts })),
  logWebhookReceived: (opts) => safeLog('info', buildPayload({ action: 'WEBHOOK_RECEIVED', ...opts })),
  logWalletCredit: (opts) => safeLog('info', buildPayload({ action: 'WALLET_CREDIT', ...opts })),
  logWalletDebit: (opts) => safeLog('info', buildPayload({ action: 'WALLET_DEBIT', ...opts })),
  logPayoutRequested: (opts) => safeLog('info', buildPayload({ action: 'PAYOUT_REQUESTED', ...opts })),
  logPayoutProcessed: (opts) => safeLog('info', buildPayload({ action: 'PAYOUT_PROCESSED', ...opts })),
  logRefundProcessed: (opts) => safeLog('info', buildPayload({ action: 'REFUND_PROCESSED', ...opts })),
  logInvoiceGenerated: (opts) => safeLog('info', buildPayload({ action: 'INVOICE_GENERATED', ...opts })),
  logReconciliationIssue: (opts) => safeLog('warn', buildPayload({ action: 'RECONCILIATION_ISSUE', ...opts })),
  logBookingStatusUpdated: (opts) => safeLog('info', buildPayload({ action: 'BOOKING_STATUS_UPDATED', ...opts })),
  _winston: logger,
};
