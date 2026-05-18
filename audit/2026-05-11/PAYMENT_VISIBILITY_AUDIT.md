# PAYMENT VISIBILITY AUDIT — Carely Platform
**Audit Date:** 2026-05-11  
**Scope:** Admin visibility into pending, failed, and unverified payment states

---

## SUMMARY

| Visibility Target | Admin API | Admin UI | Severity |
|---|---|---|---|
| Pending Razorpay orders (CREATED) | Count only | Count chip | MEDIUM |
| Failed Razorpay payments | Count only | Count chip | MEDIUM |
| COD pending collection | None | None | HIGH |
| Abandoned checkout attempts | None | None | HIGH |
| Wallet payment history | None | None | LOW |
| Payment-booking desync | Via reconciliation | Via reconciliation | OK |

---

## PAYMENT MODEL ANALYSIS

### Payment Schema (`models/Payment.js`)
```
status: enum ['CREATED', 'SUCCESS', 'FAILED']
razorpayOrderId: String (unique, required)
razorpayPaymentId: String (optional — null until verified)
booking: ObjectId ref 'Booking' (optional)
bookingIntent: Mixed (optional — prepaid flow)
```

### Booking Payment Status (`models/Booking.js`)
```
paymentStatus: enum ['PENDING', 'PAID', 'REFUNDED', 'COLLECTED', 'FAILED']
```

### Status Normalization (`constants/bookingStatus.js`)
```js
normalizePaymentStatus('SUCCESS')   → 'PAID'
normalizePaymentStatus('CREATED')   → 'PENDING'
normalizePaymentStatus('COLLECTED') → 'COLLECTED'
```

**⚠️ DESYNC RISK:** `Payment.status = 'SUCCESS'` maps to `PAYMENT_STATUS.PAID`, but `adminReconciliationController` uses raw `'SUCCESS'` (line 13: `$match: { status: 'SUCCESS' }`). This is consistent with the model but bypasses the normalization layer — fragile if enum values change.

---

## PENDING PAYMENT VISIBILITY

### What Admin CAN See
- `GET /api/admin/reconciliation/summary` → `pendingPayments` count (Payments with `status: 'CREATED'`)
- `GET /api/admin/stats` → `pendingBookings` count (Bookings with REQUESTED status)
- `Reconciliation.jsx` KPI chip: "Pending Payments" count ✅

