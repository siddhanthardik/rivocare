Provider Earning Validation

Summary:
- Backend computes and stores `providerEarning` at booking creation as `Math.round(finalPrice * 0.8)` (bookingController).
- `pricingService` supports configurable split and may produce `providerEarning` accordingly; controller responses now always include `providerEarning`.

What changed:
- Frontend provider UI now reads `booking.providerEarning` for all user-facing earning displays.
- Provider earnings snapshot API uses `providerEarning` and falls back to `Math.round((finalAmount||totalAmount)*0.8)` only if missing.

Validation checklist:
- [ ] Create a booking with finalPrice ₹100 — verify `providerEarning` returned is ₹80 in booking response.
- [ ] Complete booking and confirm provider wallet credit equals `providerEarning`.
- [ ] Check provider earnings summary page shows amounts equal to the sum of `providerEarning` across completed bookings.

Files to inspect:
- backend/src/controllers/bookingController.js
- backend/src/services/pricingService.js
- backend/src/controllers/providerEarningsController.js
- frontend/src/pages/dashboard/provider/Bookings.jsx

