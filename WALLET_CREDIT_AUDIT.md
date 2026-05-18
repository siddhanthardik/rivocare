WALLET CREDIT AUDIT

Scope
- Audit wallet credit locations and add idempotency guards to prevent duplicate credits.

Locations reviewed & actions
- `backend/src/controllers/bookingController.js`
  - Credits on booking completion were made atomic & idempotent.
  - Added Transaction lookup by `referenceId` before creating credit entries.
- `backend/src/controllers/paymentController.js`
  - Prepaid booking creation flow: already had a guard for existing transaction; preserved and left as-is.
  - Wallet debits (wallet payments) use atomic `findOneAndUpdate` with balance checks.
- `backend/src/controllers/partnerLabController.js`
  - Partner credit on report upload and partner-initiated collection uses `findOneAndUpdate` + existing `PartnerTransaction` check.
- Other areas (admin settlements, manual scripts)
  - Existing admin flows create debits/credits; manual scripts should follow same pattern; no changes made here (out of scope).

Recommended follow-ups
- Add DB-level uniqueness index for `Transaction` where appropriate: `(wallet, referenceId, type)` to enforce uniqueness at the DB level (requires migration and testing).
- Add a reconciliation report for historical invoices/transactions to detect anomalies (out of scope for this task).

End of audit.
