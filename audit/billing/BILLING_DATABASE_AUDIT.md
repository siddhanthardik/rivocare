# Billing Database Audit — Initial Findings

This document lists billing-related models/entities found in the codebase and initial notes.

Entities discovered (files cited):

- Booking: [backend/src/models/Booking.js](backend/src/models/Booking.js#L1-L200)
  - Purpose: Store patient bookings for services (home visits, nursing, physio).
  - Key monetary fields: `totalAmount`, `finalAmount`, `planPrice`, `platformFee`, `providerEarning`, `labPayout`, `estimatedPrice`.
  - Relationships: refs to `User` (patient), `Provider`, `Service`, `Offering`/`SubscriptionPlan`.
  - Missing indexes: no compound index on `patient + status + createdAt` (useful for queries), `orderId` is unique sparse — good.
  - Risky nullable fields: `finalAmount`, `providerEarning`, `platformFee` can be null leading to ambiguous calculations.
  - Notes: `orderId` generated server-side; ensure uniqueness collisions handled.

- Payment: [backend/src/models/Payment.js](backend/src/models/Payment.js#L1-L120)
  - Purpose: Store payment intents & gateway responses (Razorpay integration).
  - Key fields: `amount`, `currency`, `status`, `razorpayOrderId`, `razorpayPaymentId`, `razorpaySignature`.
  - Relationships: refs to `User`, `Booking`, `LabOrder`.
  - Inconsistency: Comment says amount in paise but controller stores INR. This is high-risk for mis-accounting.
  - Missing indexes: `booking` and `labOrder` are not indexed; queries search by `razorpayOrderId` (unique) so OK.

- Wallet: [backend/src/models/Wallet.js](backend/src/models/Wallet.js#L1-L200)
  - Purpose: Per-user balance for providers/patients.
  - Key fields: `user`, `balance`.
  - Relationship: One-to-one with `User` (unique index enforced).
  - Risk: No ledger by default — `Transaction` used for history; ensure atomic updates using DB transactions.

- Transaction: [backend/src/models/Transaction.js](backend/src/models/Transaction.js#L1-L200)
  - Purpose: Ledger entries for `Wallet` changes.
  - Fields: `wallet`, `type` (CREDIT/DEBIT), `amount`, `description`, `referenceId` (refers to Booking by schema).
  - Risk: `referenceId` ref hardcoded to Booking; some transactions (payments, partner tx) reference other types — inconsistent polymorphic refs.

- PartnerWallet / PartnerTransaction / PartnerSettlement:
  - Files: [PartnerWallet.js](backend/src/models/PartnerWallet.js), [PartnerTransaction.js](backend/src/models/PartnerTransaction.js), [PartnerSettlement.js](backend/src/models/PartnerSettlement.js)
  - Purpose: Partner (lab) ledger, transactions, and settlements.
  - Observations: Proper settlement model exists; admin controller `processSettlement` handles payouts and partner transactions.

- LabOrder: [backend/src/models/LabOrder.js](backend/src/models/LabOrder.js#L1-L200)
  - Purpose: Lab-specific orders and payments.
  - Monetary fields: `totalAmount`, `platformFee`, `labPayout`, `paymentStatus`, `paymentMethod`, `paymentDetails`.
  - Relationship: partner -> Partner model, tests -> LabTest.

- LabReconciliation: [backend/src/models/LabReconciliation.js](backend/src/models/LabReconciliation.js#L1-L200)
  - Purpose: Daily per-lab snapshot for reconciliation and settlement.
  - Good: Unique index per partner+date present.

- Offerings / SubscriptionPlan / ServicePricing / PatientSubscription / PatientPackage
  - Files: [Offering.js](backend/src/models/Offering.js), [SubscriptionPlan.js](backend/src/models/SubscriptionPlan.js), [ServicePricing.js](backend/src/models/ServicePricing.js), [PatientSubscription.js](backend/src/models/PatientSubscription.js), [PatientPackage.js](backend/src/models/PatientPackage.js)
  - Observations: `PatientSubscription.plan` and `PatientPackage.plan` reference `Plan` which is inconsistent with `SubscriptionPlan`/`Offering` naming — likely a bug or legacy naming.

Common issues and risks found so far:

- Inconsistent naming and refs (e.g., `Plan` vs `SubscriptionPlan`, `referenceId` polymorphism) — increases risk of wrong joins and migrations.
- Currency unit inconsistency in `Payment.amount` (paise vs INR) and inconsistent use of `Math.round` across calculations — risk of rounding errors and double-counting.
- Sparse/absent indexes for frequently queried fields (`booking`, `labOrder`, `user` on Payment/Transaction) — potential performance issues.
- Lack of strong audit/ledger model for patient-facing invoices; `LabOrder` invoice is derived on-the-fly (no Invoice collection) — makes reconciling harder.

Next: Produce a detailed row-per-entity table with field-level notes and missing indexes, and run a code search for every place each entity is mutated (create/update/delete).
