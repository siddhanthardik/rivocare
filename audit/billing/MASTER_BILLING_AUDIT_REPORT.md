# MASTER BILLING AUDIT REPORT

Date: 2026-05-09

Summary
-------
This master report consolidates the billing audit performed across the codebase, documents completed hardening, outstanding risks, and a prioritized plan of remediation (short/mid/long term). It pulls together the phase artifacts in the `audit/billing` folder and provides a concrete migration and implementation roadmap for production-readiness.

Scope
-----
- Backend payment flows (Razorpay integration, `paymentController`, `webhookController`)
- Wallets, Transactions, PayoutRequests, PartnerWallet and provider wallets
- Partner/Lab settlement and admin payout flows
- Frontend checkout, receipts, and payout UX
- Data model and currency normalization
- Tests, observability, and deployment readiness

Completed artifacts (see audit folder)
-------------------------------------
- Provider payout audit: [audit/billing/PROVIDER_PAYOUT_AUDIT.md](audit/billing/PROVIDER_PAYOUT_AUDIT.md)
- Payment security: [audit/billing/PAYMENT_SECURITY_AUDIT.md](audit/billing/PAYMENT_SECURITY_AUDIT.md)
- Revenue leakage analysis: [audit/billing/REVENUE_LEAK_REPORT.md](audit/billing/REVENUE_LEAK_REPORT.md)
- Frontend billing UX audit: [audit/billing/FRONTEND_BILLING_UX_AUDIT.md](audit/billing/FRONTEND_BILLING_UX_AUDIT.md)
- Entity mutation maps & DB audit: [audit/billing/ENTITY_MUTATION_MAP.md](audit/billing/ENTITY_MUTATION_MAP.md), [audit/billing/BILLING_DATABASE_AUDIT.md](audit/billing/BILLING_DATABASE_AUDIT.md)
- Payment flow diagram: [audit/billing/PAYMENT_FLOW_DIAGRAM.md](audit/billing/PAYMENT_FLOW_DIAGRAM.md)

High-level findings
-------------------
1. Currency unit inconsistency: money fields are mixed between INR (decimal) and paise (integer). This is the highest-risk issue for reconciliation and reporting.
2. Wallet and payout operations contain non-atomic read-modify-write patterns leading to race conditions and potential double-debits/credits.
3. Transaction ledger is single-entry in places, missing required fields for forensic audit (status, externalReference, processedBy, idempotencyKey).
4. Webhook handling was added and hardened (signature verify + WebhookLog) but needs end-to-end tests and monitoring/alerts for replay or processing failures.
5. Payout workflow now creates `PayoutRequest` and reserves funds, but admin processing and linkage to transactions need stronger atomicity and reconciliation fields.
6. Frontend lacked centralized checkout and receipt download wiring; these have been added but need consistent UX and CSV/invoice formatting aligned with paise normalization.

Top-20 prioritized fixes (critical → lower)
-----------------------------------------
1. Normalize currency storage to paise across DB (Payment.amount, Transaction.amount, Wallet.balance, PartnerWallet.balance). (Migration required)
2. Make wallet debit/credit atomic: use conditional `findOneAndUpdate` with `$inc` and balance checks, or MongoDB transactions where multi-document updates are required.
3. Add idempotency keys for `/payment/create-order`, `/payment/verify`, `/wallet/payout`, and persist them with `Transaction` and `PayoutRequest` records.
4. Enforce unique transaction constraints where business reference exists (e.g., provider credit per Booking) to prevent double-credit.
5. Add `status`, `externalReference`, `processedBy`, and `idempotencyKey` fields to `Transaction` and `PartnerTransaction` models.
6. Make payout processing atomic: create `PayoutRequest` (PENDING) → admin picks and `processPayout` uses transaction/atomic update to mark COMPLETED or FAILED and attach external reference.
7. Implement double-entry ledger entries at payout time (debit platform liability, credit provider cash-out) to improve reconciliation and audit.
8. Add integration tests that simulate Razorpay webhooks, replay attempts, and verify idempotency and ledger integrity.
9. Remove ambiguous use of floating point money; use integer math with smallest currency unit only.
10. Add automated alerts for webhook failures, duplicate webhook deliveries, and unprocessed `WebhookLog` records.
11. Ensure `verifyPayment` and `verifyLabPayment` validate payment status via gateway API (already done) and are idempotent.
12. Persist invoice PDFs (generated server-side) and attach to booking / lab order documents and confirmation emails. (Puppeteer implemented for HTML→PDF)
13. Centralize checkout flow (`useCheckout`) and ensure payment failures and retries map to idempotency keys.
14. Wire partner/provider frontends to show `PayoutRequest` history and downloadable invoices.
15. Create DB migration and backout plan for paise normalization; add schema versioning and a migration-runner script.
16. Add reconciler job: daily aggregation of payments vs transactions vs payouts, generate discrepancies report, and store `Reconciliation` documents.
17. Harden admin settlement endpoints with RBAC and multi-approval for large payouts (threshold-based escrow/2FA for finance ops).
18. Add audit logs for admin actions (who processed which payout, timestamps, IP address) and link to transactions.
19. Provide CSV exports and per-transaction downloadable receipts with breakdown (platform fee, taxes, net) for providers and patients.
20. Document Operational Runbook: how to handle partial failures, manual reconciliation steps, and how to replay/compensate webhooks.

