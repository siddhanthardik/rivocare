# AUDIT INDEX — Carely Admin Operations Audit
**Date:** 2026-05-11

## Reports Generated

| Report | File | Focus |
|---|---|---|
| Master Audit | `ADMIN_OPERATIONS_AUDIT.md` | All 11 areas, executive summary, issue registry |
| Payment Visibility | `PAYMENT_VISIBILITY_AUDIT.md` | Pending/failed/incomplete payment visibility |
| Provider Payouts | `PROVIDER_PAYOUT_AUDIT.md` | Idempotency, splits, referral race conditions |
| Cash Disputes | `CASH_DISPUTE_AUDIT.md` | Dispute lifecycle, admin visibility gaps |
| Stuck Bookings | `STUCK_BOOKING_ANALYSIS.md` | Stale states, cron gaps, recovery |
| API Wiring | `API_WIRING_VALIDATION.md` | Route coverage, auth, frontend-backend mapping |
| Unpaid Services | `UNPAID_COMPLETED_SERVICES_AUDIT.md` | COMPLETED+unpaid tracking and fix |
| Data Consistency | `DATA_CONSISTENCY_AUDIT.md` | Reconciliation engine, idempotency, recovery |

## Issues Fixed in This Audit Session

| ID | File Modified | What Was Fixed |
|---|---|---|
| ISSUE-011 | `adminController.js` | Added missing `Payment` model import — prevented runtime crash |
| ISSUE-011 | `adminController.js` | Rewrote `fixReconciliationIssue` with correct Payment status check |
| ISSUE-010 | `adminReconciliationController.js` | Fixed `unpaidCompleted` query: lowercase 'completed' → `$in ['COMPLETED','completed']` |
| ISSUE-010 | `adminReconciliationController.js` | Fixed `paymentStatus` exclusion to include 'COLLECTED' |
| NEW | `adminReconciliationController.js` | Added `disputedBookings` count to reconciliation summary |
| ISSUE-007 | `bookingController.js` | Fixed non-atomic referral bonus: `+= / save()` → `$inc` + idempotency guard |
| PAYOUT-003 | `payoutController.js` | Fixed `pendingPayouts` not being decremented on payout completion |
| NEW | `adminController.js` | Added `getUnpaidCompletedBookings()` endpoint |
| NEW | `adminController.js` | Added `getDisputes()` endpoint |
| NEW | `adminController.js` | Added `getStuckBookings()` endpoint |
| W-005 | `routes/admin.js` | Wired previously dead reconciliation report/fix endpoints |
| NEW | `routes/admin.js` | Wired 3 new operational endpoints |
| NEW | `services/adminService.js` | Added 5 new service methods for operational endpoints |
| NEW | `Reconciliation.jsx` | Added disputed bookings KPI chip |
| NEW | `Reconciliation.jsx` | Added dispute + unpaid completed breakdown cards |
| ISSUE-006 | `Bookings.jsx` | Added "Dispute Raised" badge on disputed bookings |
| ISSUE-006 | `Bookings.jsx` | Added "disputed" filter tab to booking list |

## Remaining Open Issues (Not Fixed — Require Planning)

| ID | Description | Recommended Action |
|---|---|---|
| DISPUTE-001 | Provider credited before dispute can be raised | Hold credit until patient confirms |
| ISSUE-005 | No admin dispute resolution endpoint | Add `POST /api/admin/disputes/:id/resolve` |
| PAYOUT-001 | Cross-path idempotency gap between 3 credit functions | Standardize `referenceType: 'Booking'` in all 3 |
| CONSIST-001 | N+1 queries in reconciliation Check 3 | Rewrite with aggregation $lookup |
| CONSIST-002 | Full reconciliation on every dashboard load | Cache/cron-ify |
| CONSIST-003 | No duplicate wallet credit detection | Add to reconciliation engine |
| W-002 | `bookingService.collectCash` calls wrong URL | Fix to `/api/payment/mark-cash-collected/:id` |
| ISSUE-009 | No stuck booking admin UI page | Build dedicated operational alerts page |
| PAYOUT-008 | Home-care provider payout has no admin aggregate view | Build provider earnings summary page |
