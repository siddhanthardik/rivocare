# PROVIDER PAYOUT AUDIT — Carely Platform
**Audit Date:** 2026-05-11  
**Scope:** Provider wallet credit correctness, idempotency, split accuracy, duplicate prevention, referral interactions

---

## SUMMARY

| Check | Result |
|---|---|
| 80/20 split correct | ✅ Yes |
| Single-credit enforcement (idempotency) | ⚠️ PARTIAL — fragile regex match |
| Duplicate payout impossible | ⚠️ PARTIAL — regex can be defeated |
| Referral reward safe | 🔴 NO — non-atomic race condition |
| Webhook replay safe | ✅ Yes |
| Admin can see payout state | ⚠️ PARTIAL — count only, no drill-down |

---

## PAYOUT ARCHITECTURE

### Two Separate Payout Systems

#### System A — Home Care Providers
- **Wallet:** `Wallet` model (linked to `User._id`)
- **Transaction:** `Transaction` model
- **Trigger:** `creditProviderIfNeeded()` in `bookingController.js`
- **Admin:** `GET /api/admin/providers/:id/details` shows wallet + transactions per provider

#### System B — Lab Partners
- **Wallet:** `PartnerWallet` model (linked to `Partner._id`)
- **Transaction:** `PartnerTransaction` model
- **Payout Request:** `PayoutRequest` model → refs `Partner`, `PartnerWallet`, `PartnerTransaction`
- **Admin:** `GET /api/admin/payouts` and `/api/admin/reconciliation/payouts`

**⚠️ IMPORTANT:** The `PayoutRequest` model and the entire `payoutController.js` is designed for **lab partner payouts only**. There is no `PayoutRequest` mechanism for home-care providers. Home-care provider payouts happen immediately when booking completes — there is no approval workflow.

---

## HOME-CARE PROVIDER PAYOUT ANALYSIS

### Credit Trigger Points (Three separate paths)

#### Path 1: verifyPayment (online Razorpay — prepaid intent flow)
```js
// paymentController.js line 233
const existingTx = await Transaction.findOne({ 
  referenceId: booking._id, 
  referenceType: 'Booking', 
  description: /Booking payment/i  // ← regex
});
if (!existingTx) {
  await Transaction.create([{ wallet, type: 'CREDIT', amount: netAmount, 
    description: `Booking payment for Booking #${booking._id}`, ... }])
}
```

#### Path 2: markCashCollectedBooking (admin/provider marks cash collected)
```js
// paymentController.js line 796
const existingTx = await Transaction.findOne({ 
  referenceId: booking._id, 
  referenceType: 'Booking'  // ← no description filter, no type filter
});
if (!existingTx) {
  await Transaction.create([{ wallet, type: 'CREDIT', amount: netAmount, ... }])
}
```

#### Path 3: creditProviderIfNeeded (completion trigger)
```js
// bookingController.js line 343
const existingProviderTx = await Transaction.findOne({ 
  referenceId: booking._id, 
  type: 'CREDIT', 
  description: /Earnings for Service/i  // ← different regex
});
if (existingProviderTx) return;
```

### CRITICAL IDEMPOTENCY PROBLEM

Each credit path uses a **different description pattern** to check for existing transactions:

| Path | Description Written | Description Pattern Checked |
|---|---|---|
| verifyPayment | `"Booking payment for Booking #<id>"` | `/Booking payment/i` |
| markCashCollected | `"Cash collected for Booking #<id>"` | None (any transaction) |
| creditProviderIfNeeded | `"Earnings for Service (Booking: <id>)"` | `/Earnings for Service/i` |

**Result:** These three paths do NOT see each other's transactions.

**Scenario (DOUBLE CREDIT RISK):**
1. Online payment verified → `verifyPayment` credits provider via Path 1
2. Admin/provider also calls `markCashCollectedBooking` → Path 2 checks `referenceId: booking._id, referenceType: 'Booking'` → Path 1 wrote a transaction with `referenceType: 'Booking'` → EXISTING TX FOUND → ✅ no duplicate (this case is safe)

**Safer Scenario:**
1. `creditProviderIfNeeded()` (Path 3) is called at booking completion
2. Then cash collected → `markCashCollectedBooking` → checks `referenceId: booking._id, referenceType: 'Booking'` → Path 3 wrote `referenceType` is NOT set (undefined) → **existingTx NOT found → DOUBLE CREDIT**

**ISSUE: `creditProviderIfNeeded()` does NOT set `referenceType: 'Booking'`** — it creates a transaction without `referenceType`, only with `referenceId`. This means `markCashCollectedBooking()` query `{ referenceId: booking._id, referenceType: 'Booking' }` will NOT find it.

---

## 80/20 SPLIT VERIFICATION

### Split Calculation (all paths)
```js
// Booking creation (bookingController.js)
platformFee: Math.round(finalPrice * 0.2),
providerEarning: Math.round(finalPrice * 0.8),

