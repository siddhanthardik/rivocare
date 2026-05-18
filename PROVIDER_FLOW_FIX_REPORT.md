Provider Flow Fix Report

Summary:
- Goal: Stabilize provider booking lifecycle without touching payments or architecture.

Fixes applied:
- Fixed provider acceptance/start validation to avoid "Booking no longer available" when starting service. (backend/src/controllers/bookingController.js)
  - Require pending -> confirmed for accept, confirmed -> in-progress for start.
  - Added ownership check to ensure caller is assigned provider.
  - Added structured debug logs for accept/start attempts.

- Ensured backend always returns `providerEarning` and `platformFee` in booking responses (backend/src/controllers/bookingController.js).
  - If missing, `providerEarning` is computed as 80% fallback of final/total amount.
  - `providerEarning` used by frontend for display.

- Provider earnings summary now returns explicit provider amounts (backend/src/controllers/providerEarningsController.js).

- Frontend (provider Bookings) now displays `providerEarning` only (frontend/src/pages/dashboard/provider/Bookings.jsx).
  - Normalizes booking status comparisons to lowercase to avoid mismatch.

- Introduced `TESTING_MODE` guard to skip cron jobs during tests (backend/src/index.js).

Files changed:
- backend/src/controllers/bookingController.js
- backend/src/controllers/providerEarningsController.js
- backend/src/index.js
- frontend/src/pages/dashboard/provider/Bookings.jsx

Notes:
- No changes made to payments, Razorpay, invoices, or wallet credit logic.
- Cron code is preserved but not started when `TESTING_MODE=true`.
