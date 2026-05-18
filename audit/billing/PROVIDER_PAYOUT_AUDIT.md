# Provider Payout Audit

This audit traces provider and partner payout flows, cites code, identifies risks (rounding, double-settlement, missing ledger entries, auditability), and gives actionable recommendations.

Files inspected (examples):
- Provider earnings service: `backend/src/services/providerEarningsService.js`
- Provider wallet endpoints: `backend/src/controllers/walletController.js`
- Booking completion wallet credit: `backend/src/controllers/bookingController.js` (credit on completion)
- Partner (lab) payouts & settlements: `backend/src/controllers/adminLabController.js`, `backend/src/models/PartnerWallet.js`, `backend/src/models/PartnerTransaction.js`, `backend/src/models/PartnerSettlement.js`
- Payment and lab verification: `backend/src/controllers/paymentController.js` (lab verify credits partner)

1) Provider (home services) payout flow

- Earning accumulation:
  - When a `Booking` is completed, provider earnings are credited to provider `Wallet` and a `Transaction` (CREDIT) is created. See booking completion flow: `backend/src/controllers/bookingController.js` where `Wallet.findOne`, `Wallet.create`, `wallet.balance += providerCut`, `wallet.save()` and `Transaction.create(...)` occur.
  - `providerEarningsService.getProviderEarningsSnapshot` aggregates `Booking` records with `status: 'completed'` to compute totals and reads `Wallet.balance` for payout snapshot (`backend/src/services/providerEarningsService.js`).

- Provider payout request (provider-initiated):
  - Endpoint: `POST /api/wallet/payout` -> `walletController.requestPayout` (`backend/src/controllers/walletController.js`).
  - Preconditions: user role `provider`, amount >= `MIN_PAYOUT_THRESHOLD` (1000), wallet balance sufficient, provider must have at least one completed booking.
  - Execution: `wallet.balance -= amount; await wallet.save(); Transaction.create({ type: 'DEBIT', amount, description })`; calls `updateProviderEarnings` and emails admin to process manual payout.

- Observations & risks:
  - Non-atomic read-modify-write: `wallet = await Wallet.findOne(...)`, `wallet.balance -= amount`, `wallet.save()` is vulnerable to race conditions (concurrent payout requests) and lost updates. Use `findOneAndUpdate` with `$inc: { balance: -amount }` and conditional check (balance >= amount) for atomicity.
  - Ledger mismatch risk: `wallet.balance` updated and `Transaction` created in two steps. If `wallet.save()` succeeds but `Transaction.create()` fails, balance will not have an audit trail. Conversely, if `Transaction.create()` succeeds but a crash prevents wallet save, the ledger and balance diverge.
  - No idempotency keys: repeated requests (double-clicks, network retries) can cause duplicated debit unless UI/backend rate-limits; add idempotency tokens per payout request.
  - Audit trail: `Transaction` is created with description but lacks fields like `requestedBy`, `processedBy`, `status` (pending/processed/failed), or external payout reference for reconciliation.

2) Admin / Partner (lab) payout flow

- Lab partner earnings accumulation and settlement:
  - When lab payment is verified and the order is `completed` or `report_uploaded`, `paymentController.verifyLabPayment` credits `PartnerWallet` using `findOneAndUpdate({ partner }, { $inc: { balance: netAmount, totalEarned: netAmount } }, { upsert: true })` and creates a `PartnerTransaction` (type: 'credit'). This is atomic for wallet increment via `$inc` and duplicate-guarded by `findOne({ order, type: 'credit' })`.
  - Admin triggers settlement: `adminLabController.processSettlement` finds `PartnerWallet`, checks `wallet.balance >= amount`, does `wallet.balance -= amount; await wallet.save(); PartnerSettlement.create(...); PartnerTransaction.create({ type: 'debit', ... })`.

- Observations & risks:
  - Lab partner credit path uses atomic `$inc` and an existence check to avoid double credits — good practice.
  - Admin payout path uses non-atomic wallet mutation (`wallet.balance -= amount; await wallet.save()`) before creating settlement and transaction — same issues as provider payout (race and ledger inconsistency). Replace with `findOneAndUpdate` with `$inc` and return the updated document or use a transaction.
  - `PartnerSettlement` records `payoutReference` but `PartnerTransaction` `payoutDetails` is optional; there is no enforced linkage or atomic creation with settlement.
  - `LabReconciliation` model exists (`backend/src/models/LabReconciliation.js`) with a unique index per partner+date, which helps reconcile daily totals — good.

3) Rounding, floating point, and currency unit issues

- Rounding inconsistencies:
  - `pricingService.calculateBookingPrice` uses `Math.round` for platformFee and providerEarning in multiple places (e.g., `platformFee = Math.round(totalAmount * rate)`), and `providerEarning = Math.round(totalAmount * 0.8)` for fallbacks.
  - `providerEarningsService` uses `Math.round` fallback when `platformFee` is missing. `bookingController` also uses `Math.round` for splitting finalPrice into platformFee/providerEarning.