// markCashCollectedBooking
const platformFee = booking.platformFee || Math.round(booking.totalAmount * 0.2 * 100) / 100;
const netAmount = (booking.totalAmount || 0) - platformFee;

// creditProviderIfNeeded
const providerCut = booking.providerEarning || Math.round((booking.totalAmount || 0) * 0.8);

// verifyPayment (prepaid intent)
const platformFee = booking.platformFee || Math.round(booking.totalAmount * 0.2 * 100) / 100;
const netAmount = booking.totalAmount - platformFee;
```

**⚠️ ROUNDING INCONSISTENCY:**
- `Math.round(price * 0.2)` vs `Math.round(price * 0.2 * 100) / 100` — these give different results for non-round amounts
- Example: price = ₹750 → `Math.round(750 * 0.2)` = 150, `Math.round(750 * 0.2 * 100) / 100` = 150.00 (same in this case but not always)
- For ₹333: `Math.round(333 * 0.2)` = 67, `333 * 0.2 * 100 / 100` = 66.6 → `Math.round(66.6)` = 67 (same here but edge cases exist)

**Recommendation:** Standardize to one rounding approach across all paths.

---

## REFERRAL BONUS RACE CONDITION

### Code (bookingController.js lines 851-865)
```js
// Stage 3: Referral First Booking Bonus (₹100) 
let referrerWallet = await Wallet.findOne({ user: referrer.user });
if (!referrerWallet) referrerWallet = await Wallet.create({ user: referrer.user, balance: 0 });

referrerWallet.balance += 100;  // ← NON-ATOMIC
await referrerWallet.save();     // ← RACE CONDITION

await Transaction.create({ ... amount: 100, referenceId: booking._id });
```

**Problem:** `referrerWallet.balance += 100` reads current balance, adds 100, then saves. If two concurrent requests hit this simultaneously (unlikely but possible), both read the same balance and both add 100, resulting in only one increment persisted.

**Fix Required:**
```js
// Use atomic $inc
await Wallet.findOneAndUpdate(
  { user: referrer.user },
  { $inc: { balance: 100 } },
  { upsert: true, new: true }
);
```

### Patient Referral Bonus (lines 906-921)
```js
await Wallet.findOneAndUpdate({ user: referrerUser._id }, { $inc: { balance: 100 } }, { upsert: true });
```
✅ This one correctly uses `$inc` — inconsistent with provider referral above.

---

## PAYOUT CONTROLLER ANALYSIS (Lab Partners Only)

### Flow
1. Provider requests payout → `PayoutRequest` created
2. Admin approves → `POST /api/admin/payouts/:id/approve` → reserves funds atomically in `PartnerWallet`
3. Admin processes → `POST /api/admin/payouts/:id/process` → deducts `reservedBalance`

### Idempotency
- `processPayout()` checks `payout.status !== 'PENDING' && !== 'PROCESSING'` → prevents re-processing ✅
- `approvePayout()` checks `payout.status !== 'PENDING'` → prevents re-approval ✅
- `failPayout()` restores `reservedBalance` ✅

### Issue
- `approvePayout()` increments `reservedBalance` AND `pendingPayouts` on `PartnerWallet`
- `processPayout()` only decrements `reservedBalance` — does NOT decrement `pendingPayouts`
- **`pendingPayouts` field will grow indefinitely and never be decremented**

---

## ADMIN PAYOUT VISIBILITY

### Home-Care Providers
- `GET /api/admin/providers/:id/details` → wallet + all transactions for one provider
- ❌ No aggregate view of all provider credits
- ❌ No admin list of pending or recent provider earnings
- ❌ Admin cannot filter providers by earnings or payout status

### Lab Partners
- `GET /api/admin/payouts` → lists `PayoutRequest` records ✅
- `GET /api/admin/reconciliation/payouts` → same data via reconciliation route ✅
- `Reconciliation.jsx` → "Open Payouts" button → navigates to unimplemented route ❌

---

## SEVERITY SUMMARY

| Issue | Description | Severity |
|---|---|---|
| PAYOUT-001 | creditProviderIfNeeded missing referenceType — dedup across paths may fail | HIGH |
| PAYOUT-002 | Provider referral bonus non-atomic (balance += not $inc) | HIGH |
| PAYOUT-003 | pendingPayouts field never decremented on payout completion | MEDIUM |
| PAYOUT-004 | No home-care provider payout aggregation for admin | MEDIUM |
| PAYOUT-005 | Rounding inconsistency across credit paths | LOW |
| PAYOUT-006 | "Open Payouts" button in Reconciliation.jsx navigates to 404 | LOW |

---

## RECOMMENDATIONS

1. **Add `referenceType: 'Booking'` to `creditProviderIfNeeded()` transaction creation** — makes dedup consistent across all 3 credit paths
2. **Fix provider referral bonus to use `$inc` not `+= / save()`**
3. **Fix `processPayout()` to also decrement `pendingPayouts`**
4. **Add aggregate admin view: total earned, pending payout, last paid for home-care providers**
