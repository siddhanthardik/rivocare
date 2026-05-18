# COD DISPUTE FLOW VALIDATION
**Date:** 2026-05-11

---

## Dispute Lifecycle

```
Provider collects cash
  → POST /api/payment/mark-cash-collected/:id
  → booking.status = COLLECTED
  → booking.paymentStatus = PENDING_CONFIRMATION
  → Patient notified

Patient sees confirmation card (patient/Bookings.jsx)
  ↓
  CONFIRM: POST /api/payments/confirm-cash/:id
    → booking.status = PAID
    → booking.paymentStatus = PAID
    → booking.patientConfirmed = true
    → Provider wallet credited (atomic + idempotent)
    → Patient notified: "Payment confirmed ✓"

  REPORT ISSUE: POST /api/payments/report-cash-issue/:id
    → booking.paymentStatus = DISPUTED
    → booking.status = COLLECTED (unchanged)
    → booking.disputeRaised = true
    → booking.paymentCollectionNote += "PATIENT_DISPUTE [timestamp]: <issue>"
    → All admins notified with: patient name, provider name, amount, issue text
    → Provider NOT credited
```

---

## Dispute Data Fields

```js
{
  disputeRaised: true,                       // boolean flag
  paymentStatus: 'DISPUTED',                 // new canonical status
  status: 'COLLECTED',                       // booking status unchanged
  paymentCollectionNote: "...PATIENT_DISPUTE [2026-05-11T...]: amount wrong",
  collectedAmount: 500,                      // what provider claimed
  totalAmount: 500,                          // what was expected
  patientConfirmed: null,                    // still null (not confirmed)
}
```

---

## Admin Visibility

| View | Data Available |
|---|---|
| Admin Bookings → "disputed" tab | All disputed bookings |
| Admin Bookings → "collected" tab | All COLLECTED (incl. DISPUTED) |
| Reconciliation.jsx → "Disputed Bookings" KPI | Count of all `disputeRaised=true` |
| GET /api/admin/disputes | Full list with patient, provider, amount context |

---

## Dispute Resolution (Admin)

Currently admin can:
1. View disputed booking via `GET /api/admin/disputes`
2. Force-mark PAID via `markPaid` endpoint (if resolved in provider's favor)
3. Cancel booking if deemed fraudulent (admin role)

**NOT yet implemented:**
- `POST /api/admin/disputes/:id/resolve` — formal resolution with audit trail
- Partial refund to patient
- Wallet clawback from provider

---

## Admin Notification Content (After Fix)

**Before:**
> "Payment dispute for booking 6641a..."

**After:**
> "⚠️ COD Dispute Raised — Ravi Kumar disputes ₹500 cash collected by Dr. Priya for booking #8FA3C2. Issue: Provider collected only ₹200"

---

## Idempotency

| Scenario | Result |
|---|---|
| Patient reports issue twice | 2nd call returns early (disputeRaised=true && DISPUTED check) |
| Patient confirms after reporting | `confirmCash` still works — sets PAID, credits provider |
| Admin resolves then patient re-reports | Dispute re-raised (no protection — admin should close booking) |
