# DATA CONSISTENCY & FAILURE RECOVERY AUDIT — Carely Platform
**Audit Date:** 2026-05-11  
**Scope:** Reconciliation engine coverage, idempotency guarantees, automated recovery, webhook processing safety

---

## DATA CONSISTENCY CHECKS

### Reconciliation Engine (`reconciliationService.js`)

| Check | Description | Correct | Notes |
|---|---|---|---|
| Check 1 | PAID bookings without a SUCCESS Payment record | ✅ | Uses BOOKING_STATUS constant |
| Check 2 | SUCCESS payments without a PAID booking (desync) | ✅ | Uses BOOKING_STATUS constant |
| Check 3 | PAID/COLLECTED completed bookings without wallet credit | ✅ | N+1 per booking — perf risk |
| Check 4 | Orphan payments (no booking, no intent after 24h) | ✅ | Stale window filter present |

### Issues Found

**CONSISTENCY-001: N+1 Query Pattern in Check 3**
```js
// For every completed+paid booking, executes a separate Transaction.findOne()
for (const b of completedBookings) {
  const tx = await Transaction.findOne({ referenceId: b._id, type: 'CREDIT' });
  if (!tx) issues.push({ type: 'MISSING_PROVIDER_CREDIT', ... });
}
```
At scale (1000+ completed bookings), this runs 1001 DB queries per reconciliation call. Should use an aggregation join or `$in` query.

**CONSISTENCY-002: Reconciliation Runs on Every Dashboard Load**
- `getDashboardSummary()` calls `reconciliationService.runReconciliationCheck()` on every page load
- This means Check 3 (N+1 queries) runs on every admin page visit
- Should be cached or moved to a scheduled job

**CONSISTENCY-003: No Duplicate Credit Detection**
- The reconciliation engine checks for MISSING credits but not DUPLICATE credits
- If `creditProviderIfNeeded()` is called twice due to the cross-path idempotency gap (PAYOUT-001 in payout audit), there will be two CREDIT transactions for the same booking
- No check detects this scenario

---

## IDEMPOTENCY GUARANTEES

### Payment Verification
| Guard | Implementation | Status |
|---|---|---|
| Signature verification | HMAC-SHA256 against raw body | ✅ |
| Payment already SUCCESS | Early return before DB ops | ✅ |
| Atomic session wrap | `mongoose.startSession()` | ✅ |
| Webhook replay dedup | `eventId` + `payloadHash` unique index | ✅ |

### Provider Wallet Credit
| Guard | Implementation | Status |
|---|---|---|
| verifyPayment path | `Transaction.findOne({ referenceId, description: /Booking payment/ })` | ⚠️ Fragile regex |
| markCashCollected path | `Transaction.findOne({ referenceId, referenceType: 'Booking' })` | ⚠️ Won't find Path 3 tx |
| creditProviderIfNeeded | `Transaction.findOne({ referenceId, type: 'CREDIT', description: /Earnings/ })` | ⚠️ Won't find Path 1 tx |

**Cross-path idempotency is NOT guaranteed** — detailed in PROVIDER_PAYOUT_AUDIT.md

### Referral Bonus
| Guard | Implementation | Status |
|---|---|---|
| Patient referral (lines 912-922) | `Transaction.findOne({ referenceId, description: /Referral Bonus/ })` | ✅ |
| Provider referral (lines 845-865) | **None originally** | 🔴 Fixed in this audit |

---

## FAILURE RECOVERY ENDPOINTS

### Available Recovery Tools

| Endpoint | Purpose | Auth | Status |
|---|---|---|---|
| `POST /api/payment/sync/:paymentId` | Re-fetches from Razorpay, marks PAID if captured | Patient | ✅ Works |
| `POST /api/admin/reconciliation/fix/:bookingId` | Syncs payment→booking status | Admin | ✅ Fixed (was broken) |
| `POST /api/admin/payouts/:id/fail` | Releases reserved balance, marks FAILED | Admin | ✅ |
| `POST /api/admin/payouts/:id/reject` | Marks payout rejected | Admin | ✅ |
| `POST /api/admin/payouts/:id/process` | Processes payout with external reference | Admin | ✅ |

