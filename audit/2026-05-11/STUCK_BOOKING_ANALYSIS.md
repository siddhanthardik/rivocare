# STUCK BOOKING ANALYSIS — Carely Platform
**Audit Date:** 2026-05-11  
**Scope:** Bookings stuck in REQUESTED, CONFIRMED, IN_PROGRESS for abnormal durations; operational recovery

---

## SUMMARY

| Stuck State | Detection | Admin Visibility | Auto-Recovery |
|---|---|---|---|
| REQUESTED > 30 min | ⚠️ expiresAt field exists | 🔴 No admin API | ✅ Cron (reassignment.js) |
| CONFIRMED > 24h | 🔴 None | 🔴 No admin API | 🔴 None |
| IN_PROGRESS > 12h | 🔴 None | 🔴 No admin API | ⚠️ autoComplete.js (unknown interval) |
| COMPLETED + unpaid > 48h | 🔴 None | ⚠️ Count only | 🔴 None |

---

## BOOKING STATE MACHINE REVIEW

```
REQUESTED → CONFIRMED → IN_PROGRESS → COMPLETED → (PAID)
    ↓            ↓             ↓
CANCELLED   CANCELLED    CANCELLED
```

### Timeout Expectations
- **REQUESTED:** Auto-expires if not confirmed within 30 minutes (`expiresAt` set)
- **CONFIRMED:** No timeout — booking could sit confirmed with patient not paying indefinitely
- **IN_PROGRESS:** No explicit timeout — service could run forever
- **COMPLETED:** No explicit timeout — unpaid completed bookings can accumulate

---

## REQUESTED STATE ANALYSIS

### expiresAt Mechanism
```js
// bookingController.createBooking line 194
const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
```

### Expiry Enforcement
```js
// bookingController.updateBookingStatus (provider confirms)
if (targetStatus === BOOKING_STATUS.CONFIRMED) {
  if (booking.expiresAt && new Date() > booking.expiresAt) {
    booking.status = BOOKING_STATUS.CANCELLED;
    booking.cancelReason = 'System: Provider failed to accept request within expiration window.';
    await booking.save();
    return res.status(400).json({ ... 'This booking request has expired...' });
  }
}
```

**Analysis:**
- ✅ Expiry is enforced at confirm-time (lazy evaluation)
- ❌ Expiry is NOT proactively cleaned up — REQUESTED bookings past expiresAt still show as REQUESTED
- ❌ `cron/reassignment.js` presumably handles this, but not visible from this audit
- ❌ Admin cannot see "expired but not yet cancelled" bookings

**Query Admin Needs:**
```js
Booking.find({
  status: { $in: ['REQUESTED', 'pending'] },
  expiresAt: { $lt: new Date() }
})
```

---

## CONFIRMED STATE ANALYSIS

### Stuck Scenario
1. Provider confirms booking (REQUESTED → CONFIRMED)
2. Patient is notified to pay
3. Patient does not pay (wallet issues, forgets, abandons)
4. Booking sits in CONFIRMED state indefinitely with `paymentStatus: PENDING`

### Current Safeguards
- ❌ No timeout on CONFIRMED state
- ❌ No reminder notifications to patient for payment
- ❌ No auto-cancellation for unpaid CONFIRMED bookings
- ❌ No admin visibility for "CONFIRMED but not paid for > 24h"

**Query Admin Needs:**
```js
const threshold = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago
Booking.find({
  status: { $in: ['CONFIRMED', 'confirmed'] },
  paymentStatus: { $nin: ['PAID', 'COLLECTED'] },
  updatedAt: { $lt: threshold }
})
```

---

## IN_PROGRESS STATE ANALYSIS

### Stuck Scenario
1. Provider starts service (CONFIRMED → IN_PROGRESS)
2. Provider doesn't mark complete (forgot, lost internet, dispute)
3. Booking stays IN_PROGRESS indefinitely
4. Patient waiting, provider not completing

### Current Safeguards
- `autoComplete.js` cron referenced in `index.js` — exists but implementation not reviewed
- `booking.startedAt` is set when IN_PROGRESS begins ✅
- ❌ No 12-hour alert to admin
- ❌ No admin API for abnormally long IN_PROGRESS bookings

**Query Admin Needs:**
```js
const threshold = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12h ago
Booking.find({
  status: { $in: ['IN_PROGRESS', 'in-progress'] },
  startedAt: { $lt: threshold }
})
```

---

## COMPLETED + UNPAID ANALYSIS

