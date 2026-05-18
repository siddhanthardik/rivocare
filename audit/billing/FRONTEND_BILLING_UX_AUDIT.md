# Frontend Billing UX & Admin Screens Audit

Scope: UI/UX review of frontend billing-related screens (patient checkout, partner/provider wallets, provider earnings, admin finance). Files inspected:
- `frontend/src/pages/dashboard/partner/Wallet.jsx`
- `frontend/src/pages/dashboard/provider/Earnings.jsx`
- `frontend/src/pages/dashboard/admin/FinanceOS.jsx`
- `frontend/src/pages/labs/LabCheckout.jsx`
- `frontend/src/pages/dashboard/patient/LabBooking.jsx`
- `frontend/src/hooks/useRazorpay.js`
- `frontend/src/services/walletService.js`, `paymentService.js`, `labService` usages

Summary of findings (priority ordered)

1) Inconsistent payout request flows (HIGH)
- Observation: `ProviderEarnings.jsx` opens a modal and calls `walletService.requestPayout(amount)` to create payout requests. However, `PartnerWallet.jsx`'s `requestPayout` is a local stub that only shows a toast and does not call `walletService.requestPayout`.
- Risk: inconsistent behavior across partner/provider dashboards causing confusion and potential support tickets.
- Files: `frontend/src/pages/dashboard/provider/Earnings.jsx`, `frontend/src/pages/dashboard/partner/Wallet.jsx`.
- Recommendation: unify payout UX to call the same service (`walletService.requestPayout`) and surface the `PayoutRequest` object returned (amount, id, status, ETA). Disable duplicate clicks and show spinner while request is pending.

2) Missing payout request history / status for providers (HIGH)
- Observation: Provider UI shows `Last payout` and a simple bookings table but lacks a paginated list of previous `PayoutRequest`s and their statuses (PENDING, PROCESSING, COMPLETED, FAILED).
- Risk: providers cannot track whether payouts were processed or find payout references for reconciliation.
- Recommendation: add `My Payouts` view in provider dashboard that lists `PayoutRequest` records, transaction IDs, `externalReference`, and downloadable receipts.

3) Incomplete transaction / receipt download UX (MEDIUM)
- Observation: `PartnerWallet.jsx` shows a Download button when `isPaid` but the button only toggles visuals; no handler to fetch receipt/pdf is implemented.
- Risk: partners cannot retrieve receipts; missing PDFs hinder accounting.
- Recommendation: implement endpoint `/api/invoices/:id/download` or `/api/transactions/:id/receipt` and wire the button to download the PDF; show loading state and errors.

4) Checkout and payment UX minimal / partially implemented (MEDIUM)
- Observation: `LabCheckout.jsx` is a placeholder; `useRazorpay.js` only loads the script. `LabBooking.jsx` invokes `labService.bookTest` without explicit Razorpay checkout flow visible in that file.
- Risk: inconsistent payment experience and unclear where user completes payment; may rely on modal redirects or missing flows.
- Recommendation: centralize Razorpay checkout logic (a `useCheckout` hook), provide clear pre-payment review, show order + amount in checkout modal, handle success/error states and redirects, and implement offline fallback for UPI/COD.

5) Currency formatting and rounding ambiguity (MEDIUM)
- Observation: frontend formats amounts using `formatCurrency`, but backend stores amounts inconsistently (INR vs paise). CSV exports in `PartnerWallet.jsx` use `.toFixed(2)` assuming decimal INR.
- Risk: mismatches between displayed amounts and internal stored values after currency normalization.
- Recommendation: standardize: backend stores paise integers; frontend `formatCurrency` should accept paise and divide by 100 for display. Update CSV export to use formatted values consistently.

6) Admin actions lack strong audit/context links (MEDIUM)
- Observation: `FinanceOS.jsx` allows admin to 'Settle Now' wallets by calling `labService.processSettlement` with a random `payoutReference`. Admin UI doesn't link to `PayoutRequest` records created by providers.
- Risk: manual settlements may not match provider `PayoutRequest`s, creating disputes.
- Recommendation: Admin UI should surface `PayoutRequest` queue (our new `/api/admin/payouts`) and allow processing with `externalReference` input, and link the processed payout to provider transactions and `PayoutRequest` records.

7) Missing invoice generation and download for bookings (LOW)
- Observation: no Booking invoice generation in booking completion or payment verification flows; lab invoices exist in backend but patient booking invoices are not present in UI.
- Risk: patients cannot download receipts for payments; missing for compliance/tax.
- Recommendation: generate invoice on payment capture and surface in patient dashboard `My Bookings` with download link.

8) Rate limiting and click-safety on key actions (LOW)
- Observation: multiple buttons (Request Payout, Confirm Withdrawal, Process Payout) lack explicit debounce or server-side idempotency tokens visible in UI.
- Risk: duplicate requests from double-clicks.
- Recommendation: add disable/loader on click, and use idempotency keys returned by server to prevent duplicates.

Design & UX suggestions
- Show clear payout lifecycle: Requested -> Reserved (wallet reduced) -> Processing -> Completed (external ref) with timestamps and transaction links.
- Provide per-transaction drilldown: platform fee, net provider earning, GST/tax breakdown, settlement status, external payout ref, and invoice download.
- On checkout, display the Razorpay order id and expected payable amount to the user, and provide a fallback retry mechanism if payment fails.
- Add small green/red visual indicators for settlement/payment health and a tooltip that explains 'Pending' vs 'Collected' vs 'Settled'.

Developer action checklist
- [ ] Wire `PartnerWallet.jsx` `requestPayout` to call `walletService.requestPayout` and handle server response (show payout id & status).
- [ ] Add `/dashboard/provider/payouts` page to list `PayoutRequest` records via a new `walletService.getPayouts()` endpoint.
- [ ] Implement receipt download endpoints and wire Download buttons.
- [ ] Implement centralized checkout hook `useCheckout` and use it across `LabBooking` and `LabCheckout`.
- [ ] Update CSV export to format currency using `formatCurrency` and ensure amounts are converted from paise.
- [ ] Update Admin `FinanceOS` to use `/api/admin/payouts` queue and link settlements to `PayoutRequest`.

Files referenced
- `frontend/src/pages/dashboard/partner/Wallet.jsx`
- `frontend/src/pages/dashboard/provider/Earnings.jsx`
- `frontend/src/pages/dashboard/admin/FinanceOS.jsx`
- `frontend/src/pages/labs/LabCheckout.jsx`
- `frontend/src/pages/dashboard/patient/LabBooking.jsx`
- `frontend/src/hooks/useRazorpay.js`
- `frontend/src/services/walletService.js`

If you want, I can implement the frontend fixes in this order:
1) Wire `PartnerWallet` payout request to backend and show request status.
2) Add provider `My Payouts` page listing `PayoutRequest`s.
3) Implement receipt download endpoint (backend) and wire Download in `PartnerWallet`.