Remediation plan (phased)
------------------------
Phase A — Immediate (1–2 weeks)
- Normalize critical money reads in code to treat amounts consistently as paise (in computation only; full migration planned in Phase C).
- Make critical wallet operations atomic using `findOneAndUpdate` conditional `$inc` patterns.
- Add `idempotencyKey` param support to wallet payout and payment verify endpoints (persist on first call and reject duplicates).
- Add monitoring for webhooks and unprocessed `WebhookLog` entries.

Phase B — Short term (2–6 weeks)
- Implement model changes for `Transaction`/`PartnerTransaction` (status, externalReference, processedBy, idempotencyKey) and update code paths to set these fields.
- Wire frontend to display PayoutRequest history and downloadable invoices.
- Add integration tests for payment verification + webhook replay + payout lifecycle.

Phase C — Migration (4–12 weeks)
- Run DB migration to convert all currency fields to paise (see migration plan below). Test on staging with full reconciliation and rollback verification.
- Convert CSV export, frontend formatting, and any third-party integrations to expect paise integers.
- After migration, remove decimal-based codepaths and strengthen integer-only calculations.

Phase D — Long term / Hardening (2–4 months)
- Implement double-entry ledger and reconciliation automation.
- Add multi-approval and 2FA for large admin payouts.
- Harden observability (SLOs, alerts, dashboards) for billing subsystems.

DB migration plan (paise normalization)
------------------------------------
Goal: convert all money fields to integer paise and update code to treat values as integers.

Steps (staging first)
1. Inventory money fields and models (Payment.amount, Transaction.amount, Wallet.balance, PartnerWallet.balance, LabOrder.totalAmount, etc.) — this list exists in [audit/billing/BILLING_DATABASE_AUDIT.md](audit/billing/BILLING_DATABASE_AUDIT.md).
2. Add schema version field `billingSchemaVersion` in a lightweight `SystemMeta` document.
3. Deploy code that is backward-compatible: accepts both paise and INR (accepts float/string), and logs which orders use which unit.
4. Run a dry conversion script in staging that:
   - Creates new fields `<field>_paise` with integer values = round(original * 100).
   - Verifies sums and aggregates (payments vs transactions vs wallets) match within expected rounding error.
5. Switch read ops in staging to prefer `<field>_paise` while still writing new `<field>` for rollback safety.
6. After 2–3 days of smoke testing and reconciliation, run migration to replace old field with paise integer and deploy code that expects paise only.
7. Provide rollback: keep original fields until after final verification; if mismatch occurs, use snapshot and reconciliation process to revert.

Migration safety notes
--------------------
- Run on a read-only snapshot first for validation.
- Keep backups and export daily aggregates before conversions.
- Avoid converting production before automated reconciler and tests are green on staging.

Testing & verification
----------------------
- Add unit tests for currency computations (splits, platformFee, rounding) in integer paise.
- Add integration tests that:
  - Create booking, create order, simulate Razorpay payment and webhook, assert ledger entries and wallet balances.
  - Simulate webhook replay and network retries to assert idempotency.
  - Simulate concurrent payout requests to assert atomic wallet behavior (race condition safety).

Operational runbook (short)
---------------------------
1. When webhook fails signature verification, `WebhookLog` stores raw payload. Finance should not process until investigation.
2. For partial failures (wallet deducted but `Transaction` creation failed), use compensating transaction utility to either credit back or create an audit 'COMPENSATION' transaction.
3. For migration rollback, run the `restore_from_snapshot` script and re-run reconciliation.

Files changed by audit work (key)
--------------------------------
- `backend/src/controllers/paymentController.js` — hardened verify flows (idempotency checks, gateway verification)
- `backend/src/controllers/webhookController.js` — webhook verifier and `WebhookLog`
- `backend/src/models/Transaction.js`, `PayoutRequest.js`, `WebhookLog.js` — new/updated models
- `backend/src/controllers/labController.js` — invoice and PDF generation (Puppeteer)
- `frontend/src/hooks/useCheckout.js` — centralized checkout hook
- `frontend/src/pages/labs/LabCheckout.jsx`, `frontend/src/pages/dashboard/patient/LabBooking.jsx` — checkout wiring and redirect
- `frontend/src/pages/dashboard/partner/Wallet.jsx` — invoice download wiring

Next immediate actions (I will implement if you approve)
--------------------------------------------------
1. Draft and apply DB migration scripts for paise normalization (staging-first). (high priority)
2. Add idempotency token handling to all external money endpoints and persist on `Transaction` and `PayoutRequest`. (high priority)
3. Add unit/integration tests for webhook + verifyPayment idempotency and a concurrent payout race test. (high priority)
4. Produce Mermaid diagrams (Patient payment flow and Provider payout state machine) and include them in this repo under `audit/billing/diagrams`. (quick win)

If you approve, I'll start by scaffolding the DB migration and creating the first Mermaid diagrams.

Appendix: Quick references
-------------------------
- Patient invoice endpoint: `GET /api/invoices/:id` and `GET /api/invoices/:id/download` — see [backend/src/routes/invoices.js](backend/src/routes/invoices.js#L1) and [backend/src/controllers/labController.js](backend/src/controllers/labController.js#L1).
- Webhook logs and controller: [backend/src/controllers/webhookController.js](backend/src/controllers/webhookController.js#L1) and [backend/src/models/WebhookLog.js](backend/src/models/WebhookLog.js#L1).
- Payout endpoints: `POST /api/wallet/payout` and admin `POST /api/admin/payouts/:id/process` (see controllers in `backend/src/controllers/`).
