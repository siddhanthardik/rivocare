# ADMIN OPERATIONS AUDIT — Carely Platform
**Audit Date:** 2026-05-11  
**Auditor:** Antigravity (Automated Code Audit)  
**Scope:** Full operational admin system — payment visibility, payout safety, dispute handling, stuck bookings, API wiring, frontend visibility, data consistency, failure recovery.

---

## EXECUTIVE SUMMARY

| Area | Status | Critical Issues |
|------|--------|-----------------|
| Pending Payments Visibility | ⚠️ PARTIAL | Admin has no dedicated pending-payment API |
| Failed Payments Visibility | ⚠️ PARTIAL | Failed payments logged but no admin list API |
| Cash Disputes | 🔴 MISSING | No admin dispute-list API exists |
| Provider Payouts | ✅ SAFE | Idempotency guards in place |
| Cancellations | ✅ SAFE | Excluded from revenue queries |
| Stuck Bookings | 🔴 MISSING | No stale-booking detection/alerting |
| Unpaid Completed Services | ⚠️ PARTIAL | Count visible, no drilldown list |
| API Wiring | ⚠️ PARTIAL | Several missing admin routes |
| Frontend Visibility | ⚠️ PARTIAL | Reconciliation page is placeholder-level |
| Data Consistency | ⚠️ PARTIAL | Reconciliation engine runs on every stats call |
| Failure Recovery | ✅ SAFE | syncPaymentStatus endpoint exists |

**Overall Risk Level: MEDIUM-HIGH**

---

## DETAILED FINDINGS

### AREA 1 — PENDING PAYMENTS

**Backend Query Coverage:**
- `GET /api/admin/stats` → `pendingBookings` count uses `BOOKING_STATUS.REQUESTED` — correct
- `GET /api/admin/reconciliation/summary` → `pendingPayments` counts `Payment.status = 'CREATED'` — correct
- ✅ Pending Razorpay orders visible via reconciliation summary count
- ❌ No API to list individual pending payments with booking context
- ❌ No age/staleness filter (cannot find 24h+ old pending orders)
- ⚠️ COD pending: No dedicated admin endpoint; only count from `Booking.paymentStatus = COLLECTED` implied

**Payment Model Analysis:**
- `Payment.status` enum: `['CREATED', 'SUCCESS', 'FAILED']`
- `Booking.paymentStatus` enum: `['PENDING', 'PAID', 'REFUNDED', 'COLLECTED', 'FAILED']`
- These enums are **inconsistent** — Payment uses `SUCCESS`/`CREATED`, Booking uses `PAID`/`PENDING`
- `normalizePaymentStatus()` maps both, but admin queries in `adminReconciliationController.js` hit raw strings directly (line 18: `status: 'CREATED'`, line 19: `status: 'FAILED'`)

**ISSUE-001:** `adminReconciliationController.getSummary()` uses raw string `'CREATED'` without normalization — if Payment model ever uses `PAYMENT_STATUS` constant, this query will break silently.

**ISSUE-002:** No admin endpoint lists individual pending/stale Razorpay payments with booking details.

---

### AREA 2 — FAILED PAYMENTS

**Backend Coverage:**
- `adminReconciliationController.getSummary()` → `failedPayments` count ✅
- `adminReconciliationController.getFailures()` → lists unprocessed **webhook logs** only (not failed payments)
- ❌ `getFailures()` returns `WebhookLog` records with `processed: false`, NOT `Payment` records with `status: FAILED`
- This is a **semantic mismatch** — frontend "Webhook Failures" ≠ "Failed Payments"

**Webhook Handling:**
- `razorpayWebhookController.js` handles `payment.failed` → sets `payment.status = 'FAILED'` ✅
- Idempotency guard via `payloadHash` and `eventId` dedup ✅
- Does NOT update `Booking.paymentStatus` on payment failure — booking stays `PENDING` ✅ (correct behavior)
- ❌ No admin notification triggered on payment failure
- ❌ No alert for repeated failures on same booking

**ISSUE-003:** Failed payments visible only via count. Admin cannot view the list of failed payment records with booking context.

**ISSUE-004:** `getFailures()` returns webhook processing failures, not payment failures — these are different concerns mixed under same label.

---

### AREA 3 — CASH DISPUTES

**Backend Coverage:**
- `Booking` schema: `disputeRaised: Boolean`, `patientConfirmed: Boolean` ✅
- `reportCashIssue()` in `paymentController.js` sets `disputeRaised = true` and notifies admins ✅
- Admin notifications sent via `Notification.insertMany()` ✅

**CRITICAL GAPS:**
- ❌ No `GET /api/admin/disputes` endpoint — admin cannot list disputed bookings
- ❌ No admin endpoint to mark a dispute as resolved
- ❌ No dispute status tracking beyond `disputeRaised: Boolean` (no resolution timestamp, no resolver ID)
- ❌ `Reconciliation.jsx` does not show disputed bookings
- ❌ `Bookings.jsx` does not highlight `disputeRaised: true` bookings with a badge
- ⚠️ Provider wallet is credited at cash collection time (before dispute), not after patient confirmation

