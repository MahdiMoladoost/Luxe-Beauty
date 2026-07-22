# Transactional Booking Holds

## Status

This Phase 6 slice creates, reads and releases temporary slot Holds. A second implemented slice now converts one active fixed-price Hold into a Booking atomically; see `docs/HOLD_TO_BOOKING.md`. Newest commits remain pending fresh CI.

## Create contract

`POST /api/v1/booking-holds`

Required:

- authenticated customer with `identityStatus=VERIFIED`;
- same-origin mutation;
- `Idempotency-Key`, 8–160 safe characters;
- body `{ "quoteId": "uuid", "startsAt": "ISO-8601 with offset" }`.

The Quote must exist, be unexpired, belong to the customer or be guest-owned, contain a valid immutable snapshot, be final/directly bookable with fixed pricing, and still match current Offering/provider/branch/professional/version, amount and duration.

The selected interval must be future, within the advance window, completely inside an available schedule window, outside closed exceptions, and non-overlapping with blocking Booking allocations or active Holds.

A new Hold expires after the configured TTL, but never after its Quote.

## Read and release

- `GET /api/v1/booking-holds/{holdId}` is owner-only and lazily expires elapsed active Holds.
- `DELETE /api/v1/booking-holds/{holdId}` is owner-only and moves an active temporary Hold to `RELEASED`. Terminal release is idempotent.

A `CONSUMED` Hold belongs to an existing Booking and cannot be manually released through this temporary-Hold endpoint. Future cancellation/reschedule workflows control release of consumed allocations.

## Idempotency

Scope: `booking-hold:create:{customerUserId}`.

1. lock scope/key with a PostgreSQL advisory transaction lock;
2. compare a SHA-256 hash of Quote ID and normalized start time;
3. return existing Hold for exact replay;
4. return `IDEMPOTENCY_CONFLICT` for changed payload;
5. persist Idempotency, Hold and response atomically.

Invalid requests leave no incomplete idempotency record.

## Concurrency

PostgreSQL is authoritative. A Serializable transaction locks the stable professional calendar or branch calendar, expires elapsed Holds, reloads schedules/exceptions/Booking intervals/Holds, verifies the interval and inserts the Hold.

The database has a GiST exclusion constraint. After Hold-to-Booking support, the predicate covers both `ACTIVE` and `CONSUMED`, making the consumed Hold the durable Booking allocation and preventing a gap during conversion.

Professional IDs are stable across salon affiliations, so requests at different salons compete for the same lock and range.

## Expiry worker

The BullMQ Job Scheduler creates `booking.holds.expire` jobs every minute. Each run processes a bounded batch and writes status, system Audit and deduplicated Outbox events. Create/read paths also expire relevant rows lazily, so correctness does not depend only on Worker availability.

## Privacy and events

Create, release and expiry are audited. Event payloads exclude mobile, national ID, raw address and credentials.

## Database invariants

Migrations add:

- `BookingHoldStatus` and foreign keys;
- valid service/occupied ranges;
- service range inside occupied range;
- expiry after creation;
- resource target consistency;
- per-customer idempotency uniqueness;
- one-to-one consumed Booking reference;
- state/consumption consistency;
- GiST overlap exclusion for active and consumed allocations;
- operational indexes.

`btree_gist` must be available to the migration role or preinstalled.

## Explicit remaining work

- payment-required conversion, mock payment and ledger;
- provider approve/reject and approval expiry;
- multiple services, resources, capacity and travel;
- cancellation/refund/no-show;
- reschedule allocation swap;
- attendance/dispute;
- waitlist and alternatives;
- fresh CI, E2E, load and failure-injection tests.
