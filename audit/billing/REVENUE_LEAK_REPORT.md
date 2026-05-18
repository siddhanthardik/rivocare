# Revenue Leakage & Financial Risk Report

Scope: review of code paths that affect money flows, balances, payouts, invoices, refunds, and reconciliation. Findings are prioritized with references to code locations and recommended mitigations. This is intended for engineering and finance stakeholders.

Summary — High priority leaks and risks

1) Currency unit inconsistency (HIGH)
- Symptom: `Payment.amount` model comment expects paise/cents but `createOrder` stores `amount: booking.totalAmount` (INR) in `backend/src/controllers/paymentController.js`.
- Risk: Reconciliation mismatches between gateway (paise) and DB amounts lead to incorrect comparisons, over/under-crediting, or rejected reconciliations.
- Files: `backend/src/models/Payment.js`, `backend/src/controllers/paymentController.js`.
- Mitigation: normalize to smallest currency unit (paise) across `Payment`, `Transaction`, `Wallet`, `PartnerWallet`. Add DB migration to convert existing records.

2) Non-atomic wallet operations (HIGH)
- Symptom: multiple places update `Wallet` via read-modify-write (e.g., `wallet.balance -= amount; wallet.save()` in `backend/src/controllers/walletController.js` prior to this change) and provider payouts previously used this pattern.
- Risk: race conditions causing negative balances, duplicated payouts, ledger mismatch when Transaction creation fails post balance update.
- Files: `backend/src/controllers/walletController.js`, `backend/src/controllers/bookingController.js`, `backend/src/controllers/adminLabController.js`.
- Mitigation: use `findOneAndUpdate` with `$inc` and conditional balance checks or MongoDB transactions when multiple docs are changed. We updated many flows to transactions and `$inc` patterns.

3) Missing idempotency for payment verification and external webhooks (HIGH)
- Symptom: `verifyPayment` originally accepted client callback and updated DB; no webhook receiver existed. Replayed requests could re-run side-effects.
- Risk: duplicate credits, notifications, inconsistent booking/payment states.
- Files: `backend/src/controllers/paymentController.js`, `backend/src/routes/paymentRoutes.js`.
- Mitigation: added server-side webhook `POST /webhooks/razorpay` with signature verification and `webhook_logs` to dedupe; made `verifyPayment` idempotent.

4) Missing refund automation and reconciliation (HIGH)
- Symptom: no webhook handling for refund events; no refund endpoint interacting with payment gateway.
- Risk: payments refunded at gateway but still marked PAID internally; revenue leakage and accounting errors.
- Files: no webhook handlers prior to our addition; refund paths not implemented.
- Mitigation: implement webhook `refund.processed` handling that moves `Payment` to `REFUNDED`, updates `Booking.paymentStatus`, and creates refund `Transaction` entries; add periodic reconciliation job comparing gateway payments/refunds with internal ledger.

5) Single-entry ledger & auditability gaps (HIGH)
- Symptom: current `Wallet` + `Transaction` pattern is single-entry; `Transaction` lacked status/externalReference before patch.
- Risk: inadequate audit trail for external payout references, difficult forensic reconciliation and regulations.
- Files: `backend/src/models/Transaction.js` (updated), `backend/src/models/Wallet.js`.
- Mitigation: implement double-entry ledger or at minimum add `Transaction.status`, `externalReference`, `referenceType` (done) and ensure all payment flows create both platform and provider-side entries.

6) Missing persistent invoices for service bookings (MEDIUM)
- Symptom: Lab invoices exist but service bookings don't generate persistent invoice records when payment is collected.
- Risk: billing disputes, tax filing gaps.
- Files: `backend/src/controllers/labController.js` (invoices), missing in `bookingController.js`.
- Mitigation: create `Invoice` model for bookings and generate on payment capture (webhook/verify flow).

7) Provider payout workflow lacked reservation and processing states (MEDIUM)
- Symptom: providers could request payout; earlier flow immediately deducted wallet and created a `DEBIT` transaction without `PayoutRequest` tracking.
- Risk: if admin fails to process payout, no audit trail linking the reserved funds to a payout request; or duplicate processing.
- Files: `backend/src/controllers/walletController.js` (updated), now creates `PayoutRequest` and pending `Transaction`.
- Mitigation: implemented `PayoutRequest` model and admin endpoints to process/mark payouts (created `backend/src/controllers/payoutController.js` and `routes/payoutRoutes.js`). Ensure external payout reference stored.

8) Rounding and floating-point arithmetic (MEDIUM)
- Symptom: `Math.round` is used in pricing and commission calculations; mixing floats and integers increases risk of rounding drift.
- Risk: small cumulative revenue leakage across many transactions.
- Files: `backend/src/services/pricingService.js`, `backend/src/controllers/bookingController.js`.
- Mitigation: store all monetary values as integers in paise and perform integer arithmetic until presentation layer.

9) Missing idempotency keys for external-facing endpoints (LOW)
- Symptom: endpoints like `createOrder` and `pay-with-wallet` had no idempotency tokens.
- Risk: duplicate DB records on client retries.
- Mitigation: add idempotency support (store key with Payment/PayoutRequest and reject duplicate processing).

10) Reconciliation and reporting gaps (LOW)
- Symptom: no scheduled reconciliation job comparing gateway settlements with internal records.
- Risk: undetected revenue leakage, unpaid provider balances.
- Mitigation: implement daily reconciliation job using `webhook_logs`, `Payment` and gateway settlement APIs to verify captured amounts, refunds, and settlements.

Action plan (short-term)
- Normalize currency units to paise (design migration and script).
- Ensure all wallet mutations use `$inc` or transactions (we updated critical paths).
- Add webhook handlers for refunds and order events (implement in `webhookController`).
- Create booking invoices on payment capture.
- Monitor and reconcile daily via a cron job comparing gateway reports.

Action plan (medium-term)
- Implement double-entry ledger for regulatory compliance.
- Add idempotency key enforcement for external endpoints.
- Add test coverage for payment flows and reconciliation.

References (files inspected)
- `backend/src/controllers/paymentController.js` (createOrder, verifyPayment, verifyLabPayment)
- `backend/src/controllers/walletController.js` (requestPayout)
- `backend/src/controllers/webhookController.js` (new)
- `backend/src/models/Payment.js`, `Transaction.js`, `Wallet.js`, `PartnerWallet.js`, `PayoutRequest.js` (new)
- `backend/src/routes/paymentRoutes.js`, `webhookRoutes.js`, `payoutRoutes.js` (new)

If you want, I can now:
- Create a DB migration script to convert currency fields to paise and update existing records.
- Implement refund webhook handling and booking invoice generation.
- Add a daily reconciliation job scaffold.
