# Entity Mutation Detailed Extracts

This file contains exact code excerpts (with file links) for create/update/delete operations on billing entities, and notes on atomicity, idempotency, and risks.

1) Booking creation (non-atomic ops after creation)
- Source: `backend/src/controllers/bookingController.js` (booking creation)
- Excerpt:

```js
booking = await Booking.create({
  orderId,
  patient: req.user._id,
  provider: providerId,
  service: serviceId,
  offering: plan._id,
  planName: plan.name,
  price: finalPrice,
  address: cleanAddress,
  pincode,
  scheduledAt: scheduledDate,
  durationHours: requestedDurationHours,
  notes: cleanNotes,
  totalAmount: finalPrice,
  finalAmount: finalPrice,
  finalPrice,
  planPrice: finalPrice,
  pricingSource: "PLAN",
  estimatedPrice: finalPrice,
  platformFee: Math.round(finalPrice * 0.2),
  providerEarning: Math.round(finalPrice * 0.8),
  paymentStatus: "PENDING",
  status: "pending",
  expiresAt,
});
```

- Notes & risks:
  - Booking creation is a single DB insert (atomic) but many important side-effects occur after: notifications, user profile updates, socket emits.
  - Pricing fields (`platformFee`, `providerEarning`, `finalPrice`) are computed server-side — good — but there is no DB transaction wrapping follow-up actions (e.g., if notification code crashes, booking still exists; acceptable, but OK).

2) Booking completion -> wallet credit, transactions, provider earnings update
- Source: `backend/src/controllers/bookingController.js` (completion path)
- Excerpt (wallet credit + transaction):

```js
let wallet = await Wallet.findOne({ user: provider.user });
if (!wallet) {
  wallet = await Wallet.create({ user: provider.user, balance: 0 });
}

const providerCut = booking.providerEarning || Math.round(booking.totalAmount * 0.8);

wallet.balance += providerCut;
await wallet.save();

await Transaction.create({
  wallet: wallet._id,
  type: 'CREDIT',
  amount: providerCut,
  description: `Earnings for Service (Booking: ${booking._id})`,
  referenceId: booking._id,
});

await updateProviderEarnings(booking.provider);
```

- Notes & risks:
  - Multi-step: ensure wallet creation, balance increment, transaction creation, and provider snapshot update remain consistent.
  - No DB transaction is used; if process crashes after wallet.save() but before Transaction.create(), ledger will be inconsistent (balance without transaction). This is a critical accounting risk.

3) Referral bonus flows (provider & patient referrer)
- Source: `backend/src/controllers/bookingController.js` (completion)
- Excerpt:

```js
let referrerWallet = await Wallet.findOne({ user: referrer.user });
if (!referrerWallet) referrerWallet = await Wallet.create({ user: referrer.user, balance: 0 });

referrerWallet.balance += 100;
await referrerWallet.save();

await Transaction.create({
  wallet: referrerWallet._id,
  type: 'CREDIT',
  amount: 100,
  description: `Referral First Booking Bonus (Provider: ${req.user.name})`,
  referenceId: booking._id,
});
```

- Notes:
  - Same multi-step risk: balance change and transaction not atomic.
  - Duplicate protection: none visible; if network retries occur, duplicate bonuses may be issued unless external safeguards exist.

4) Payment intent creation (Razorpay) and Payment record
- Source: `backend/src/controllers/paymentController.js` (`createOrder`)
- Excerpt:

```js
const order = await razorpay.orders.create(options);

const payment = await Payment.create({
  user: req.user._id,
  booking: booking._id,
  amount: booking.totalAmount, // Store in actual INR internally
  currency: 'INR',
  razorpayOrderId: order.id,
});
```

- Notes & risks:
  - Comment mismatch: `Payment.amount` comment in model said "Amount in paise/cents", but here code stores INR. This is critical and must be corrected and normalized across codebase and DB.
  - Payment creation is fine but not marked idempotent: repeated createOrder requests could create multiple Payment records for same booking unless frontend/app prevents it.

5) Payment verification -> mark Payment SUCCESS and Booking PAID
- Source: `backend/src/controllers/paymentController.js` (`verifyPayment`)
- Excerpt:

```js
payment.razorpayPaymentId = razorpay_payment_id;
payment.razorpaySignature = razorpay_signature;
payment.status = 'SUCCESS';
await payment.save();

const booking = await Booking.findByIdAndUpdate(payment.booking, { paymentStatus: 'PAID' }, { new: true });
```

- Notes & risks:
  - Two-step state change: payment.save() then booking update; no DB transaction. If booking update fails, payment stays SUCCESS but booking may not reflect payment.
  - No idempotency for duplicate webhook or retry calls; signature verification helps but repeated verifyPayment calls for same razorpay ids will set same Payment but booking update uses booking id — potential duplicates need guarding.

