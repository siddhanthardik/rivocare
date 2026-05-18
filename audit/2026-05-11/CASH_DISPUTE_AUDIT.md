# CASH DISPUTE AUDIT — Carely Platform
**Audit Date:** 2026-05-11  
**Scope:** Patient-reported cash disputes, mismatched amounts, disputed COD services, admin resolution workflow

---

## SUMMARY

| Capability | Status |
|---|---|
| Patient can report cash dispute | ✅ Exists |
| Dispute stored on booking | ✅ `disputeRaised: Boolean` |
| Admin notified of dispute | ✅ Via Notification model |
| Admin can LIST disputes | 🔴 MISSING |
| Admin can RESOLVE disputes | 🔴 MISSING |
| Provider payout protected during dispute | 🔴 NO — credited before dispute |
| Dispute history/audit trail | 🔴 MISSING |

---

## DISPUTE DATA MODEL

### Fields on Booking (`models/Booking.js`)
```js
collectedAmount: { type: Number },          // What provider claims they collected
collectedBy: { type: ObjectId, ref: 'User' }, // Who collected
collectedAt: { type: Date },                 // When collected
paymentCollectionNote: { type: String },     // Freeform notes (dispute appended here)
patientConfirmed: { type: Boolean, default: null }, // null=unconfirmed, true=confirmed, false=disputed
patientConfirmedAt: { type: Date },
disputeRaised: { type: Boolean, default: false },
```

**Structural Problems:**
- ❌ No `disputeStatus` field — cannot track `OPEN` → `UNDER_REVIEW` → `RESOLVED`
- ❌ No `disputeResolvedBy` field — no audit of who resolved
- ❌ No `disputeResolvedAt` timestamp
- ❌ No `disputeNote` — admin resolution note appended to `paymentCollectionNote` (overwrites)
- ❌ `disputeRaised` is a boolean — once raised, cannot unset without direct DB access (no API to retract)
- ❌ Patient issue text appended to `paymentCollectionNote` string: `+ '\nPATIENT_ISSUE: ' + issue` — not structured, hard to parse

---

## DISPUTE WORKFLOW ANALYSIS

### Step 1: Provider marks cash collected
```
POST /api/payments/mark-cash-collected/:id
```
- Sets `booking.paymentStatus = 'PAID'`
- Credits provider wallet **immediately** ← CRITICAL ISSUE
- Notifies patient to confirm

### Step 2: Patient confirms or disputes
**Confirm:** `POST /api/payments/confirm-cash/:id`
- Sets `patientConfirmed = true`

**Report Issue:** `POST /api/payments/report-cash-issue/:id`
- Sets `disputeRaised = true`
- Appends to `paymentCollectionNote`
- Sends notifications to all admins

### Step 3: Admin resolution
- ❌ **NO ADMIN ENDPOINT EXISTS**
- Admin must manually update DB or use a workaround

---

## PROVIDER PAYOUT BEFORE PATIENT CONFIRMATION — CRITICAL RISK

### Current Behavior
```
markCashCollectedBooking():
  1. booking.paymentStatus = 'PAID'
  2. booking.patientConfirmed = null   ← still awaiting confirmation
  3. booking.disputeRaised = false
  4. wallet.balance += netAmount       ← provider paid immediately
  5. Transaction created
  6. Notify patient to confirm/dispute
```

### Risk Scenario
1. Provider collects ₹500 from patient (actual amount)
2. Provider reports ₹1000 collected (fraudulent)
3. Provider wallet credited with ₹800 (80% of ₹1000)
4. Patient reports dispute
5. ❌ Provider wallet already has ₹800 — no hold, no clawback mechanism

### Proper Safe Design (not implemented)
```
markCashCollectedBooking():
  1. booking.paymentStatus = 'COLLECTED'   ← intermediate state
  2. booking.patientConfirmed = null
  3. Set pendingCredit on provider         ← NOT credited yet
  4. Notify patient
  
confirmCash():
  1. booking.patientConfirmed = true
  2. Credit provider wallet                ← only NOW
  
reportCashIssue() / admin resolve():
  1. booking.disputeRaised = true
  2. Withhold payout until admin resolves
```

---

## ADMIN NOTIFICATION ANALYSIS

