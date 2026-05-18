# PROVIDER PAYOUT PROTECTION AUDIT
**Date:** 2026-05-11  
**Phase:** 1 Post-Implementation

---

## Credit Path Analysis (Post-Fix)

### Path 1: Online/Razorpay (paymentController.verifyPayment)
- Triggers: Razorpay webhook or frontend verify callback
- Books to `PAID` status immediately (no COD hold involved)
- Idempotency check: `{ referenceId, referenceType: 'Booking', type: 'CREDIT' }` ✅
- Status: ✅ SAFE

### Path 2: COD — markCashCollectedBooking (admin/provider)
- **BEFORE:** Credited immediately at `PAID` → UNSAFE ❌
- **AFTER:** Sets `COLLECTED` + `PENDING_CONFIRMATION`, NO credit → SAFE ✅
- Idempotency: Returns early if already `COLLECTED` or `PAID` ✅

### Path 3: COD — confirmCash (patient)
- NEW: Patient confirms → atomic session → `PAID` + wallet credit
- Idempotency: `{ referenceId, referenceType: 'Booking', type: 'CREDIT' }` dedup ✅
- Returns early if already `patientConfirmed=true && paymentStatus=PAID` ✅
- Status: ✅ SAFE

### Path 4: creditProviderIfNeeded (booking completion)
- **BEFORE:** Triggered if `COMPLETED && (PAID || collectedAt set)` → could double-credit ❌
- **AFTER:** Triggered ONLY if `status=PAID || paymentStatus=PAID` ✅
- Idempotency: `{ referenceId, referenceType: 'Booking', type: 'CREDIT' }` ✅
- Status: ✅ SAFE

### Path 5: markPaid (admin/provider/patient)
- Existing path: sets `paymentStatus=PAID`, calls `creditProviderIfNeeded()`
- creditProviderIfNeeded now only fires on PAID status ✅
- Idempotency inherited from creditProviderIfNeeded ✅
- Status: ✅ SAFE

---

## Unified Idempotency Check

All 5 credit paths now use the **same idempotency query**:
```js
Transaction.findOne({
  referenceId: booking._id,
  referenceType: 'Booking',
  type: 'CREDIT',
})
```
This means any path that has already credited will block all other paths. **Double credit is impossible.**

---

## Duplicate Scenarios Verified

| Scenario | Result |
|---|---|
| Provider marks collected twice | 2nd call returns early (status already PENDING_CONFIRMATION) |
| Patient confirms twice | 2nd call returns early (patientConfirmed=true && PAID check) |
| Webhook fires after patient confirms | `existingTx` found → skipped |
| Admin calls `markPaid` after patient confirms | `creditProviderIfNeeded` finds existing tx → skipped |
| Race condition on `confirmCash` (two concurrent requests) | Atomic session + dedup → only one credit |

---

## Remaining Risk

| Risk | Mitigation |
|---|---|
| Admin calls `markPaid` BEFORE patient confirms on COD booking | `creditProviderIfNeeded` will credit — this is admin override, intentional |
| Provider `collectCash` (via bookingController) vs `markCashCollectedBooking` (via paymentController) both usable | Both now set `COLLECTED`, neither credits — safe |
| Patient never confirms (booking stuck in COLLECTED) | Admin can force `markPaid` or use stuck booking detection |