**ISSUE-005 (HIGH SEVERITY):** Provider wallet is credited when admin/provider calls `markCashCollectedBooking()` — BEFORE patient confirms. If patient raises dispute, provider has already been paid. No fund hold mechanism exists.

**ISSUE-006 (HIGH SEVERITY):** Disputes can only be viewed if admin manually queries the DB. There is no admin API or UI for dispute management.

---

### AREA 4 — PROVIDER PAYOUTS

**Backend Coverage:**
- `creditProviderIfNeeded()` in `bookingController.js` checks for existing transaction before crediting ✅
- `Transaction.findOne({ referenceId: booking._id, type: 'CREDIT', description: /Earnings for Service/i })` — idempotency guard ✅
- `markCashCollectedBooking()` checks `Transaction.findOne({ referenceId: booking._id, referenceType: 'Booking' })` ✅
- 80/20 split: `booking.providerEarning || Math.round(totalAmount * 0.8)` ✅

**Idempotency Analysis:**
- Webhook replay: `WebhookLog` dedup via `payloadHash` + `eventId` ✅
- `verifyPayment()` checks `Payment.status === PAID` before processing ✅
- `creditProviderIfNeeded()` checks for existing CREDIT transaction ✅

**ISSUES Found:**
- ⚠️ `creditProviderIfNeeded()` description pattern `/Earnings for Service/i` is fragile — if description is changed, duplicate check fails silently
- ⚠️ `markCashCollectedBooking()` idempotency check uses `referenceType: 'Booking'` but no type filter — any transaction (DEBIT/CREDIT) prevents re-credit
- ⚠️ Referral bonus (₹100) in `bookingController.js` line 856 uses `referrerWallet.balance += 100; await referrerWallet.save()` — this is NOT atomic and has a race condition. Should use `$inc`.

**ISSUE-007:** Referral bonus crediting (`bookingController.js` line 856) uses non-atomic `balance += 100` + `save()` — concurrent requests can cause double crediting.

**ISSUE-008:** `PayoutRequest.provider` references `'Partner'` model (lab partner), not the `Provider` model. Provider (home care) payout requests use a different flow than lab payouts. The payout controller (`payoutController.js`) appears designed for lab partner payouts, NOT home-care provider payouts. Home-care provider earnings go to `Wallet` model; lab partner earnings go to `PartnerWallet` model.

---

### AREA 5 — CANCELLATIONS

**Backend Coverage:**
- Cancelled bookings excluded from revenue queries via `paymentStatus: PAID` filter ✅
- `getDashboardSummary()` explicitly excludes cancelled bookings from `grossRevenue` aggregate ✅
- `cancelReason` stored on booking ✅
- Provider cancellation increments `cancellationCount` ✅
- Fraud analysis triggered on provider cancellation ✅

**Gaps:**
- ❌ No admin API for cancellation analytics (breakdown by reason, by role, by provider)
- ❌ No-show detection: `Booking.expiresAt` exists but admin cannot view expired-then-cancelled bookings separately

---

### AREA 6 — STUCK BOOKINGS

**CRITICAL MISSING FEATURE:**
- ❌ No stale booking detection
- ❌ No admin API for `REQUESTED` bookings older than 30 minutes
- ❌ No admin API for `CONFIRMED` bookings where `scheduledAt` has passed
- ❌ No admin API for `IN_PROGRESS` bookings older than 12 hours

**Existing partial coverage:**
- Cron job `cron/autoComplete.js` exists (referenced in `index.js`) — handles auto-completion
- Cron job `cron/reassignment.js` exists — handles reassignment
- Neither cron exposes admin-visible alerts

**ISSUE-009 (HIGH SEVERITY):** Admin cannot identify stuck bookings operationally without direct DB access.

---

### AREA 7 — UNPAID COMPLETED SERVICES

**Backend Coverage:**
- `reconciliationService.js` check #3: completed bookings without wallet credits ✅
- `adminReconciliationController.getSummary()`: `unpaidCompleted` count ✅ (but uses raw string `'completed'` not `BOOKING_STATUS.COMPLETED`)
- `Reconciliation.jsx` displays `unpaidCompleted` KPI chip ✅

**ISSUE-010:** `adminReconciliationController.getSummary()` line 41 queries `status: 'completed'` (lowercase) but canonical status is `'COMPLETED'` (uppercase). This query will return zero results unless bookings were stored with lowercase status.

---

### AREA 8 — API WIRING

**Auth Middleware:**
- All admin routes protected via `router.use(protect, requireRole('admin'))` ✅
- `payoutRoutes.js` uses `router.use(protect); router.use(requireRole('admin'))` ✅
- `adminReconciliation.js` uses both middleware ✅

**Route Mounting (index.js):**
- `/api/admin` → admin routes ✅
- `/api/admin/payouts` → payout routes ✅
- `/api/admin/reconciliation` → reconciliation routes ✅
- **CONFLICT:** `/api/admin/labs/reconciliation` is mounted before `/api/admin/labs` — could cause route shadowing

