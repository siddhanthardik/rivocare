Test Data Cleanup Report

Script: `scripts/resetTestBookings.js`
- Purpose: safely remove stale or test bookings while preserving users, providers, services, pricing, invoices, and payments.
- Behavior: dry-run by default. Print summary of found candidate bookings (sample list). Must pass `--confirm` to delete.
- Deletes:
  - Bookings matching safe criteria (pending/in-progress + older than 30 days OR notes containing test/staging markers OR orderId includes TEST), and bookings explicitly flagged with `TEST_DATA` or `ABANDONED_TEST`.
  - Notifications (`linkId`) and Transactions referencing deleted bookings.
- Safety: prints samples before deletion; conservative criteria to avoid accidental deletion of real bookings.

How to run (dry-run):

  node scripts/resetTestBookings.js

To execute deletion (irreversible):

  node scripts/resetTestBookings.js --confirm