### Recovery Gap

❌ **No admin endpoint to trigger `creditProviderIfNeeded()` manually** — if provider credit was missed due to DB timeout, admin must manually credit via DB or trigger a re-completion attempt.

❌ **No batch reconciliation fix** — admin can fix one booking at a time via `/fix/:bookingId` but cannot run a batch sync.

---

## WEBHOOK PROCESSING SAFETY

### Signature Verification
```js
const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
if (!signature || expected !== signature) {
  // Logs to WebhookLog.processed = false
  return res.status(400).json({ ... 'Invalid signature' });
}
```
✅ Signature verification is correct and uses raw body (not parsed JSON).

### Deduplication
```js
const existing = await WebhookLog.findOne({ $or: [{ eventId }, { payloadHash }] });
if (existing && existing.processed) {
  return res.json({ success: true, message: 'Already processed' });
}
```
✅ Dual dedup: by Razorpay event ID AND payload hash.

### Transaction Safety
```js
const session = await mongoose.startSession();
session.startTransaction();
// ... all DB operations ...
await session.commitTransaction();
```
✅ All webhook processing wrapped in atomic MongoDB transaction.

### Issues
- ⚠️ Amount mismatch (line 62-64): When amount doesn't match, webhook logs a billing issue but returns 200 — webhook is marked processed. The payment is NOT marked SUCCESS. This is correct behavior but the billing logger call only logs the mismatch without alerting admin.
- ❌ `payment.captured` webhook handler does NOT trigger `creditProviderIfNeeded()` — only marks Payment SUCCESS. If the booking status is already COMPLETED but provider hasn't been credited, this webhook won't fix it.

---

## WALLET RECONCILIATION CHECKS (Missing)

### Not Detected by Current Engine
1. **Duplicate credits for same booking** — multiple CREDIT transactions with same `referenceId`
2. **Negative wallet balance** — wallet.balance < 0 (shouldn't happen but possible if manual adjustments made)
3. **Wallet balance vs transaction sum mismatch** — wallet.balance ≠ sum of all CREDIT - DEBIT transactions

### Recommended Additional Checks
```js
// Duplicate credits
const dupCreditPipeline = [
  { $match: { type: 'CREDIT' } },
  { $group: { _id: { referenceId: '$referenceId', wallet: '$wallet' }, count: { $sum: 1 } } },
  { $match: { count: { $gt: 1 } } }
];

// Negative wallets
const negativeWallets = await Wallet.find({ balance: { $lt: 0 } });

// Balance integrity
// For each wallet: assert balance = SUM(CREDIT) - SUM(DEBIT)
```

---

## SEVERITY SUMMARY

| Issue | Description | Severity |
|---|---|---|
| CONSIST-001 | N+1 query in reconciliation check #3 | MEDIUM |
| CONSIST-002 | Full reconciliation runs on every dashboard load | MEDIUM |
| CONSIST-003 | No duplicate wallet credit detection | HIGH |
| CONSIST-004 | Cross-path idempotency gap between 3 credit paths | HIGH |
| RECOVERY-001 | No manual provider credit recovery endpoint | MEDIUM |
| RECOVERY-002 | No batch reconciliation fix tool | LOW |
| WEBHOOK-001 | Amount mismatch not alerted, only logged | LOW |
| WEBHOOK-002 | payment.captured webhook doesn't trigger provider credit | MEDIUM |

---

## RECOMMENDATIONS

### Short Term
1. **Add duplicate credit check to reconciliation engine**
2. **Standardize all three provider credit paths to use same `referenceType: 'Booking'` for dedup**
3. **Add `POST /api/admin/providers/:id/manual-credit` for recovery**

### Medium Term
4. **Cache reconciliation results** — run on schedule (cron every 15 min) not on page load
5. **Add negative wallet balance check to reconciliation**
6. **Add wallet balance integrity check** (balance = sum of all transactions)

### Long Term
7. **Move to single credit path** — all provider credits go through one function with one idempotency check
