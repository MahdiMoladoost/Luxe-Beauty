# Transactional Booking Holds

## Status

This is the first Phase 6 booking vertical slice. It creates, reads and releases temporary slot holds. It does not yet convert a hold into a Booking, create a payment, apply cancellation rules or complete the full booking state machine. The newest commits remain pending a fresh CI run.

## Contract

### Create

`POST /api/v1/booking-holds`

Required:

- authenticated customer;
- `identityStatus=VERIFIED`;
- same-origin mutation request;
- `Idempotency-Key` header, 8–160 safe characters;
- body `{ "quoteId": "uuid", "startsAt": "ISO-8601 with offset" }`.

The Quote must:

- exist and be unexpired;
- belong to the customer or be a guest Quote;
- contain a valid immutable schema-v1 snapshot;
- be final and directly bookable;
- use the initial supported `FIXED` price model;
- still match the current Offering ID, provider, branch, professional and version;
- match its stored total and occupied duration.

The selected time must:

- be in the future and within `BOOKING_MAX_ADVANCE_DAYS`;
- fit completely inside a weekly or temporary `AVAILABLE` window;
- not cross a `CLOSED` exception;
- not overlap an active Booking item;
- not overlap another unexpired active Hold.

A newly created Hold expires after `BOOKING_HOLD_TTL_SECONDS`, default 420 seconds.

### Read

`GET /api/v1/booking-holds/{holdId}`

Only the owning customer can read a Hold. Cross-customer IDs return not found. An elapsed active Hold is atomically marked `EXPIRED` before returning.

### Release

`DELETE /api/v1/booking-holds/{holdId}`

Only the owning customer can release a Hold. Releasing an active Hold changes it to `RELEASED` and frees the interval. Releasing an already terminal Hold is idempotent and returns the current state.

## Idempotency

The scope is per customer and command: `booking-hold:create:{customerUserId}`.

The application:

1. obtains a PostgreSQL advisory transaction lock for the scope/key;
2. compares a SHA-256 request hash derived from Quote ID and normalized start timestamp;
3. returns the existing Hold for an exact replay;
4. returns `IDEMPOTENCY_CONFLICT` if the same key is reused with a different payload;
5. persists the `IdempotencyRecord`, Hold and response atomically in one Serializable transaction.

Invalid Quote/time requests do not leave an incomplete idempotency record.

## Concurrency and double-booking protection

PostgreSQL is authoritative.

For each command the repository:

1. starts a Serializable transaction;
2. obtains a resource advisory lock using the stable professional calendar when a professional is assigned, otherwise the branch calendar;
3. marks elapsed active Holds for the resource as expired;
4. reloads schedule rules, exceptions, blocking Booking items and unexpired Holds;
5. verifies the selected interval;
6. inserts the Hold.

The database also has a partial GiST exclusion constraint over active Hold resource/range values. This is a second line of defense if application-level conflict checks are bypassed.

Professional resource IDs are stable across every salon affiliation, so concurrent requests at two salons compete for the same lock and exclusion range.

Serializable retry failures return `BOOKING_CONCURRENCY_RETRY`. A direct slot conflict returns `SLOT_NOT_AVAILABLE`.

## Expiry worker

The BullMQ worker registers the `booking-hold-expiry` Job Scheduler and generates `booking.holds.expire` jobs every minute. Each run processes up to 500 elapsed active Holds and records:

- status change to `EXPIRED`;
- system Audit Log;
- deduplicated Outbox event.

The creation/read paths also expire relevant rows lazily. Worker delay or downtime therefore does not make an expired Hold valid.

## Audit and outbox

Creation, release and expiry are audited. Creation and worker expiry emit deduplicated Outbox events. No mobile, national ID, raw address or credential is included in Hold event payloads.

## Database invariants

Migration `20260721020000_booking_holds` adds:

- `BookingHoldStatus`;
- `BookingHold` with Quote/Offering/provider/branch/professional/customer foreign keys;
- positive service and occupied ranges;
- service interval contained in occupied interval;
- expiry after creation;
- resource target consistency;
- customer/idempotency uniqueness;
- active-resource GiST overlap exclusion;
- operational indexes.

The migration requires the PostgreSQL `btree_gist` extension. Deployment roles must be permitted to install it, or operations must install the extension before migration deployment.

## Explicit remaining work

- Hold-to-Booking conversion and consumed state;
- booking recipient selection and questionnaire validation;
- multiple services, resources, travel and contiguous availability;
- provider instant/manual approval and deadline jobs;
- deposit calculation, mock payment, callbacks and ledger posting;
- confirmed Booking overlap constraints and rescheduling locks;
- cancellation, delay, no-show, attendance and dispute workflows;
- waitlist and alternatives;
- Redis acceleration and queue health UI;
- fresh CI, E2E, runtime concurrency load and failure-injection testing.
