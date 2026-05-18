# Billing Architecture — Initial Discovery

This file summarizes initial findings from scanning the codebase (Phase 1).

Key components inspected:

- Backend booking flow: [backend/src/controllers/bookingController.js](backend/src/controllers/bookingController.js#L1-L400)
- Payment controller: [backend/src/controllers/paymentController.js](backend/src/controllers/paymentController.js#L1-L400)
- Pricing engine: [backend/src/services/pricingService.js](backend/src/services/pricingService.js#L1-L200)
- Provider earnings: [backend/src/services/providerEarningsService.js](backend/src/services/providerEarningsService.js#L1-L200)
- Lab controller & invoice logic: [backend/src/controllers/labController.js](backend/src/controllers/labController.js#L1-L300)
- Routes: [backend/src/routes/paymentRoutes.js](backend/src/routes/paymentRoutes.js#L1-L200), [backend/src/routes/bookings.js](backend/src/routes/bookings.js#L1-L200), [backend/src/routes/invoices.js](backend/src/routes/invoices.js#L1-L200)
- Models: [backend/src/models/Booking.js](backend/src/models/Booking.js#L1-L200), [backend/src/models/Payment.js](backend/src/models/Payment.js#L1-L200), [backend/src/models/Wallet.js](backend/src/models/Wallet.js#L1-L200), [backend/src/models/Transaction.js](backend/src/models/Transaction.js#L1-L200), [backend/src/models/LabOrder.js](backend/src/models/LabOrder.js#L1-L200)

High-level billing map (preliminary):

- Patient creates booking via `POST /api/bookings` -> handled in `createBooking` in [bookingController.js](backend/src/controllers/bookingController.js#L1-L400).
- Booking persists as `Booking` document with `paymentStatus: PENDING` and platform/provider splits calculated on server (platformFee / providerEarning).
- For confirmed bookings, client calls `POST /api/payment/create-order` (Razorpay order created) -> `createOrder` in [paymentController.js](backend/src/controllers/paymentController.js#L1-L200). A `Payment` document is created referencing Razorpay order id.
- Frontend/razorpay returns payment details and client calls `POST /api/payment/verify` -> `verifyPayment` marks `Payment.status = SUCCESS` and sets `Booking.paymentStatus = 'PAID'`.
- Wallet payments call `POST /api/payment/pay-with-wallet` which debits `Wallet.balance`, creates a `Transaction`, and marks booking `paymentStatus = 'PAID'`.
- Lab bookings use `LabOrder` and similar Razorpay flow under `/api/payment/lab/*`. Invoice generation for labs is in `labController.getInvoice`.

Immediate concerns (to be expanded):

- Inconsistent currency unit in `Payment.amount` comment vs usage: comment says paise but code stores INR (see [paymentController.js](backend/src/controllers/paymentController.js#L1-L200) and [models/Payment.js](backend/src/models/Payment.js#L1-L120)).
- Many monetary fields in `Booking` are nullable/default-zero — risk of missing fields (`providerEarning`, `platformFee`, `finalAmount`). See [Booking.js](backend/src/models/Booking.js#L1-L200).
- Invoice generation (GST) in `labController.getInvoice` assumes 18% GST fixed and that `totalAmount` includes GST; needs validation for compliance.
- Provider earnings are derived from completed bookings only; payouts depend on Wallet/Transaction records; no dedicated payout ledger model observed yet — payouts likely handled via manual transactions or partner models.

Next steps (Phase 1 -> Phase 2): scan for all billing entities/models and generate `BILLING_DATABASE_AUDIT.md`.
