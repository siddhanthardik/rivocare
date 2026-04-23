# Booking Contract

This project treats the backend booking API as the source of truth for both web and mobile clients.

## Canonical status values

- `pending`
- `confirmed`
- `in-progress`
- `completed`
- `cancelled`

## Create booking payload

`POST /api/bookings`

Required fields:

- `providerId`
- `service`
- `address`
- `pincode`
- `scheduledAt`

Optional fields:

- `durationHours`
- `notes`

Example:

```json
{
  "providerId": "providerObjectId",
  "service": "nurse",
  "address": "221B Baker Street",
  "pincode": "400001",
  "scheduledAt": "2026-04-20T09:00:00.000Z",
  "durationHours": 2,
  "notes": "Please bring a BP monitor"
}
```

## Status update payload

`PUT /api/bookings/:id/status`

```json
{
  "status": "confirmed"
}
```

Clients must send lowercase canonical values only.

## Response shape used by clients

Booking list/detail responses expose:

- `patient`
- `provider`
- `provider.user`
- `scheduledAt`
- `durationHours`
- `status`
- `address`
- `pincode`
- `totalAmount`

Patients should read provider names from `booking.provider.user.name`.

Providers should read patient names from `booking.patient.name`.

Do not build alternate booking schemas in mobile or web unless the backend contract changes first.
