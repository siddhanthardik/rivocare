Booking Status Audit

Summary of status normalization and checks applied:

- Current canonical statuses used by backend: `pending`, `confirmed`, `in-progress`, `completed`, `cancelled`.
- Frontend comparisons normalized to lowercase to avoid casing mismatches (frontend/src/pages/dashboard/provider/Bookings.jsx).
- Server-side strict transition validation implemented in `updateBookingStatus` to enforce correct flows:
  - Accept: `pending` -> `confirmed` only.
  - Start: `confirmed` -> `in-progress` only.
  - Complete: `in-progress` -> `completed` only.
- Added server-side logs for transition attempts and failures with context: bookingId, provider user id, previous/current status.

Recommendation:
- Run a short audit query to detect bookings with unexpected or mixed-case statuses and correct them if needed.
