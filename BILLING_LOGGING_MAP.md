BILLING LOGGING MAP

Summary of logging hooks added and the log actions they emit.

- BOOKING_CREATED: booked in backend/src/controllers/bookingController.js (logBookingCreated)
- PAYMENT_CREATED: payment intent created in backend/src/controllers/paymentController.js (logPaymentCreated)
- PAYMENT_VERIFIED: payment verification success/failure in backend/src/controllers/paymentController.js (logPaymentVerified)
- WEBHOOK_RECEIVED: webhook ingress in backend/src/controllers/webhookController.js (logWebhookReceived)
- WALLET_DEBIT: wallet-based payments in backend/src/controllers/paymentController.js (logWalletDebit)
- WALLET_CREDIT: partner credit in backend/src/controllers/paymentController.js (logWalletCredit)
- PAYOUT_REQUESTED: provider payout requests in backend/src/controllers/walletController.js (logPayoutRequested)
- PAYOUT_PROCESSED: payout processing in backend/src/controllers/payoutController.js (logPayoutProcessed)
- INVOICE_GENERATED: invoice generation/download in backend/src/controllers/labController.js (logInvoiceGenerated)
- RECONCILIATION_ISSUE: available via billingLogger.logReconciliationIssue for manual use

Files:
- backend/src/utils/billingLogger.js (implementation)

Notes:
- Logs are JSON structured and written to logs/billing-combined.log and logs/billing-errors.log
- Logging calls are non-blocking and wrapped to never crash business flows.