- Currency unit inconsistency:
  - `Payment` model comment says "Amount in paise/cents" but `paymentController.createOrder` stores `amount: booking.totalAmount` (INR). Razorpay order creation correctly uses paise conversion (`Math.round(payableAmount * 100)`), but the DB `Payment.amount` being in INR is ambiguous and likely inconsistent with other expected paise-based records.

- Risks:
  - Using floating point numbers for money can create rounding errors; the code inconsistently mixes Math.round with raw multiplication. Prefer storing integers in smallest currency unit (paise) consistently across models and calculations.

4) Double-settlement, duplicate payouts, and missing protections

- Duplicate partner credit is guarded in `verifyLabPayment` by `existingTx = await PartnerTransaction.findOne({ order: labOrder._id, type: 'credit' })` — good.
- Provider wallet credits after booking completion have no duplicate guard; repeated calls to booking completion endpoint or retries may credit provider multiple times. `booking.completedAt` and `systemFlags` exist but no `Transaction` uniqueness check by booking id is enforced for provider transactions (though `Transaction.referenceId` references Booking, duplication could be detected by querying existing transaction with that reference, but code doesn't check).
- Payout requests (`/api/wallet/payout`) are processed immediately by deducting wallet and creating Transaction; no 'pending' state tracked and no admin confirmation required before balance reduction — this may be intentional but increases risk if admin cannot process payout.

5) Missing ledger and audit features

- No double-entry accounting model: currently single-sided wallet balances + Transaction log. Recommend implementing a dedicated payout ledger and double-entry records (debit platform liability, credit provider asset) for regulatory audit.
- Transaction model `referenceId` is polymorphic but schema currently `ref: 'Booking'` which is not generic; use `referenceType` + `referenceId` or a proper polymorphic pattern.
- `Transaction` lacks `status`, `externalReference`, `processedBy`, `idempotencyKey` fields that are important for audit and reconciliation.

6) Recommendations (actionable)

- Normalize currency units: store all monetary values in smallest currency unit (paise) as integers. Update `Payment.amount`, `Transaction.amount`, `Wallet.balance`, `PartnerWallet` fields accordingly.
- Use atomic DB operations for wallet mutations: prefer `findOneAndUpdate({ _id, balance: { $gte: amount } }, { $inc: { balance: -amount } }, { new: true })` to atomically deduct and check balance.
- Wrap multi-step money changes in MongoDB transactions (requires replica set) when multiple documents are mutated (wallet + transaction + settlement), or ensure idempotency and compensation logic.
- Add idempotency keys to all external-facing money endpoints (`/payment/create-order`, `/payment/verify`, `/wallet/payout`) and persist the key with the created transaction to prevent duplicates.
- Enforce uniqueness for `Transaction` per business reference where appropriate (e.g., provider credit for Booking should include a unique index on `(wallet, referenceId, type)` to avoid duplicate credits).
- Add `status` and `externalReference` fields to `Transaction` and `PartnerTransaction`, and link `PartnerSettlement` and `PartnerTransaction` atomically (or via transaction) to maintain audit trails.
- Move provider payout processing to a workflow: user requests payout -> create `PayoutRequest` (status: pending) -> admin/process worker picks and executes -> `Payout` record created with external reference and `Transaction`/`Wallet` updated atomically.
- Implement double-entry ledger for regulatory compliance: record both platform liability decrease and provider asset decrease at payout time.
- Add more unit tests around rounding and currency conversions to detect drift.

7) Quick fixes (short-term)

- Change provider payout and admin partner payout to use `findOneAndUpdate` with `$inc` and conditional balance check.
- Add a duplicate-transaction check (`Transaction.findOne({ wallet, referenceId, type })`) before creating credits for provider on booking completion.
- Normalize `Payment.amount` unit and add a DB migration note.

Files referenced (examples):
- `backend/src/controllers/bookingController.js` (booking completion wallet credit)
- `backend/src/controllers/paymentController.js` (payment verification & lab credit)
- `backend/src/controllers/adminLabController.js` (partner settlement)
- `backend/src/controllers/walletController.js` (provider payout request)
- `backend/src/services/providerEarningsService.js` (earnings snapshot)
- `backend/src/models/PartnerWallet.js`, `PartnerTransaction.js`, `PartnerSettlement.js`, `Wallet.js`, `Transaction.js`, `Payment.js`.

Conclusion
- Lab partner flows use safer atomic increments and duplicate checks; provider wallet and admin payout flows require immediate hardening (atomic updates, idempotency, ledger entries). Currency unit normalization and a stronger audit ledger are critical for production readiness.
