RECONCILIATION API DOCUMENTATION

Base path: /api/admin/reconciliation

Endpoints:

GET /summary
- Description: Read-only aggregate summary for billing reconciliation.
- Response data: totals for bookings, collected amounts, pending/failed payments, payouts, webhook failures, orphan payments, unpaid completed bookings.

GET /payments
- Description: Paginated list of payments.
- Query params: page, limit, status, q (id or order/payment id search)
- Returns: payments array (lean), total, page, totalPages

GET /payouts
- Description: Paginated list of payout requests.
- Query params: page, limit, status, q
- Returns: payouts array (lean, populated provider/wallet/transaction), total, page, totalPages

GET /failures
- Description: Paginated list of failed/unprocessed webhooks for manual review.
- Query params: page, limit

Security: All endpoints require admin role (uses existing `protect` and `requireRole('admin')` middleware).

Notes:
- Endpoints are READ-ONLY and perform optimized aggregation/lean queries.
- No DB mutations performed.