**Missing Admin Routes:**
- ❌ No `GET /api/admin/disputes` route
- ❌ No `GET /api/admin/stuck-bookings` route  
- ❌ No `GET /api/admin/payments/pending` route (list view)
- ❌ No `GET /api/admin/payments/failed` route (list view)
- ❌ No admin reconciliation fix endpoint wired (exists in controller but not in `admin.js` router)

**ISSUE-011:** `fixReconciliationIssue()` in `adminController.js` uses undefined `Payment` variable (line 965: `const payment = await Payment.findOne(...)` — `Payment` model is not imported in `adminController.js`). **This will crash at runtime.**

---

### AREA 9 — FRONTEND VISIBILITY

**Admin Bookings Page:**
- Shows booking status badge ✅
- Shows payment status (PAID only) ✅
- Admin price override modal ✅
- Filters: all, pending, confirmed, in-progress, completed, cancelled ✅
- ❌ No `disputeRaised` badge
- ❌ No COD collection status column
- ❌ No "stuck booking" highlight for aged records

**Reconciliation Page:**
- 6 KPI chips: totalCollected, pendingPayments, failedPayments, pendingPayouts, webhookFailures, unpaidCompleted ✅
- "Open Payments" and "Open Payouts" buttons redirect to unimplemented routes ❌
- No inline payment/payout tables — just buttons

**FinanceOS Page:**
- Calls `labService.getFinanceMetrics()` — this is a **lab-specific** metrics endpoint
- This page is designed for lab partner finances, NOT home-care provider finances
- ❌ Home-care provider payout management has no dedicated admin UI

---

### AREA 10 — DATA CONSISTENCY

**Reconciliation Engine (`reconciliationService.js`):**
- Check 1: PAID bookings without successful Payment records ✅
- Check 2: SUCCESS payments without PAID bookings (desync) ✅
- Check 3: Completed+Paid bookings without wallet credits ✅
- Check 4: Orphan payments (no booking, no intent) ✅

**Issues:**
- ⚠️ This runs on EVERY `getStats()` and `getDashboardSummary()` call — expensive N+1 queries on every page load
- ❌ No check for duplicate wallet credits (multiple CREDIT transactions for same booking)
- ❌ No check for wallet balance < sum of credits (negative balance detection)
- ❌ `reconciliationService` uses `BOOKING_STATUS.COMPLETED` but `adminReconciliationController` uses raw `'completed'` — inconsistency

---

### AREA 11 — FAILURE RECOVERY

**Available Recovery Endpoints:**
- `POST /api/payment/sync/:paymentId` → fetches Razorpay, marks PAID, syncs booking ✅
- `POST /api/admin/reconciliation/fix/:bookingId` → syncs payment→booking ✅ (but Payment import missing)
- `POST /api/admin/payouts/:id/fail` → releases reserved balance ✅
- `POST /api/admin/payouts/:id/reject` → marks rejected ✅

**Frontend:**
- `reconciliationService.js` doesn't expose `syncPaymentStatus` — admin cannot trigger manual recovery from UI

---

## SEVERITY SUMMARY

| Issue ID | Description | Severity |
|----------|-------------|----------|
| ISSUE-001 | Raw string 'CREATED' in reconciliation query | LOW |
| ISSUE-002 | No admin list API for pending payments | MEDIUM |
| ISSUE-003 | No admin list API for failed payments | MEDIUM |
| ISSUE-004 | Webhook failures ≠ payment failures semantic mismatch | LOW |
| ISSUE-005 | Provider credited before patient confirms dispute | HIGH |
| ISSUE-006 | No admin dispute management API or UI | HIGH |
| ISSUE-007 | Non-atomic referral bonus crediting (race condition) | HIGH |
| ISSUE-008 | PayoutRequest references Partner, not Provider model | MEDIUM |
| ISSUE-009 | No stuck booking detection for admin | HIGH |
| ISSUE-010 | Raw lowercase 'completed' in unpaidCompleted query | HIGH |
| ISSUE-011 | Payment not imported in adminController.fixReconciliation | CRITICAL |

---

## RECOMMENDATIONS

1. **IMMEDIATE (CRITICAL):** Import `Payment` model in `adminController.js` or remove broken `fixReconciliationIssue` route
2. **IMMEDIATE (HIGH):** Fix `unpaidCompleted` query to use `BOOKING_STATUS.COMPLETED` constant
3. **HIGH:** Add admin dispute list API and UI visibility
4. **HIGH:** Add stuck booking detection API (stale REQUESTED/CONFIRMED/IN_PROGRESS)
5. **HIGH:** Fix referral bonus to use atomic `$inc` operation
6. **MEDIUM:** Add admin list APIs for pending and failed payments
7. **MEDIUM:** Consider holding provider payout until patient confirms cash receipt
8. **LOW:** Memoize reconciliation check — don't run on every stats call
