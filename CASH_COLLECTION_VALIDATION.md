CASH COLLECTION VALIDATION

Goals
- Ensure cash collection can be marked only once per booking/order.
- Prevent duplicate wallet credits when cash collection is marked.
- Ensure patient confirmation and dispute reporting work.

What was implemented
- Backend (`markCashCollectedBooking` and partner `markPaymentCollected`):
  - Both paths use DB transactions and `findOneAndUpdate({ $inc })` for wallet increments.
  - Before creating a `Transaction` / `PartnerTransaction`, code checks for an existing transaction with the same `referenceId` (booking/order) and `type`.
  - If an existing transaction exists, credit is skipped and a console warning is emitted.
- Patient flows:
  - `confirmCash` endpoint returns success if already confirmed and prevents double-confirm.
  - `reportCashIssue` sets `disputeRaised` and creates admin notifications.
- Frontend guards:
  - Partner UI disables repeated submits while the cash-collection request is in-flight.
  - Partner report upload is blocked in the UI if COD order is unpaid (redundant backend check protects server-side).

How to test
1. Create a COD booking.
2. Call partner's mark-collected endpoint once — expect success and a single credit transaction.
3. Call mark-collected again — expect safe success response and no new transaction.
4. Patient calls `confirmCash` — expect confirmation recorded; subsequent calls should return success without changes.
5. Patient calls `reportCashIssue` — expect `disputeRaised = true` and admin notifications persisted.

Evidence to collect if issues occur
- Screenshot of partner wallet transactions before and after mark-collection.
- Server logs for the `markCashCollectedBooking` invocation.
- Transaction table entries for `referenceId`.

End of cash validation.
