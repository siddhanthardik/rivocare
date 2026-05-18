# Provider Payout Resolution Validation

## Payout Mechanisms by Resolution Type

### 1. APPROVE_PROVIDER
- **Logic:** Admin agrees with the provider. The cash collected is deemed valid.
- **Payout:** Provider is credited `(collectedAmount || totalAmount) - platformFee`.
- **Status Outcome:** Booking becomes `PAID`, paymentStatus becomes `PAID`.
- **Provider View:** Earning reflects the full expected net amount.

### 2. REJECT_PROVIDER
- **Logic:** Admin agrees with the patient. The provider did not legitimately collect the cash, or a severe discrepancy exists.
- **Payout:** Zero wallet credit is issued.
- **Status Outcome:** Booking remains in `DISPUTED` payment status (but `disputeResolved = true`).
- **Provider View:** Booking does not reflect as paid.

### 3. PARTIAL_SETTLEMENT
- **Logic:** Admin determines a middle-ground settlement (e.g., patient paid less than expected, but provider still deserves partial compensation).
- **Payout:** Provider is credited exactly the `approvedAmount` input by the Admin. No automatic fee deduction is applied to the raw `approvedAmount`.
- **Status Outcome:** Booking becomes `PAID`, paymentStatus becomes `PAID`.
- **Provider View:** Earning reflects the specific partial settlement amount.

## Validation Criteria Met
- Provider is NEVER credited automatically during a dispute.
- Provider is NEVER credited more than the admin explicitly approves.
- The platform retains the exact historical reason (`adminNotes`) for any deviation from the standard pricing payout.
