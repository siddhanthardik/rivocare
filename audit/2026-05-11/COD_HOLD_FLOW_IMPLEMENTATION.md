# COD HOLD FLOW IMPLEMENTATION REPORT
**Date:** 2026-05-11  
**Phase:** 1 — COD Payout Hold Hardening  
**Status:** IMPLEMENTED

---

## What Changed

### Problem
Provider wallet was credited **immediately** when cash was marked collected — before the patient had confirmed the amount. This exposed the platform to COD fraud:
- Provider could report higher amount than collected
- Provider already credited before patient dispute is possible
- No intermediate state existed for admin visibility

### Solution
Added `COLLECTED` as a canonical booking status between `COMPLETED` and `PAID`.

**New Lifecycle:**
```
REQUESTED → CONFIRMED → IN_PROGRESS → COMPLETED → COLLECTED → PAID
                                                       ↓
                                              paymentStatus: PENDING_CONFIRMATION
                                                       ↓
                                              Patient disputes → paymentStatus: DISPUTED
                                                       ↓
                                              Patient confirms → status: PAID
                                                               → provider credited
```

**Provider wallet credit fires ONLY when `booking.status = PAID`**  
**NEVER fires at `COLLECTED`**

---

## Files Modified

### Backend

| File | Change |
|---|---|
| `backend/src/constants/bookingStatus.js` | Added `COLLECTED` to `BOOKING_STATUS`, `PENDING_CONFIRMATION`+`DISPUTED` to `PAYMENT_STATUS`, updated `VALID_BOOKING_TRANSITIONS` |
| `backend/src/controllers/paymentController.js` | `markCashCollectedBooking()`: removed wallet credit, sets `COLLECTED`+`PENDING_CONFIRMATION`; `confirmCash()`: full atomic credit with idempotency; `reportCashIssue()`: sets `DISPUTED`, enriched admin notification |
| `backend/src/controllers/bookingController.js` | `creditProviderIfNeeded()`: removed `collectedAt` trigger, PAID-only; added `referenceType:'Booking'` to all transactions; exported `triggerReferralBonus()` |

### Frontend

| File | Change |
|---|---|
| `frontend/src/constants/bookingStatus.js` | Mirrored backend — `COLLECTED`, `PENDING_CONFIRMATION`, `DISPUTED` |
| `frontend/src/utils/constants.js` | Added status colors: `collected`=amber, `disputed`=red, `pending_confirmation`=amber |
| `frontend/src/pages/dashboard/provider/Bookings.jsx` | COLLECTED state banner; removed Mark Paid button; collect button hidden in COLLECTED state; added `collected` filter tab |
| `frontend/src/pages/dashboard/patient/Bookings.jsx` | COD confirmation card; dispute modal; DISPUTED badge; `collected` filter tab with badge count |
| `frontend/src/pages/dashboard/admin/Bookings.jsx` | Added `collected` filter tab |

---

## API Changes

No new routes added. All existing routes now behave correctly:

| Endpoint | Before | After |
|---|---|---|
| `POST /api/payment/mark-cash-collected/:id` | Sets `PAID`, credits wallet immediately | Sets `COLLECTED`, `PENDING_CONFIRMATION`, NO credit |
| `POST /api/payments/confirm-cash/:id` | Only set `patientConfirmed=true` | Sets `PAID`, credits provider atomically with idempotency |
| `POST /api/payments/report-cash-issue/:id` | Set `disputeRaised=true` only | Sets `DISPUTED`, enriched admin notification |

---

## Backward Compatibility

- Old COD bookings already at `paymentStatus = PAID` → unaffected (still display as PAID)
- Old bookings at `paymentStatus = COLLECTED` (legacy from `bookingController.collectCash`) → normalize to `COLLECTED` (treated as awaiting confirmation)
- The `normalizeBookingStatus('COLLECTED')` function returns `BOOKING_STATUS.COLLECTED`
- The `VALID_BOOKING_TRANSITIONS[COMPLETED]` now includes both `COLLECTED` and `PAID` — online/prepaid bookings still go `COMPLETED → PAID` directly

---

## Idempotency Guarantees

All credit operations now use:
```js
Transaction.findOne({
  referenceId: booking._id,
  referenceType: 'Booking',
  type: 'CREDIT',
})
```
This is a **unified cross-path check** — any credit from any path (markCashCollected, confirmCash, creditProviderIfNeeded) will be found by the others, preventing double credits.
