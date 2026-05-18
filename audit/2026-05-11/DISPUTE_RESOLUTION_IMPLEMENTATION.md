# Dispute Resolution Implementation

## Overview
Phase 2 of the COD Hold Flow hardening introduces a robust Admin Dispute Resolution System. This system allows administrators to manually resolve Cash-on-Delivery payment disputes raised by patients, ensuring accurate provider payouts and maintaining a complete audit trail.

## API Additions
1. **POST `/api/admin/disputes/:id/resolve`**
   - Main resolution endpoint supporting three modes:
     - `APPROVE_PROVIDER`: Credits provider full amount, marks booking `PAID`.
     - `REJECT_PROVIDER`: No payout, marks dispute resolved but leaves payment status as `DISPUTED`.
     - `PARTIAL_SETTLEMENT`: Credits provider an `approvedAmount`, marks booking `PAID`.
   - Includes full idempotency checks to prevent duplicate wallet credits.
   - Requires `adminNotes`.
   - Dispatches resolution notifications to patient and provider.

2. **GET `/api/admin/disputes/resolved`**
   - Retrieves paginated list of historically resolved disputes, sorted by resolution date.

## Database Schema Changes
**`Booking` Model updates:**
- Expanded `status` enum to include canonical `COLLECTED` and `PAID`.
- Expanded `paymentStatus` enum to include `PENDING_CONFIRMATION` and `DISPUTED`.
- Added `disputeResolution` embedded document:
  ```javascript
  disputeResolution: {
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
    resolutionType: {
      type: String,
      enum: ['APPROVE_PROVIDER', 'REJECT_PROVIDER', 'PARTIAL_SETTLEMENT'],
    },
    adminNotes: { type: String, maxlength: 1000 },
    approvedAmount: { type: Number, min: 0 },
    originalCollectedAmount: { type: Number, min: 0 },
    disputeResolved: { type: Boolean, default: false },
  }
  ```

## UI Changes
**`frontend/src/pages/dashboard/admin/Disputes.jsx` rewritten:**
- Tabbed interface separating "Open Disputes" and "Resolved".
- Open Dispute Cards include expandable Resolution Panels with three distinct actions (Approve, Partial, Reject) requiring explicit confirmation clicks.
- Captures Admin Notes and Partial Approval Amount directly in the UI.
- Resolved Dispute Cards show a compressed view with complete audit trail details.
- Active KPI counters tracking open vs resolved dispute totals.
