# Patient Billing Flow Audit

This file traces patient billing flows end-to-end using real code paths and file citations.

Summary of primary endpoints and UI entrypoints:
- Create booking: `POST /api/bookings` -> `createBooking` in `backend/src/controllers/bookingController.js`.
- Create Razorpay order (booking): `POST /api/payment/create-order` -> `createOrder` in `backend/src/controllers/paymentController.js`.
- Verify payment (booking): `POST /api/payment/verify` -> `verifyPayment` in `backend/src/controllers/paymentController.js`.
- Wallet payment: `POST /api/payment/pay-with-wallet` -> `payWithWallet` in `backend/src/controllers/paymentController.js`.
- Lab booking: `POST /api/labs/book` (via `labController.bookTest`) -> `LabOrder.create` in `backend/src/controllers/labController.js`.
- Lab payment: `POST /api/payment/lab/create-order` and `POST /api/payment/lab/verify` -> `paymentController.createLabPayment`, `paymentController.verifyLabPayment`.
- Frontend booking UI: `frontend/src/pages/booking/BookingWizard.jsx` (calls `bookingService.create` -> `/bookings`).
- Frontend payment calls: `frontend/src/services/paymentService.js` (maps to backend endpoints).

Definitions used below:
- "Booking" = `Booking` model (service/home visits).
- "LabOrder" = `LabOrder` model (diagnostics, blood tests).

