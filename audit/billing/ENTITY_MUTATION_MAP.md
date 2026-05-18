# Billing Entity Mutation Map

This document lists where billing-related entities are created, updated, or deleted in the codebase (initial scan).

Booking
- Created: [backend/src/controllers/bookingController.js](backend/src/controllers/bookingController.js#L160-L176) (`Booking.create` in `createBooking`).
- Updates / status changes: `updateBookingStatus` handler in [backend/src/controllers/bookingController.js](backend/src/controllers/bookingController.js#L400-L480) (status transitions, completion verification).
- Wallet / referral transactions created alongside bookings: [backend/src/controllers/bookingController.js](backend/src/controllers/bookingController.js#L640-L748) (`Wallet.create`, `Transaction.create`).

Payment
- Payment intent created: [backend/src/controllers/paymentController.js](backend/src/controllers/paymentController.js#L1-L120) (`Payment.create` in `createOrder`).
- Payment verification updates payment and booking: [backend/src/controllers/paymentController.js](backend/src/controllers/paymentController.js#L1-L200) (`verifyPayment` sets `Payment.status = 'SUCCESS'` and updates `Booking.paymentStatus`).

LabOrder
- Created: [backend/src/controllers/labController.js](backend/src/controllers/labController.js#L180-L210) (`LabOrder.create` in `bookTest`).
- Admin/finance updates: [backend/src/controllers/adminLabController.js](backend/src/controllers/adminLabController.js#L320-L400) (`manageFinanceStatus`, marking `paymentStatus = 'collected'` and crediting `PartnerTransaction`).

Wallet (User)
- Created if missing: [backend/src/services/providerEarningsService.js](backend/src/services/providerEarningsService.js#L60-L66) (`Wallet.create`).
- Created/used in bookings/referral flows: [backend/src/controllers/bookingController.js](backend/src/controllers/bookingController.js#L640-L748) (`Wallet.create`, `wallet.balance` updates).

Transaction (User Ledger)
- Created on wallet debit/credit: [backend/src/controllers/paymentController.js](backend/src/controllers/paymentController.js#L1-L200) (`Transaction.create` in `payWithWallet`), and booking referrals: [backend/src/controllers/bookingController.js](backend/src/controllers/bookingController.js#L657-L740) (`Transaction.create`).

PartnerWallet / PartnerTransaction / PartnerSettlement
- Partner wallet updates and transactions when lab payment collected: [backend/src/controllers/paymentController.js](backend/src/controllers/paymentController.js#L1-L400) (lab payment flow credits `PartnerTransaction`), and [backend/src/controllers/adminLabController.js](backend/src/controllers/adminLabController.js#L280-L320) (`PartnerSettlement.create`, `PartnerTransaction.create`).
- Settlement processing (admin): [backend/src/controllers/adminLabController.js](backend/src/controllers/adminLabController.js#L340-L380) (`processSettlement` deducts `PartnerWallet.balance`, creates `PartnerSettlement` and `PartnerTransaction`).

LabReconciliation
- Created/updated in reconciliation endpoints (finance): [backend/src/models/LabReconciliation.js](backend/src/models/LabReconciliation.js#L1-L60) (model), used by reconciliation controllers (search `LabReconciliation` in `backend/src/controllers`).

Offerings / SubscriptionPlan / PatientSubscription / PatientPackage
- Offerings/Plans created via admin: [backend/src/controllers/adminController.js](backend/src/controllers/adminController.js#L560-L572) (`SubscriptionPlan.create` / plan management).
- Bookings reference `Offering`/`SubscriptionPlan` during `createBooking` ([backend/src/controllers/bookingController.js](backend/src/controllers/bookingController.js#L1-L220)).

Notes / Caveats
- The above list is an initial map from grep and file scans. There are many `.save()` occurrences across controllers which mutate models (e.g., `booking.save()`, `user.save()`), and these should be reviewed per-file for race conditions.
- Some mutation sites create wallet and transaction records conditionally (referrals, partner payouts, admin overrides); these are potential revenue leak hotspots.
- Next: I will expand each bullet into a detailed per-file excerpt with exact code snippets, and produce a change graph showing which operations are atomic vs multiple-step (where transactions should be used).
