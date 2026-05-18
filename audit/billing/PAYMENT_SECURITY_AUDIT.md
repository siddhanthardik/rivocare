# Payment Gateway & Webhook Security Audit

Scope: Razorpay integration and payment verification flows found in the codebase. Files inspected:
- `backend/src/controllers/paymentController.js` (createOrder, verifyPayment, lab flows)
- `frontend/src/services/paymentService.js` and Razorpay checkout loader `frontend/src/hooks/useRazorpay.js`
- `backend/src/models/Payment.js`

Summary of current implementation
- Client flow: frontend loads Razorpay Checkout (`useRazorpay.js`), backend creates a Razorpay Order (`razorpay.orders.create`) in `createOrder` and stores a `Payment` record with `razorpayOrderId` ([paymentController.createOrder]).
- After checkout, frontend calls `POST /api/payment/verify` with `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`. Backend verifies HMAC using `process.env.RAZORPAY_KEY_SECRET` and, if valid, sets `Payment.status = 'SUCCESS'` and updates `Booking.paymentStatus = 'PAID'` ([paymentController.verifyPayment]).
- Lab payments follow a similar flow (`createLabPayment`, `verifyLabPayment`) and additionally credit `PartnerWallet` when order already `completed`.

Findings — Security & Integrity

1) No server-side webhook handlers for Razorpay
- I found no HTTP endpoint to receive Razorpay webhooks (no `/webhook` routes or webhook controllers). Relying solely on frontend-triggered `verifyPayment` means asynchronous events (refunds, chargebacks, payment.failed, payment.captured notifications) are not handled server-to-server.
- Risk: out-of-band events will not be reconciled automatically; refunds or failed captures can leave `Payment` and `Booking` inconsistent.

2) Signature verification is present but minimal
- `verifyPayment` correctly computes HMAC over `razorpay_order_id|razorpay_payment_id` using `RAZORPAY_KEY_SECRET` and compares with `razorpay_signature`. This verifies the client-provided success payload is authentic for a given payment.
- However, `verifyPayment` does not fetch the payment record from Razorpay to validate the captured `amount`/`status` server-side. It trusts the signature alone.
- Risk: signature proves payload authenticity but doesn't confirm the payment amount matches the booking amount (defense-in-depth recommends verifying captured amount and status via the gateway API or processing webhook `payment.captured`).

3) Idempotency and replay protection
- `verifyPayment` locates the `Payment` using `razorpayOrderId`. Repeated calls will find the same `Payment` and set `status = 'SUCCESS'` again; there is no explicit idempotency guard or event deduplication for webhooks (not present) or for verify calls.
- Risk: replayed responses could trigger side-effects multiple times (e.g., repeated booking updates, notifications). Some handlers check for existing `PartnerTransaction` duplicates (good), but many user wallet/booking updates are not protected.

4) Amount unit inconsistency
- `Payment.amount` is stored in DB as `booking.totalAmount` (INR) while Razorpay uses paise in `orders.create`. The model comment suggests paise but the code writes INR, causing a unit mismatch risk during reconciliation.

5) Missing webhook signature verification and event audit
- There is no webhook receiver to verify Razorpay's `X-Razorpay-Signature` header against the webhook body using `RAZORPAY_WEBHOOK_SECRET`. There is also no `webhookLog` table to persist raw events for replay-detection and forensic analysis.

Recommendations — Immediate & Medium-term

Immediate (high priority)
- Add a dedicated webhook endpoint: `POST /webhooks/razorpay` (public) that:
  - Verifies signature using Razorpay webhook secret (`crypto.createHmac('sha256', WEBHOOK_SECRET).update(body).digest('hex')` or use Razorpay SDK helper).
  - Persists the raw webhook payload and `X-Razorpay-Event-Id` into a `webhook_logs` collection with an `processed` flag to avoid reprocessing.
  - Processes idempotently: check `webhook_logs` for existing event id before processing.
  - Handles events: `payment.captured` (mark Payment SUCCESS and Booking PAID if amounts match), `payment.failed` (mark Payment FAILED), `refund.processed` (mark Payment/Booking accordingly, trigger refund ledger), `order.paid` as appropriate.

- On `verifyPayment`, also call Razorpay API to fetch the payment details and verify `amount` and `status` for extra protection before marking Payment SUCCESS:
  - `razorpay.payments.fetch(razorpay_payment_id)` and compare `payment.amount` (paise) with expected `payableAmount * 100`.

- Normalize currency storage to smallest unit (paise) across `Payment.amount`, `Transaction.amount`, `Wallet.balance`. Write a DB migration plan and convert existing sums.

Short-medium (recommended)
- Implement event deduplication: maintain `webhook_logs` with event id and processed timestamp; reject duplicate events.
- Make `verifyPayment` idempotent and resilient: if `Payment.status === 'SUCCESS'` already, return success without re-triggering booking-side effects.
- Use idempotency keys for `createOrder` (e.g., client-generated `idempotencyKey` stored with `Payment`) so retries don't create duplicate Payment documents.

Longer-term (architectural)
- Move to server-driven reconciliation: prefer processing `payment.captured` and `refund.processed` from webhooks as the source of truth for booking/payment status rather than relying solely on client-sent success callbacks.
- Add webhook-handling job queue for heavy processing and a retry mechanism.
- Add an event log and reconcile job that compares gateway reports (periodic) with internal `Payment`/`Booking` records to detect stale/pending items.

Code notes & references
- `backend/src/controllers/paymentController.js` — createOrder uses `razorpay.orders.create` and `verifyPayment` computes signature with `RAZORPAY_KEY_SECRET`.
- `frontend/src/hooks/useRazorpay.js` — loads checkout script; actual checkout open logic may live in multiple payment UI components.
- `backend/src/models/Payment.js` — amount unit comment inconsistent with usage.

Checklist for implementation
- [ ] Add `POST /webhooks/razorpay` with signature verification and event-id dedupe.
- [ ] Persist raw webhook payloads to `webhook_logs` for audit and replay protection.
- [ ] Update `verifyPayment` to fetch payment from Razorpay and validate `amount` and `status` before applying side-effects.
- [ ] Normalize currency unit to paise and plan DB migration.
- [ ] Implement idempotency keys for `createOrder` and protect side-effects in `verifyPayment`/webhook processors.