SCENARIO A: Patient books physiotherapy (plan-based on BookingWizard)
- Frontend screens: `frontend/src/pages/booking/BookingWizard.jsx` (select service -> plan -> provider -> confirm).
- API sequence:
  1. Frontend: `bookingService.create` -> `POST /api/bookings` (payload includes `providerId`, `service`, `planId`, `address`, `scheduledAt`) [see `BookingWizard.jsx` and `bookingService.js`].
  2. Backend: `createBooking` validates plan, provider, pincode, computes `finalPrice`, `platformFee`, `providerEarning`, and calls `Booking.create` ([backend/src/controllers/bookingController.js#L150-L210]).
 3. Response: booking created with `paymentStatus: 'PENDING'` and `status: 'pending'` returned to frontend.
- DB writes: new `Booking` document with monetary fields: `totalAmount`, `finalAmount`, `platformFee`, `providerEarning` (booking controller sets these) [see `Booking.js` model].
- Payment capture:
  - After provider accepts and booking status becomes `confirmed`, frontend should call `paymentService.createOrder` -> `POST /api/payment/create-order` to create Razorpay order ([paymentController.createOrder]).
  - Razorpay order amount uses `payableAmount` computed from booking (`finalPrice` or `totalAmount`) converted to paise: `Math.round(payableAmount * 100)` and `razorpay.orders.create` is called.
  - Backend creates a `Payment` record referencing `razorpayOrderId` (note: `Payment.amount` stored as INR in code, comment mismatch) [see `paymentController.createOrder` and `models/Payment.js`].
  - Frontend performs Razorpay checkout and on success calls `POST /api/payment/verify` with `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`.
  - Backend verifies signature, sets `Payment.status = 'SUCCESS'`, saves `razorpayPaymentId` and `razorpaySignature`, then updates `Booking.paymentStatus = 'PAID'` via `findByIdAndUpdate` ([paymentController.verifyPayment]).
- Invoice timing: For service bookings (non-lab) no dedicated `Invoice` model; invoice not generated automatically in code — booking stores monetary fields and invoices likely derived on-demand; lab has explicit invoice logic. Verify admin UI for invoice generation (none found for Booking invoices).
- Notifications: Provider notified via `Notification.create` and socket emit after booking creation and payment verification.
- Revenue calculation: `platformFee` and `providerEarning` calculated at booking create using plan price or via `pricingService` for offerings in other flows. See `pricingService.calculateBookingPrice` for lab/offering logic, but `createBooking` uses plan price and Math.round splits.
- Race / risks:
  - Payment verification updates Payment then Booking separately (two-step) — risk of inconsistent state if second step fails.
  - No invoice persistence for service bookings increases reconciliation effort.

SCENARIO B: Patient books nursing (same as A)
- Flow identical to physiotherapy: booking via `BookingWizard.jsx` and then payment via `paymentService.createOrder` / `verifyPayment`.

SCENARIO C: Patient books attendant service (same as A)
- Flow identical to physiotherapy.

SCENARIO D: Patient books blood test (lab flow)
- Frontend screens: lab ordering pages; `frontend/src/services/labService.js` and patient lab pages `frontend/src/pages/dashboard/patient/LabReports.jsx` (shows orders and pay to unlock) call `paymentService.createLabOrder`.
- API sequence:
  1. Frontend: `labService.bookTest` -> `POST /api/labs/book` (controller: `labController.bookTest`) creates `LabOrder` ([labController.bookTest], `LabOrder.create`).
  2. `LabOrder` created with `totalAmount`, `platformFee`, `labPayout`, `paymentStatus: 'pending'`.
 3. To pay: frontend calls `paymentService.createLabOrder` (POST `/api/payments` wrapper) which in backend `initiateLabPayment` can mark `order.paymentStatus = 'paid'` for simulated flows, or for Razorpay flow frontend calls `POST /api/payment/lab/create-order` to create Razorpay Order and `Payment` record.
 4. After Razorpay success, `POST /api/payment/lab/verify` -> `verifyLabPayment` verifies signature, sets `Payment.status = 'SUCCESS'`, sets `LabOrder.paymentStatus = 'paid'`, updates `labOrder.paymentCollectedAt`, `paymentMethod`, `reportLocked=false`, and if order already `completed` or `report_uploaded` it credits `PartnerWallet` and creates `PartnerTransaction` (with duplicate protection using `findOne`) [see `paymentController.verifyLabPayment`].
- Invoice timing: `labController.getInvoice` builds invoice only when `LabOrder.paymentStatus` is `collected` or `paid` — invoice available after collected payment ([labController.getInvoice]).
- Revenue calculation: `pricingService.calculateBookingPrice` contains lab commission and platform fee logic; `labController.bookTest` computes `platformFee` and `labPayout` per-test using `LabProfile` or `LabCommission` overrides.
- Race / risks:
  - `verifyLabPayment` uses `findOne` to prevent double credit — good.
  - `LabOrder` reports may be locked until payment collected (reportLocked flag).

SCENARIO E: Patient books diagnostic package (lab offering)
- Similar to D: `Offering`/package selected in lab booking flow (bookTest uses multiple tests), `LabOrder.totalAmount` = sum of test prices, platform commissions computed per test.

SCENARIO F: Patient books recurring service (subscription/plan)
- Frontend: selecting `plan` in `BookingWizard.jsx` (plans loaded via `pricingService.getPlansByService`).
- Backend: `createBooking` requires `planId` and stores `offering`, `planName`, `planPrice`, `pricingSource: 'PLAN'` and `pricingService` used for offerings elsewhere ([bookingController.js]).
- Recurring billing: `SubscriptionPlan` and `PatientSubscription` models exist (`SubscriptionPlan.js`, `PatientSubscription.js`) but recurring charging automation not found in initial scan — likely requires additional cron or subscription job (not present). Manual or external scheduler likely required.

SCENARIO G: Payment by UPI / other gateways
- Backend currently integrated with Razorpay (`backend/src/controllers/paymentController.js`) and assumes Razorpay handles UPI. Other gateways (Stripe, PayU, Cashfree) not found in codebase.
- Payment flow identical: create order via Razorpay, verify signature in `verifyPayment`.

SCENARIO H: Cash payment / COD
- For service bookings, no explicit COD flow found — booking `paymentStatus` remains `PENDING` until payment verified or admin marks paid.
- For lab orders, `paymentMethod: 'cod'` exists; admin or partner must mark collection via `adminLabController.manageFinanceStatus` which on `collected` will credit partner wallet and create `PartnerTransaction` if `order.status` is `completed` or `report_uploaded` (see `adminLabController.manageFinanceStatus`).

SCENARIO I: Partial payments / failed payments
- Partial payments: code does not show partial capture support (no `amountPaid` field or partial capture logic). `Payment.amount` ties to full booking amount.
- Failed payments: `verifyPayment` sets `Payment.status = 'FAILED'` and responds 400. Booking remains `paymentStatus: 'PENDING'`. No automatic retry logic seen — frontend must re-initiate createOrder.

SCENARIO J: Cancellation / Reschedule
- Cancellation: `Booking` status enum includes `cancelled`. Admin endpoints and booking routes allow delete/cancel; payment refund flows are not automatic — `paymentController` has no refund endpoint; admin controllers support marking `paymentStatus: 'refunded'` via `adminLabController.manageOrder` which sets `paymentStatus: 'refunded'` for lab orders (see `adminLabController.manageOrder`).
- Reschedule: `bookingController` includes update endpoints (e.g., updateBookingStatus) — reschedule would update `scheduledAt` and is validated in booking create but reschedule specifics require client call to booking update endpoint.

Per-scenario conclusions & immediate issues:
- Invoices: Lab invoices exist and are generated from `LabOrder` (`labController.getInvoice`) only after collected/paid. Service bookings do not have a persistent invoice model and rely on `Booking` fields — reconciliation and GST invoicing may be unsupported for services.
- Atomicity: Payment flows often perform multi-step updates (Payment.save() then Booking.update), risking inconsistent state. User wallet flows are particularly vulnerable (balance change then transaction record). Partner flows mostly use atomic operators (`$inc` + `findOneAndUpdate`) and duplicate checks.
- Idempotency: Payment endpoints lack idempotency keys; repeated `createOrder` or `verifyPayment` calls could create duplicate Payment records or inconsistent states unless gateway callbacks are strictly single-use.
- Refunds: No standard refund API integrated; admin flows can mark `paymentStatus: 'refunded'` for lab orders but gateway refund automation not present.
- Recurring billing: `SubscriptionPlan` and `PatientSubscription` models exist but no scheduler/cron observed to charge recurring payments.

Files to review next for deeper traces: `backend/src/controllers/bookingController.js`, `backend/src/controllers/paymentController.js`, `backend/src/controllers/labController.js`, `frontend/src/pages/booking/BookingWizard.jsx`, `frontend/src/services/paymentService.js`, `frontend/src/services/bookingService.js`.