### What Admin CANNOT See
- ❌ List of individual pending payments with: amount, age, booking context, patient name
- ❌ Stale pending payments (CREATED > 24 hours ago) — no time filter
- ❌ Pending payments with no associated booking (abandoned checkout)
- ❌ COD bookings awaiting cash collection (no dedicated API)
- ❌ Bookings with `paymentStatus = PENDING` and `status = CONFIRMED` (patient hasn't paid after confirmation)

### Missing API
```
GET /api/admin/payments/pending
Query: { staleHours: number, page, limit }
Returns: payments[] with booking, patient, amount, createdAt, ageHours
```

---

## FAILED PAYMENT VISIBILITY

### What Admin CAN See
- `GET /api/admin/reconciliation/summary` → `failedPayments` count (Payments with `status: 'FAILED'`)
- Webhook failure count (unprocessed WebhookLog records)

### What Admin CANNOT See
- ❌ List of failed payment records with booking context
- ❌ Payment failures from signature mismatch vs amount mismatch vs gateway rejection — no breakdown
- ❌ How many times a specific booking has had payment failures
- ❌ Whether failed payment has been retried

### Semantic Confusion in Frontend
`Reconciliation.jsx` line 26: `"Webhook Failures"` maps to `summary.webhookFailures`
`adminReconciliationController.getFailures()` returns `WebhookLog` records with `processed: false`

**These are DIFFERENT things:**
- `failedPayments` = `Payment.status = 'FAILED'` (gateway rejection)
- `webhookFailures` = `WebhookLog.processed = false` (webhook processing errors)

Both are lumped into the same "failures" concept in the UI, which is misleading.

---

## INCOMPLETE PAYMENT VERIFICATION (verifyPayment flow)

### Flow Analysis (`paymentController.verifyPayment`)

1. Frontend calls `POST /api/payment/verify` with razorpay_order_id, payment_id, signature
2. Backend verifies HMAC signature
3. Backend fetches payment from Razorpay API (5s timeout)
4. If signature valid AND captured → marks Payment SUCCESS + Booking PAID (atomic session)

### Failure Scenarios & Admin Visibility

| Failure Point | Logged | Admin Visible |
|---|---|---|
| Signature mismatch | payment.status = FAILED | Count only |
| Razorpay fetch timeout | Proceeds with signature only | Not logged |
| Amount mismatch | payment.status = FAILED | Count only |
| Gateway not captured | payment.status = FAILED | Count only |
| Booking not found | 404 response | Not logged |
| Session/DB failure | abortTransaction | Not logged |

### Issues Found
- ⚠️ When Razorpay API times out (line 143: `console.warn` only), verification proceeds on signature alone — admin has no visibility this happened
- ⚠️ `verifyPayment()` references `labOrder` on line 284 (`const nbs = normalizeBookingStatus(labOrder.status)`) but `labOrder` is not defined in that scope for regular booking payments — **this is a runtime crash risk**
- ✅ Idempotency guard: if `payment.status === PAID`, returns early success

### CRITICAL BUG — Line 284 in paymentController.js
```js
// Inside verifyPayment() for BOOKING (not lab) payments:
try {
  const nbs = normalizeBookingStatus(labOrder.status);  // ← labOrder is undefined here!
  if (labOrder && (nbs === BOOKING_STATUS.COMPLETED || nbs === 'REPORT_UPLOADED')) {
```
`labOrder` is only declared in the `verifyLabPayment` scope. In `verifyPayment()`, this will throw `ReferenceError: labOrder is not defined` — but it's wrapped in try/catch so it fails silently. **The billing log for partner credit never fires for regular bookings.**

---

## COD PAYMENT VISIBILITY

### Flow
1. Provider collects cash → calls `POST /api/payments/mark-cash-collected/:id`
2. Booking `paymentStatus` → `PAID`, `collectedAmount` set, `collectedAt` set
3. Patient notified to confirm

### Admin COD Visibility
- ❌ No admin API to list bookings where `collectedAt` is set (cash collected, awaiting confirmation)
- ❌ No admin API to list bookings where provider marked PAID but patient hasn't confirmed
- ❌ No admin dashboard card for "Cash Collected — Awaiting Confirmation"
- ✅ If patient reports issue → `disputeRaised = true`, admin notified via Notification

---

## WALLET RECONCILIATION

### Issues
- `Wallet` model has no `totalEarned` or `totalWithdrawn` fields — balance only
- Cannot audit wallet history from wallet alone — must query Transaction collection
- `adminController.getProviderDetails()` fetches transactions for one provider at a time — no bulk view
- No admin API for wallet balance anomalies (negative balance, unusually high balance)

---

## RECOMMENDATIONS

| Priority | Action |
|---|---|
| CRITICAL | Fix `labOrder` reference error in `verifyPayment()` (billing log section) |
| HIGH | Add `GET /api/admin/payments/pending` with stale filter |
| HIGH | Add `GET /api/admin/payments/failed` with booking context |
| HIGH | Separate webhook failures from payment failures in reconciliation UI |
| MEDIUM | Add COD collection status tracking for admin |
| MEDIUM | Add admin notification on payment failure (not just on dispute) |
| LOW | Add Razorpay timeout logging to admin-visible error log |

---

## APIs AFFECTED
- `POST /api/payment/verify` — has silent labOrder bug
- `GET /api/admin/reconciliation/summary` — mixes two failure types
- `GET /api/admin/reconciliation/failures` — returns webhooks, not payments

## FRONTEND AFFECTED
- `Reconciliation.jsx` — "Webhook Failures" label misleading
- No dedicated pending/failed payment list pages