### Current Implementation (`paymentController.reportCashIssue`)
```js
const admins = await User.find({ role: 'admin' }).select('_id');
if (admins && admins.length) {
  const notes = admins.map(a => ({
    user: a._id,
    title: 'Payment dispute reported',
    message: `Payment dispute for booking ${booking._id}`,
    type: 'SYSTEM',
    linkId: booking._id
  }));
  await Notification.insertMany(notes);
}
```

**Issues:**
- ✅ All admin users notified
- ❌ Notification message is minimal — no amount, no patient name, no provider name
- ❌ No real-time socket push — only DB notification (no `socketHelper.getIO().emit`)
- ❌ No email notification to admin
- ❌ No escalation for unresolved disputes after X days

---

## ADMIN DISPUTE VISIBILITY (Frontend)

### Admin Bookings Page (`Bookings.jsx`)
- Table shows: Order ID, Date, Service, Patient & Provider, Status, Pricing, Amount, Action
- ❌ `disputeRaised: true` is NOT surfaced with any visual indicator
- ❌ No filter tab for "Disputed" bookings
- ❌ Admin cannot see that a booking has a dispute unless they open the individual booking detail

### Reconciliation Page (`Reconciliation.jsx`)
- ❌ No dispute count or summary
- No dispute-related data displayed

### Missing UI Elements
- ❌ No "Disputes" section in admin nav
- ❌ No dispute resolution workflow UI
- ❌ No "Disputed bookings" filter in Bookings page

---

## COD COLLECTION VISIBILITY

### Provider Cash Collection Route
```
POST /api/payments/mark-cash-collected/:id
Authorization: admin OR provider (must be assigned provider)
```

### Admin COD Visibility
- Admin can call this endpoint ✅
- ❌ No admin API listing all COD bookings by status (pending/collected/disputed)
- ❌ No dashboard view of COD pipeline
- `collectedAmount` on booking is stored ✅

---

## DISPUTE STATUS TRACKING

### Current (Minimal)
```
disputeRaised: Boolean (true/false)
patientConfirmed: Boolean (null/true/false)
```

### Required (Not Implemented)
```
disputeStatus: enum ['OPEN', 'UNDER_REVIEW', 'RESOLVED_FOR_PATIENT', 'RESOLVED_FOR_PROVIDER']
disputeOpenedAt: Date
disputeResolvedAt: Date
disputeResolvedBy: ObjectId (admin user)
disputeResolutionNote: String
disputeRefundAmount: Number (if patient gets refund)
```

---

## SEVERITY SUMMARY

| Issue | Description | Severity |
|---|---|---|
| DISPUTE-001 | Provider credited before dispute can be raised | CRITICAL |
| DISPUTE-002 | No admin dispute list/management API | HIGH |
| DISPUTE-003 | No dispute status tracking (only boolean flag) | HIGH |
| DISPUTE-004 | No admin dispute resolution endpoint | HIGH |
| DISPUTE-005 | disputeRaised not shown in Bookings.jsx | HIGH |
| DISPUTE-006 | Admin notification lacks key dispute context | MEDIUM |
| DISPUTE-007 | No real-time socket push to admin on dispute | MEDIUM |
| DISPUTE-008 | No COD pipeline visibility for admin | MEDIUM |
| DISPUTE-009 | No escalation for unresolved old disputes | LOW |

---

## RECOMMENDATIONS

### Immediate (High Priority)
1. **Add `disputeStatus` enum field to Booking model**
2. **Add `GET /api/admin/disputes` endpoint** — query `{ disputeRaised: true }` with booking context
3. **Add `POST /api/admin/disputes/:id/resolve` endpoint**
4. **Add disputed booking badge/filter in Bookings.jsx**

### Short Term
5. **Consider holding provider credit until patient confirms** — set `paymentStatus: 'COLLECTED'` first, credit only after confirmation
6. **Add socket push for dispute notification to admin**
7. **Improve admin notification message** to include patient name, amount, provider name

### APIs Needed
```
GET  /api/admin/disputes          → list all disputed bookings
POST /api/admin/disputes/:id/resolve → resolve dispute
GET  /api/admin/cod/pipeline      → COD bookings by status
```
