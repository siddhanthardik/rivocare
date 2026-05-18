LIVE PAYMENT TEST RESULTS

Environment: run tests in a staging environment with real Razorpay test/live keys.

Checklist (manual/automated steps to run)
1. Prepaid Service
   - Action: Create booking + pay via Razorpay (prepaid flow using bookingIntent or bookingId).
   - Expectation:
     - Razorpay order created (server returns keyId).
     - Payment verify endpoint returns success.
     - Booking created (for bookingIntent flows) only after verification.
     - Provider wallet credited once; Transaction created once.
     - InvoiceSnapshot created; PDF generation attempted (best-effort).
2. Prepaid Lab Test
   - Action: Create lab order and pay via Razorpay.
   - Expectation: Lab order created, invoice snapshot present, report upload allowed after paid.
3. Cash Service
   - Action: Create booking with paymentMethod='cod'. Provider marks cash collected via partner UI or admin endpoint.
   - Expectation:
     - Booking marked as paid/collected once; subsequent attempts return success but do not double-credit.
     - Provider wallet credited once; Transaction checked for duplicates.
     - Patient receives confirmation notification and can confirm or report an issue.
4. Cash Lab Test
   - Action: Create lab order (COD). Attempt to upload report before marking collected (should be blocked).
   - Expectation: Upload blocked until partner/admin marks collected. Upload afterward succeeds and partner wallet credited once.
5. Security Tests
   - Replay `verifyPayment` with same signature/payment: server returns idempotent success (payment already verified).
   - Replay webhook (if configured): webhook log/dedupe should avoid duplicate processing.

Summary of test outcomes (apply after you run tests locally):
- Prepaid booking created after verifyPayment: [PASS/FAIL]
- Provider credited once (no duplicate tx): [PASS/FAIL]
- Lab prepaid flows invoice generation: [PASS/FAIL]
- COD report upload blocked before collect: [PASS/FAIL]
- COD collection idempotent: [PASS/FAIL]
- Payment fetch timeout handling (no hangs): [PASS/FAIL]

Notes
- Where a test fails, capture the server logs (nodemon) and return them for triage.
- If your environment is production, ensure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are correctly set; the controller logs an error if missing.

Commands to run locally
- Start backend (dev):
```bash
# from repo root
npm --prefix backend run dev
```
- Build frontend:
```bash
npm --prefix frontend run build
```

End of test results.
