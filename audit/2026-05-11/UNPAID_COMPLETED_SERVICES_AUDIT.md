# UNPAID COMPLETED SERVICES AUDIT — Carely Platform
**Audit Date:** 2026-05-11  
**Scope:** Bookings with status=COMPLETED and paymentStatus≠PAID — visibility, prevention of silent disappearance, COD collection workflow

---

## EXECUTIVE SUMMARY

Unpaid completed services represent the highest financial risk category — services were rendered but not paid for. Currently there is:
- ✅ A count metric visible in admin reconciliation
- 🔴 A BROKEN query that returns wrong count (wrong status casing)
- 🔴 No drill-down list for admin to see individual records
- 🔴 No automated recovery workflow

---

## DEFINITION

**Unpaid Completed Service:**
```
Booking.status   = 'COMPLETED' (or 'completed')
Booking.paymentStatus ≠ 'PAID' AND ≠ 'COLLECTED'
```

This includes:
1. **Online bookings:** Service completed, patient hasn't paid online
2. **COD bookings:** Service completed, provider hasn't collected cash yet
3. **COD bookings:** Provider recorded collection, patient hasn't confirmed (paymentStatus = PAID but patientConfirmed = null)
4. **Dispute bookings:** Completed, COD claimed, patient disputed

---

## CURRENT DETECTION

### reconciliationService.js (Check #3)
```js
const completedBookings = await Booking.find({
  status: BOOKING_STATUS.COMPLETED,   // ← 'COMPLETED' (uppercase)
  paymentStatus: { $in: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.COLLECTED] }
});
```
This finds COMPLETED+PAID bookings to check for MISSING wallet credits. It does NOT find unpaid ones directly.

### adminReconciliationController.js (getSummary)
```js
const unpaidCompleted = await Booking.countDocuments({
  status: 'completed',              // ← lowercase 'completed'
  paymentStatus: { $ne: 'PAID' }   // ← misses 'COLLECTED', 'REFUNDED', 'FAILED'
});
```

**TWO BUGS:**

**Bug 1 — Status Casing Mismatch:**
- `createBooking()` creates bookings with `status: BOOKING_STATUS.REQUESTED` = `'REQUESTED'`
- `updateBookingStatus()` sets `booking.status = targetStatus` where `targetStatus` = `BOOKING_STATUS.COMPLETED` = `'COMPLETED'`
- Query uses `'completed'` (lowercase) → **returns 0 in most cases**

**Bug 2 — Incomplete paymentStatus Exclusion:**
- `{ $ne: 'PAID' }` also matches `COLLECTED`, `REFUNDED`, `FAILED` as "unpaid"
- A booking with `paymentStatus = 'COLLECTED'` (cash collected by provider) IS effectively being settled — it should not appear as unpaid
- Better: `{ $nin: ['PAID', 'paid', 'COLLECTED', 'collected'] }`

---

## CORRECTED QUERY

```js
// Correct unpaidCompleted query
const unpaidCompleted = await Booking.countDocuments({
  status: { $in: ['COMPLETED', 'completed'] },
  paymentStatus: { 
    $nin: ['PAID', 'paid', 'COLLECTED', 'collected', 'SUCCESS', 'success'] 
  }
});
```

---

## ADMIN VISIBILITY ANALYSIS

### What Admin Can See
- `Reconciliation.jsx` → KPI chip: "Unpaid Completed Services" count
- BUT this count is **wrong** due to Bug 1 above
- ❌ No drill-down — no way to see which bookings
- ❌ No patient or provider names
- ❌ No amount at risk

### What Admin CANNOT See
- ❌ Individual unpaid completed bookings with full context
- ❌ How long each has been in unpaid state (age since completion)
- ❌ Whether it's a COD vs online payment issue
- ❌ Which provider rendered the service without getting paid

---

## SILENT DISAPPEARANCE RISK

Can an unpaid completed booking disappear silently?

**Scenario 1: Admin deletes booking**
- `DELETE /api/bookings/:id` (admin only) — permanently deletes ✅ intentional
- ❌ No soft-delete, no audit trail of deletion

**Scenario 2: Status transition overwrites**
- After COMPLETED, only `PAID` transition is allowed (`VALID_BOOKING_TRANSITIONS[COMPLETED] = ['PAID']`)
- Cannot become CANCELLED from COMPLETED via normal flow ✅
- But ADMIN role bypasses via `roleBasedAllowed.admin` → admin CAN force CANCELLED on completed booking via `updateBookingStatus`
- ⚠️ If admin manually transitions COMPLETED → CANCELLED, the unpaid service disappears from unpaid tracking without any payment received

**Scenario 3: Direct DB manipulation**
- No audit log on booking documents (no `updatedBy` tracking)

---

## COD COLLECTION WORKFLOW FOR COMPLETED BOOKINGS

