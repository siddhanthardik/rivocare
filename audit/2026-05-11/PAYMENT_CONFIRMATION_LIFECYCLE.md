# PAYMENT CONFIRMATION LIFECYCLE
**Date:** 2026-05-11  
**Documents:** Full COD payment confirmation flow after Phase 1 implementation

---

## Canonical Booking Status Machine (Post Phase 1)

```
┌───────────────────────────────────────────────────────────────┐
│               BOOKING LIFECYCLE (COD + Online)                │
└───────────────────────────────────────────────────────────────┘

REQUESTED ──► CONFIRMED ──► IN_PROGRESS ──► COMPLETED
    │              │               │             │
    └──► CANCELLED └──► CANCELLED  └──► CANCELLED│
                                                 │
                   ┌──── Online/Razorpay ─────────┤
                   ▼                              │
                 PAID ◄── COD confirm ──── COLLECTED ◄── (from COMPLETED, COD)
                              ▲                  │
                              │                  └──► paymentStatus: DISPUTED
                              └── Admin override         (if patient reports issue)
```

---

## Payment Status Values

| paymentStatus | Meaning | Wallet Credited? |
|---|---|---|
| `PENDING` | Not yet paid | No |
| `PENDING_CONFIRMATION` | COD: cash marked, awaiting patient | **No** |
| `COLLECTED` | Legacy: cash collected (same as PENDING_CONFIRMATION) | No |
| `DISPUTED` | Patient reported a cash dispute | **No** |
| `PAID` | Payment confirmed (online or patient-confirmed COD) | **Yes** |
| `REFUNDED` | Payment reversed | N/A |
| `FAILED` | Razorpay payment failed | No |

---

## COD Full Flow (Step by Step)

### Step 1 — Booking Created
```
booking.status = REQUESTED
booking.paymentStatus = PENDING
booking.paymentMethod = CASH
```

### Step 2 — Provider Confirms
```
booking.status = CONFIRMED
```

### Step 3 — Service Starts
```
booking.status = IN_PROGRESS
```

### Step 4 — Service Completes
```
booking.status = COMPLETED
booking.paymentStatus = PENDING (unchanged)
```

### Step 5 — Provider Collects Cash
**Endpoint:** `POST /api/payment/mark-cash-collected/:id`
```
booking.status = COLLECTED                  ← NEW
booking.paymentStatus = PENDING_CONFIRMATION ← NEW
booking.collectedAmount = ₹500
booking.collectedBy = provider._id
booking.collectedAt = new Date()
booking.patientConfirmed = null
Wallet: NOT CREDITED                        ← CRITICAL CHANGE
```

### Step 6a — Patient Confirms
**Endpoint:** `POST /api/payments/confirm-cash/:id`
```
[Atomic transaction]
booking.status = PAID                       ← transitions to final
booking.paymentStatus = PAID
booking.patientConfirmed = true
booking.patientConfirmedAt = now()

Wallet.findOneAndUpdate({$inc: {balance: netAmount}})
Transaction.create({
  type: 'CREDIT',
  amount: netAmount,               ← (totalAmount - platformFee)
  referenceType: 'Booking',
  referenceId: booking._id,
  description: 'COD Payment Confirmed — Booking #...'
})
[Idempotency: skip if existingTx found]
```

### Step 6b — Patient Disputes
**Endpoint:** `POST /api/payments/report-cash-issue/:id`
```
booking.paymentStatus = DISPUTED
booking.disputeRaised = true
booking.status = COLLECTED (unchanged)
Wallet: NOT CREDITED
Admin notifications sent with full context
```

---

## Online/Razorpay Flow (Unchanged)

```
CONFIRMED → patient pays online
  → POST /api/payment/verify (Razorpay HMAC verify)
  → booking.paymentStatus = PAID
  → booking.status → auto to COMPLETED on service finish
  → Provider credited via creditProviderIfNeeded or webhook
```

Online flow is NOT affected by Phase 1. `COMPLETED → PAID` transition is preserved for online.

---

## Provider Credit Calculation

```
platformFee = booking.platformFee || Math.round(booking.totalAmount * 0.2)
netAmount   = booking.totalAmount - platformFee

Example: ₹500 total
  platformFee = ₹100 (20%)
  netAmount   = ₹400 (80%)
  Provider receives: ₹400
```

All credit paths use this same calculation.

---

## Status Color Mapping (UI)

| Status | Color | Description |
|---|---|---|
| `REQUESTED` / `PENDING` | Amber | Awaiting action |
| `CONFIRMED` | Blue | Provider accepted |
| `IN_PROGRESS` | Indigo | Service underway |
| `COMPLETED` | Emerald | Service done |
| `COLLECTED` | Amber | Cash claimed, unconfirmed |
| `PENDING_CONFIRMATION` | Amber | Same as COLLECTED in UI |
| `DISPUTED` | Red | Patient has raised issue |
| `PAID` | Emerald | Final — payment received |
| `CANCELLED` | Slate | Terminal — cancelled |
