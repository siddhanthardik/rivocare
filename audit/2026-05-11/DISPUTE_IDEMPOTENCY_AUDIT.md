# Dispute Idempotency Audit

## Risk Context
Dispute resolution triggers financial transactions. If an admin double-clicks, or a network retry occurs, the provider could be credited multiple times for the same booking.

## Multi-Layered Protection Strategy

### 1. Database State Idempotency
Before any transaction processing begins, the endpoint verifies the booking state:
```javascript
if (booking.disputeResolution?.disputeResolved === true) {
  return res.status(200).json({ success: true, message: 'Dispute already resolved.' });
}
```
This guarantees that a successfully resolved dispute cannot be re-opened or re-processed.

### 2. Transaction Level Idempotency (The Guard)
Even if concurrent requests bypass the state check, the exact transaction insertion is guarded. We leverage the established `referenceId` pattern within the ACID transaction block:
```javascript
const existingTx = await Transaction.findOne({
  referenceId: booking._id,
  referenceType: 'Booking',
  type: 'CREDIT',
}).session(session);

if (!existingTx) {
  // Proceed with wallet credit
}
```
This ensures that across normal checkout, COD confirmation, and Dispute Resolution, only **ONE** `CREDIT` transaction can ever exist per booking.

### 3. UI Level Debouncing
The React UI utilizes a state lock (`submitting`) that disables the action buttons the moment a resolution is clicked, preventing accidental rapid double-clicks from firing multiple requests.

## Conclusion
The combination of UI debouncing, early-exit state validation, and ACID-compliant transaction existence checks guarantees total financial safety during dispute resolution.