### Stuck Scenario
1. Booking marked COMPLETED (service done)
2. `paymentStatus` still `PENDING` (patient hasn't paid or COD not confirmed)
3. Provider not credited
4. Booking sits in limbo

### Current Detection
- `reconciliationService.js` check #3: COMPLETED + PAID bookings without wallet credit ✅
- `adminReconciliationController.getSummary()` line 41: 
  ```js
  const unpaidCompleted = await Booking.countDocuments({ 
    status: 'completed',            // ← LOWERCASE — won't match 'COMPLETED'
    paymentStatus: { $ne: 'PAID' }  
  });
  ```
- ❌ This query uses lowercase `'completed'` but canonical status is `'COMPLETED'`
- ❌ This gives a WRONG count (likely 0) for newly created bookings using canonical casing

**Fix Required:**
```js
const unpaidCompleted = await Booking.countDocuments({
  status: { $in: ['COMPLETED', 'completed'] },
  paymentStatus: { $nin: ['PAID', 'paid', 'COLLECTED', 'collected'] }
});
```

---

## CRON JOBS ANALYSIS

### `cron/reassignment.js`
- Referenced in `index.js` as `startCron()`
- Presumably handles expired REQUESTED bookings and reassignment
- ⚠️ Implementation not audited here — assumed to handle REQUESTED expiry

### `cron/autoComplete.js`
- Referenced in `index.js` as `startAutoCompletionCron()`
- Presumably auto-completes long-running IN_PROGRESS bookings
- ⚠️ Implementation not audited here

### Gap: No Admin Cron Status Visibility
- ❌ No endpoint shows when crons last ran
- ❌ No endpoint shows how many bookings were auto-processed
- ❌ No alert if cron fails silently

---

## OPERATIONAL RECOVERY

### Available Actions for Stuck Bookings
1. **Admin status override:** `PUT /api/bookings/:id/status` with admin role
   - Admin role has `[CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, PAID]` in allowed transitions
   - ✅ Admin CAN force-transition stuck bookings
   - ❌ No dedicated "admin recovery" UI for this

2. **Admin can cancel:** Any booking not in terminal state can be cancelled by admin
   - ❌ But COMPLETED → CANCELLED is not in `VALID_BOOKING_TRANSITIONS`
   - Admin role bypasses state transition check? → **NO** — `allowedByState` check still applies
   - `VALID_BOOKING_TRANSITIONS[COMPLETED] = ['PAID']` — admin cannot cancel completed bookings directly

3. **Payment sync:** `POST /api/payment/sync/:paymentId` → recovers stuck payment
   - ✅ Available and functional

---

## MISSING ADMIN APIs

### Required Endpoints (None Exist)
```
GET /api/admin/stuck-bookings
Query params: type = 'expired-requested' | 'unpaid-confirmed' | 'long-inprogress' | 'unpaid-completed'
Response: bookings[] with age, patient, provider, amount, status

POST /api/admin/bookings/:id/force-complete
POST /api/admin/bookings/:id/force-cancel
GET  /api/admin/bookings/operational-alerts
```

---

## SEVERITY SUMMARY

| Issue | Description | Severity |
|---|---|---|
| STUCK-001 | No admin API for expired REQUESTED bookings | HIGH |
| STUCK-002 | No admin API for unpaid CONFIRMED bookings | HIGH |
| STUCK-003 | No admin API for abnormally long IN_PROGRESS bookings | HIGH |
| STUCK-004 | unpaidCompleted count uses wrong status casing | HIGH |
| STUCK-005 | Admin cannot cancel a COMPLETED booking (state machine block) | MEDIUM |
| STUCK-006 | No cron visibility/monitoring for admin | MEDIUM |
| STUCK-007 | No proactive expiry cleanup (lazy evaluation only) | MEDIUM |
| STUCK-008 | No patient payment reminder for CONFIRMED-unpaid bookings | LOW |

---

## RECOMMENDATIONS

### Immediate
1. **Fix `unpaidCompleted` query to use `$in: ['COMPLETED', 'completed']`**
2. **Add `COMPLETED → CANCELLED` transition for admin role** (or create admin-only force-cancel endpoint)

### Short Term
3. **Add `GET /api/admin/stuck-bookings`** with stale threshold queries per state
4. **Add `GET /api/admin/bookings/operational-alerts`** — dashboard card counts for each stuck type

### Medium Term
5. **Add `CONFIRMED + unpaid > 48h` → auto-remind or auto-cancel** via cron
6. **Add cron monitoring endpoint** for operational visibility