### Happy Path
```
COMPLETED + paymentStatus=PENDING
  → Provider calls markCashCollectedBooking()
  → paymentStatus = 'PAID', collectedAmount set
  → Patient notified to confirm
  → Patient calls confirmCash()
  → patientConfirmed = true
```

### Admin Visibility in This Flow
- ❌ No admin dashboard shows bookings in "awaiting patient confirmation" state
- ❌ No admin API for `{ status: 'COMPLETED', paymentStatus: 'PAID', patientConfirmed: null }`
- ❌ No admin API for `{ status: 'COMPLETED', paymentStatus: 'PAID', disputeRaised: true }`

### COD States After Completion
| State | Description | Admin Visible |
|---|---|---|
| paymentStatus=PENDING | Not yet collected | Count (broken) |
| paymentStatus=PAID, patientConfirmed=null | Collected, unconfirmed | ❌ Not visible |
| paymentStatus=PAID, patientConfirmed=true | Fully resolved | ❌ Not tracked |
| paymentStatus=PAID, disputeRaised=true | Disputed | ❌ Not visible |

---

## PROVIDER CREDIT STATUS FOR COMPLETED BOOKINGS

### When is provider credited?
1. `creditProviderIfNeeded()` called after booking.save() in `updateBookingStatus()`
2. Condition: `status === COMPLETED AND (paymentStatus === PAID OR collectedAt is set)`

### For Unpaid Completed Bookings
- `paymentStatus === PENDING` AND `collectedAt` not set → provider NOT credited ✅
- This is correct behavior — provider earns only when payment is confirmed

### Reconciliation Service Check
```js
// Check 3: Completed + PAID/COLLECTED without wallet credit
const completedBookings = await Booking.find({
  status: BOOKING_STATUS.COMPLETED,
  paymentStatus: { $in: [PAYMENT_STATUS.PAID, PAYMENT_STATUS.COLLECTED] }
});
for (const b of completedBookings) {
  const tx = await Transaction.findOne({ referenceId: b._id, type: 'CREDIT' });
  if (!tx) { issues.push({ type: 'MISSING_PROVIDER_CREDIT', ... }); }
}
```
✅ This correctly identifies PAID/COLLECTED completed bookings without provider credit.
⚠️ This runs N+1 queries (one per booking) — performance issue at scale.

---

## MISSING API — LIST UNPAID COMPLETED BOOKINGS

**Required Endpoint:**
```
GET /api/admin/bookings/unpaid-completed
Query: { page, limit, ageHours }
Returns: bookings[] with patient, provider, service, amount, completedAt, ageHours, paymentStatus
```

**Query:**
```js
Booking.find({
  status: { $in: ['COMPLETED', 'completed'] },
  paymentStatus: { $nin: ['PAID', 'paid', 'COLLECTED', 'collected'] }
})
.populate('patient', 'name phone email')
.populate({ path: 'provider', populate: { path: 'user', select: 'name phone email' } })
.populate('service', 'name')
.sort({ completedAt: -1 })
```

---

## SEVERITY SUMMARY

| Issue | Description | Severity |
|---|---|---|
| UCS-001 | unpaidCompleted count uses wrong status casing → returns 0 | CRITICAL |
| UCS-002 | $ne: 'PAID' doesn't exclude COLLECTED — over-counts | HIGH |
| UCS-003 | No list API for unpaid completed services | HIGH |
| UCS-004 | Admin can force COMPLETED → CANCELLED, bypassing payment | MEDIUM |
| UCS-005 | COD collection states invisible to admin | HIGH |
| UCS-006 | No age-based alerting for old unpaid completed services | MEDIUM |
| UCS-007 | Reconciliation check #3 runs N+1 queries | LOW |

---

## IMMEDIATE FIXES REQUIRED

### Fix 1: Correct the unpaidCompleted query (adminReconciliationController.js line 41)
```js
// BEFORE (broken):
const unpaidCompleted = await Booking.countDocuments({ 
  status: 'completed', 
  paymentStatus: { $ne: 'PAID' } 
});

// AFTER (correct):
const unpaidCompleted = await Booking.countDocuments({
  status: { $in: ['COMPLETED', 'completed'] },
  paymentStatus: { $nin: ['PAID', 'paid', 'COLLECTED', 'collected'] }
});
```

### Fix 2: Add list API for admin visibility
Add to `admin.js` router:
```js
router.get('/bookings/unpaid-completed', getUnpaidCompletedBookings);
```

### Fix 3: Add adminService method in frontend
```js
getUnpaidCompleted: (params) => api.get('/admin/bookings/unpaid-completed', { params })
```

### Fix 4: Surface in Reconciliation.jsx
- Make "Unpaid Completed Services" KPI chip clickable → opens drill-down list
- Add booking table with patient, provider, amount, age
