# API WIRING VALIDATION — Carely Platform
**Audit Date:** 2026-05-11  
**Scope:** Admin API route correctness, auth middleware, normalized responses, frontend ↔ backend mapping

---

## ROUTE MOUNTING (index.js)

```
/api/admin             → routes/admin.js              [protect + requireRole('admin')]
/api/admin/payouts     → routes/payoutRoutes.js        [protect + requireRole('admin')]
/api/admin/reconciliation → routes/adminReconciliation.js [protect + requireRole('admin')]
/api/admin/labs        → routes/adminLabs.js
/api/admin/labs/reconciliation → routes/reconciliation.js
/api/payment           → routes/paymentRoutes.js       [protect]
/api/payments          → routes/paymentRoutes.js       [protect] (DUPLICATE MOUNT)
```

### WIRING ISSUES

**Issue W-001: Duplicate Payment Route Mount**
```js
// index.js line 139-140
app.use('/api/payment', paymentRoutes);
app.use('/api/payments', paymentRoutes);
```
Both `/api/payment/*` and `/api/payments/*` resolve to the same controller. This is intentional for backward compatibility but creates confusion. `bookingService.js` calls `POST /bookings/:id/collect-cash` which does NOT exist in the routes.

**Issue W-002: bookingService.collectCash calls non-existent route**
```js
// bookingService.js line 10
collectCash: (id, data) => api.post(`/bookings/${id}/collect-cash`, data),
```
Looking at `bookings.js` routes — this endpoint may not be registered. The actual endpoint is `POST /api/payment/mark-cash-collected/:id` or `POST /api/payments/mark-cash-collected/:id`.

**Issue W-003: Route Shadowing Risk**
```js
// index.js line 152-153
app.use('/api/admin/labs', adminLabRoutes);
app.use('/api/admin/labs/reconciliation', reconciliationRoutes);
```
`/api/admin/labs/reconciliation` is more specific than `/api/admin/labs` — Express routes correctly (specific before general), but the order here has labs BEFORE labs/reconciliation. Express matches prefix greedily — `/api/admin/labs/reconciliation/...` would first check `adminLabRoutes` for a `/reconciliation/...` route. If `adminLabRoutes` doesn't have it, falls through to `reconciliationRoutes`. This is safe if `adminLabRoutes` has no catch-all, but fragile.

---

## ADMIN ROUTES AUDIT (`routes/admin.js`)

### Registered Routes
```
GET  /api/admin/stats
GET  /api/admin/users
PUT  /api/admin/users/:id
GET  /api/admin/providers
GET  /api/admin/providers/:id/details
PUT  /api/admin/providers/:id/verify
GET  /api/admin/dashboard/summary
GET  /api/admin/dashboard/revenue
GET  /api/admin/dashboard/top-providers
GET  /api/admin/dashboard/bookings
GET  /api/admin/fraud/summary
GET  /api/admin/fraud/flags
POST /api/admin/fraud/action
POST /api/admin/pincodes/add
GET  /api/admin/pincodes/list
PUT  /api/admin/pincodes/:id/toggle
POST /api/admin/plans/create
GET  /api/admin/plans
PUT  /api/admin/plans/:id
POST /api/admin/packages/create
GET  /api/admin/packages
PUT  /api/admin/packages/:id
GET  /api/admin/assignments/pending
POST /api/admin/assign-provider
GET  /api/admin/services/pricing
PUT  /api/admin/services/:id/pricing
GET  /api/admin/labs/tests
PUT  /api/admin/labs/tests/:id/pricing
PUT  /api/admin/labs/:labId/commission
PUT  /api/admin/labs/partners/:partnerId/department-commissions
PUT  /api/admin/bookings/:id/set-price
GET  /api/admin/leads
PUT  /api/admin/leads/:id
PUT  /api/admin/providers/:id/onboarding-status
GET  /api/admin/supply-gaps
POST /api/admin/content/pages
GET  /api/admin/content/pages
GET  /api/admin/content/pages/:id
PUT  /api/admin/content/pages/:id
DELETE /api/admin/content/pages/:id
POST /api/admin/content/pages/:id/hero
POST /api/admin/blogs
GET  /api/admin/blogs
GET  /api/admin/blogs/:id
PUT  /api/admin/blogs/:id
DELETE /api/admin/blogs/:id
POST /api/admin/blogs/:id/hero
```

### MISSING from admin.js (defined in controller but NOT wired)
```
GET  /api/admin/reconciliation/report    ← getReconciliationReport() exists
POST /api/admin/reconciliation/fix/:id   ← fixReconciliationIssue() exists (also has crash bug)
```
These two controller functions exist but are NOT registered in `admin.js`. They are dead code.

---

## AUTH MIDDLEWARE VALIDATION

### `protect` middleware (`middleware/auth.js`)
- Validates JWT from `Authorization: Bearer <token>` header ✅
- Loads full user from DB on every request (no caching) — performance concern but correct ✅
- Checks `user.isActive` ✅
- Sets `req.user` ✅

### `requireRole` middleware
- Simple `roles.includes(req.user.role)` check ✅
- Returns 403 with message on failure ✅
- Admin routes: `router.use(protect, requireRole('admin'))` at top of admin.js ✅

### Payment Routes Auth
```js
// paymentRoutes.js
router.use(protect);                              // All routes authenticated
router.post('/create-order', requireRole('patient'));
router.post('/verify', requireRole('patient'));
router.post('/mark-cash-collected/:id', protect, markCashCollectedBooking); // ← double protect (harmless)
```
`mark-cash-collected` is called with `protect` twice (redundant but safe). The actual controller checks role internally: `req.user.role === 'admin'` OR provider owner OR partner.

