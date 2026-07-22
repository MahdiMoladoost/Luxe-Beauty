# Atomic Hold-to-Booking Conversion

## Status

This Phase 6 vertical slice converts one active `BookingHold` into one persisted `Booking` and `BookingItem`. The newest commits remain pending a fresh CI run. Payment, cancellation, rescheduling, attendance and dispute workflows are not part of this slice.

## API contracts

### Service recipients

- `GET /api/v1/booking-recipients`
  - returns only non-deleted recipients owned by the authenticated customer.
- `POST /api/v1/booking-recipients`
  - same-origin authenticated mutation;
  - stores normalized Persian names, optional date of birth, controlled gender code, relation label, normalized Iranian mobile and accessibility notes;
  - writes an Audit Log.

### Create booking from hold

`POST /api/v1/bookings`

Required header:

- `Idempotency-Key`: 8–160 safe characters.

Required body:

```json
{
  "holdId": "uuid",
  "recipientId": "uuid",
  "legalAcceptance": {
    "termsVersion": "published-version",
    "privacyVersion": "published-version",
    "bookingVersion": "published-version"
  },
  "questionnaireAnswers": {
    "question-key": "answer"
  }
}
```

Required conditions:

- authenticated customer with `identityStatus=VERIFIED`;
- active, unexpired Hold owned by the customer;
- Recipient owned by the same customer;
- current server-controlled legal versions;
- complete immutable Quote/Hold snapshot;
- current Offering/provider/branch/professional eligibility;
- active professional affiliation when the professional is not the provider owner;
- audience, age and required-questionnaire eligibility;
- no online/deposit/prepaid requirement in this initial no-payment conversion path.

### Read booking

`GET /api/v1/bookings/{bookingId}`

Only the owning customer can read the Booking. Cross-customer IDs return `BOOKING_NOT_FOUND`.

## Transaction sequence

The command runs in one PostgreSQL Serializable transaction:

1. lock the customer/idempotency scope;
2. replay the completed response or reject a changed payload;
3. lock the Hold ID;
4. verify Hold ownership, state and expiry;
5. parse and compare the immutable Hold/Quote snapshot;
6. verify Recipient ownership;
7. verify current Quote and Offering state;
8. verify active professional affiliation when required;
9. lock the stable professional or branch resource;
10. validate audience, age, questionnaire and legal acceptance;
11. derive instant or manual approval from the snapshotted policy;
12. persist the idempotency record;
13. create a `Booking` in `HOLDING_SLOT`;
14. create the `BookingItem` with price and duration snapshots;
15. record `null -> HOLDING_SLOT` and `HOLDING_SLOT -> final state` transitions;
16. update Booking to `CONFIRMED` or `AWAITING_PROVIDER_APPROVAL`;
17. update Hold to `CONSUMED` and attach `consumedBookingId`;
18. write Audit and Outbox records;
19. persist the replayable response.

Any failure rolls back every write, including idempotency state.

## No-gap allocation invariant

The consumed Hold remains the authoritative resource allocation for the Booking. Migration `20260722010000_hold_to_booking` changes the GiST exclusion predicate from only `ACTIVE` Holds to both `ACTIVE` and `CONSUMED` Holds.

The same transaction creates the Booking/BookingItem and changes the allocation from `ACTIVE` to `CONSUMED`; therefore no interval exists where another transaction can reserve the resource between Hold and Booking.

A future cancellation or accepted reschedule workflow may move the consumed allocation to `RELEASED` only after its own state and financial rules succeed atomically.

## Pricing and snapshots

The client never supplies price or duration. The command verifies and copies:

- Quote ID and expiry;
- Offering ID, version, provider, branch and professional;
- standard service and display title;
- fixed-price model;
- quantity, unit price and total integer tomans;
- service and occupied duration formula;
- audience, booking and pricing rules;
- questionnaire answers;
- legal versions and server acceptance timestamp.

Booking money constraints enforce non-negative integer toman values and the total equation in PostgreSQL.

## Approval decision

- `approval=INSTANT` and no payment requirement -> `CONFIRMED`.
- `approval=MANUAL` and no payment requirement -> `AWAITING_PROVIDER_APPROVAL` with a bounded deadline.
- online, deposit or prepaid policies -> `PAYMENT_FLOW_REQUIRED`; no Booking is created.
- manual appointments without enough provider-response lead time are rejected.

The provider approval/rejection APIs and deadline-expiry worker are still open.

## Idempotency

The scope is `booking:create:{customerUserId}`. The SHA-256 request hash includes customer, Hold, Recipient, accepted legal versions and canonical questionnaire answers.

- exact replay returns the same Booking;
- same key with changed payload returns `IDEMPOTENCY_CONFLICT`;
- another key cannot consume an already consumed Hold;
- invalid requests do not leave incomplete idempotency rows.

## Database invariants

Migration `20260722010000_hold_to_booking` adds:

- unique `BookingHold.consumedBookingId`;
- Hold consumption-state consistency;
- GiST overlap exclusion for `ACTIVE` and `CONSUMED` allocations;
- Booking currency, amount equation and version checks;
- BookingItem service/occupied range, amount, quantity and travel checks.

## Tests in this slice

- legal-version validation;
- audience, age and required-questionnaire validation;
- instant/manual decision and payment-required rejection;
- stable canonical idempotency hash;
- Recipient + Hold -> confirmed Booking;
- manual-approval Booking and deadline;
- exact replay;
- cross-customer Booking IDOR;
- already-consumed Hold rejection;
- concurrent conversion race;
- expired Hold rejection and zero Booking creation.

## Explicit remaining work

- provider approve/reject commands and approval-deadline expiry;
- payment-required Hold conversion, mock payment and ledger posting;
- cancellation/refund/no-show policy engine;
- reschedule proposal and atomic allocation swap;
- travel/resource/multi-service allocation;
- guardian workflow and richer questionnaire definitions;
- legal-content CMS/version publication instead of environment identifiers;
- notifications, SMS and customer/provider panels;
- fresh CI, E2E, load and failure-injection tests.
