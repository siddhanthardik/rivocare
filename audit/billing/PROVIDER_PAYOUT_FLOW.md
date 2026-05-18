# Provider Payout Flow — Initial Notes

Summary:

- Provider earnings are computed per completed `Booking` via `providerEarningsService.getProviderEarningsSnapshot` ([backend/src/services/providerEarningsService.js](backend/src/services/providerEarningsService.js#L1-L200)).
- Provider balances are stored in `Wallet` documents (one per user) and historical payouts are recorded as `Transaction` documents with type `DEBIT`.
- Lab partner payouts are handled via `PartnerWallet` and `PartnerTransaction` models in `paymentController.verifyLabPayment` flow.

Preliminary payout steps:

1. Booking completes -> booking.status = 'completed' and providerEarning/platformFee populated.
2. `getProviderEarningsSnapshot` aggregates completed bookings and reads provider `Wallet` balance.
3. Payouts appear to be manual/triggered by transactions with `Transaction.type = 'DEBIT'`.

Immediate gaps:

- No dedicated `PayoutRequest` or `PayoutLedger` model found in initial scan.
- No automated scheduled payout processor observed — potential manual process or CRON outside current codebase.
- Floating point/rounding behavior uses `Math.round` but not consistent across services — audit for rounding and currency unit consistency required.