### Issue W-004: `mark-cash-collected` allows both provider AND admin without `requireRole`
The authorization is done inside the controller, not via middleware. This means no standard audit of who can call it from route level. Not a security issue (controller checks correctly) but makes API access control harder to audit.

---

## NORMALIZED STATUS IN RESPONSES

### Booking Responses
`formatBookingResponse()` in `bookingController.js` adds:
```js
b.paymentStatusNormalized = normalizePaymentStatus(b.paymentStatus);
b.normalizedStatus = currentStatus.toUpperCase();
```
✅ Normalized fields added to all booking responses.

### Payment Responses
`Payment` model returns raw `status` (`'CREATED'`, `'SUCCESS'`, `'FAILED'`).
Frontend uses `normalizePaymentStatus()` from `constants/paymentStatus.js` — must be imported per component.

### Admin Stats Response
`getStats()` returns `pendingBookings` using multi-string match:
```js
{ $in: [BOOKING_STATUS.REQUESTED, 'pending', 'PENDING', 'REQUESTED'] }
```
This broad match ensures count works regardless of how status was stored historically. ✅

---

## FRONTEND → BACKEND WIRING MAP

| Frontend Call | Frontend File | Backend Route | Status |
|---|---|---|---|
| `adminService.getStats()` | Overview.jsx | `GET /api/admin/stats` | ✅ |
| `adminService.getDashboardSummary()` | RevenueDashboard.jsx | `GET /api/admin/dashboard/summary` | ✅ |
| `adminService.getDashboardRevenue()` | RevenueDashboard.jsx | `GET /api/admin/dashboard/revenue` | ✅ |
| `adminService.getTopProviders()` | RevenueDashboard.jsx | `GET /api/admin/dashboard/top-providers` | ✅ |
| `adminService.getDashboardBookings()` | RevenueDashboard.jsx | `GET /api/admin/dashboard/bookings` | ✅ |
| `adminService.setAdminPrice()` | Bookings.jsx | `PUT /api/admin/bookings/:id/set-price` | ✅ |
| `bookingService.getAll()` | Bookings.jsx | `GET /api/bookings` | ✅ |
| `bookingService.collectCash()` | ? | `POST /bookings/:id/collect-cash` | ❌ BROKEN |
| `reconciliationService.getSummary()` | Reconciliation.jsx | `GET /api/admin/reconciliation/summary` | ✅ |
| `reconciliationService.getPayments()` | Not used | `GET /api/admin/reconciliation/payments` | ✅ |
| `reconciliationService.getPayouts()` | Not used | `GET /api/admin/reconciliation/payouts` | ✅ |
| `reconciliationService.getFailures()` | Not used | `GET /api/admin/reconciliation/failures` | ✅ |
| `labService.getFinanceMetrics()` | FinanceOS.jsx | Unknown lab endpoint | ⚠️ Not in scope |

---

## STALE/MISSING ADMIN SERVICE CALLS

### In `adminService.js` but without frontend usage
- All reconciliation endpoints exist in `reconciliationService.js` but `getPayments()`, `getPayouts()`, `getFailures()` are NOT called from any visible frontend page
- "Open Payments" / "Open Payouts" buttons in `Reconciliation.jsx` navigate via `window.location.href` to routes that don't exist

### adminService.js Missing Methods (Required by Audit)
```js
// These methods should exist but don't:
getPendingPayments: (params) => api.get('/admin/payments/pending', { params })
getFailedPayments: (params) => api.get('/admin/payments/failed', { params })
getDisputes: (params) => api.get('/admin/disputes', { params })
resolveDispute: (id, data) => api.post(`/admin/disputes/${id}/resolve`, data)
getStuckBookings: (type) => api.get('/admin/stuck-bookings', { params: { type } })
getOperationalAlerts: () => api.get('/admin/bookings/operational-alerts')
syncPayment: (paymentId) => api.post(`/payment/sync/${paymentId}`)
```

---

## SEVERITY SUMMARY

| Issue | Description | Severity |
|---|---|---|
| W-001 | Duplicate payment route mount (/payment + /payments) | LOW |
| W-002 | bookingService.collectCash calls non-existent route | HIGH |
| W-003 | Route shadowing: labs before labs/reconciliation | LOW |
| W-004 | mark-cash-collected auth logic in controller not middleware | LOW |
| W-005 | Reconciliation report/fix endpoints not wired in admin.js | MEDIUM |
| W-006 | fixReconciliationIssue crashes — Payment not imported | CRITICAL |
| W-007 | Reconciliation "Open Payments/Payouts" routes don't exist | MEDIUM |
| W-008 | No adminService methods for disputes, stuck bookings, operational alerts | MEDIUM |

---

## RECOMMENDATIONS

1. **CRITICAL:** Fix missing `Payment` import in `adminController.js` or remove `fixReconciliationIssue`
2. **HIGH:** Fix `bookingService.collectCash` to call correct URL (`/api/payment/mark-cash-collected/:id`)
3. **MEDIUM:** Wire `getReconciliationReport` and `fixReconciliationIssue` to `admin.js` router (after fixing import)
4. **MEDIUM:** Add frontend routes for Reconciliation "Open Payments" and "Open Payouts" or remove buttons
5. **LOW:** Consolidate payment route mount to single prefix
