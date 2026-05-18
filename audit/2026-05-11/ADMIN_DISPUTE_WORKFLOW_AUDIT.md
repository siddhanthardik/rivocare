# Admin Dispute Workflow Audit

## Workflow Lifecycle
The dispute resolution workflow operates strictly on bookings currently in the `COLLECTED` status with a `DISPUTED` payment status.

1. **Detection:** Patient clicks "Report Issue" on the confirmation screen. Booking is marked `disputeRaised = true`.
2. **Surfacing:** Admin Dispute Dashboard (`/dashboard/admin/disputes`) queries all unresolved disputes.
3. **Investigation:** Admin reviews Patient Report versus Provider Claimed amount, contacts parties offline if necessary.
4. **Resolution Input:** Admin selects one of three resolution types, inputs mandatory notes and optional partial amount.
5. **Execution:** System atomically updates the Booking, fires Wallet credits if applicable, and writes the `disputeResolution` audit log.
6. **Notification:** Patient and Provider receive explicit alerts detailing the outcome.
7. **Archival:** Dispute moves to the "Resolved" tab for historical reference.

## Safety Constraints
- **Admin-Only:** Only users with `role: 'admin'` can access the resolution endpoint.
- **Irreversibility:** Once a dispute is resolved (`disputeResolved: true`), the endpoint rejects any subsequent resolution attempts.
- **Value Bounds:** `PARTIAL_SETTLEMENT` strictly enforces `approvedAmount > 0` and UI limits it to the maximum collected amount.
- **No Escrow:** We do not implement complex ledger clawbacks; resolution dictates the final immediate credit.