6) Pay with wallet flow
- Source: `backend/src/controllers/paymentController.js` (`payWithWallet`)
- Excerpt:

```js
wallet.balance -= payableAmount;
await wallet.save();

await Transaction.create({
  wallet: wallet._id,
  type: 'DEBIT',
  amount: payableAmount,
  description: `Payment for Booking (Booking ID: ${booking._id})`,
  referenceId: booking._id,
});

booking.paymentStatus = 'PAID';
await booking.save();
```

- Notes & risks:
  - Deduct -> record transaction -> mark booking paid: same multi-step inconsistency; a crash mid-way can cause balance mismatch versus ledger.
  - No pre-check to ensure `Transaction` isn't already created (idempotency) — duplicates possible.

7) Lab order creation and lab payment flows
- Source: `backend/src/controllers/labController.js` (`bookTest`) and `paymentController.createLabPayment`/`verifyLabPayment`.
- Excerpt (lab order create):

```js
const order = await LabOrder.create({
  orderId: `LAB-${Date.now()}`,
  patient: req.user.id,
  partner: partnerId,
  tests: testIds,
  totalAmount: orderTotal,
  platformFee,
  labPayout,
  commissionUsed,
  commissionSource,
  scheduledDate: requestedDate,
  ...
});
```

- Excerpt (lab verify -> partner wallet credit):

```js
const existingTx = await PartnerTransaction.findOne({ order: labOrder._id, type: 'credit' });
if (!existingTx) {
  const wallet = await PartnerWallet.findOneAndUpdate(
    { partner: labOrder.partner },
    { $inc: { balance: netAmount, totalEarned: netAmount } },
    { new: true, upsert: true }
  );

  await PartnerTransaction.create({ partner: labOrder.partner, wallet: wallet._id, order: labOrder._id, type: 'credit', amount: labOrder.totalAmount, platformCommission: platformFee, netAmount });
}
```

- Notes & risks:
  - This flow uses `findOne` to guard duplicates — good. `findOneAndUpdate` with `$inc` is atomic for partner wallet crediting which reduces race risk.
  - Partner flows show better atomic operations compared to user wallet flows.

8) Partner payout processing (admin)
- Source: `backend/src/controllers/adminLabController.js` (`processSettlement`)
- Excerpt:

```js
const wallet = await PartnerWallet.findOne({ partner: partnerId });
if (!wallet || wallet.balance < amount) return error;

wallet.balance -= amount;
await wallet.save();

const settlement = await PartnerSettlement.create({ partner: partnerId, wallet: wallet._id, totalAmount: amount, netPayout: amount, status: 'completed', payoutReference, payoutMethod });

await PartnerTransaction.create({ partner: partnerId, wallet: wallet._id, type: 'debit', amount: amount, netAmount: amount, description: `Bank Payout (Ref: ${payoutReference})` });
```

- Notes & risks:
  - Deduct -> create settlement -> create transaction: not wrapped in a DB transaction. If settlement create fails after deduct, balance is already reduced.
  - Partner flows show atomic `findOneAndUpdate` elsewhere, but here plain read-modify-write used; consider `findOneAndUpdate` with `$inc: { balance: -amount }` and check preconditions atomically.

9) Provider earnings snapshot and wallet creation
- Source: `backend/src/services/providerEarningsService.js`
- Excerpt:

```js
let wallet = await Wallet.findOne({ user: provider.user });
if (!wallet) {
  wallet = await Wallet.create({ user: provider.user, balance: 0 });
}
```

- Notes:
  - Wallet creation on-demand is acceptable, but subsequent writes elsewhere must assume existence and be resilient to race conditions.

Summary of atomicity/idempotency issues found so far
- User wallet flows (credit/debit) are multi-step without database transactions or atomic primitives: high risk of ledger vs balance drift.
- Payment verification updates Payment then Booking separately; lack of transactional updates risks inconsistent state.
- Lab partner flows are safer where `findOneAndUpdate` + `$inc` are used and duplicate PartnerTransaction checks exist.
- Inconsistent use of units (INR vs paise) in `Payment.amount` must be fixed globally.

Recommendations (next actionable items)
- Convert user wallet credit/debit flows to either:
  - MongoDB multi-document transactions (if using replica set) OR
  - Atomic `findOneAndUpdate` with `$inc` and create an idempotent Transaction record using an operation idempotency key.
- Ensure `Payment.amount` is normalized to a single unit across DB and code (prefer integer smallest currency unit, e.g., paise).
- Add unique constraints or idempotency keys for referral bonuses and wallet transactions to prevent duplicates.
- Wrap payment verification and booking state change into a safe, idempotent operation; consider using a payment webhook queue to process once.
