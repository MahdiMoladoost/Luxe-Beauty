# Provider Booking Approval and Deadline Expiry

## Status

This Phase 6 vertical slice implements provider-owner approval and rejection for no-payment bookings in `AWAITING_PROVIDER_APPROVAL`, plus scheduled expiry after the snapshotted response deadline. The newest commits remain pending a fresh CI run.

Payment-backed provider decisions, delegated provider staff, notifications and refund handling remain open.

## API contracts

### Approve

`POST /api/v1/bookings/{bookingId}/provider-approve`

Required header:

- `Idempotency-Key`: 8–160 safe characters.

Body:

```json
{
  "expectedVersion": 1
}
```

### Reject

`POST /api/v1/bookings/{bookingId}/provider-reject`

Required header:

- `Idempotency-Key`: 8–160 safe characters.

Body:

```json
{
  "expectedVersion": 1,
  "reasonCode": "PROFESSIONAL_UNAVAILABLE",
  "reason": "متخصص در این بازه امکان ارائه خدمت ندارد."
}
```

Controlled rejection codes:

- `SERVICE_UNAVAILABLE`
- `PROFESSIONAL_UNAVAILABLE`
- `BRANCH_UNAVAILABLE`
- `CUSTOMER_REQUEST`
- `POLICY_CONFLICT`
- `OTHER`

A normalized reason of 5–500 characters is required for rejection.

## Authorization and privacy

The current bounded implementation authorizes only `ProviderOrganization.ownerUserId`. A booking owned by another provider returns `BOOKING_NOT_FOUND`; the API does not reveal cross-provider existence.

Delegated provider managers, branch staff and professional-scoped ABAC remain open. The response includes only the operational recipient identity required for the appointment and does not expose customer mobile, national ID, address or private questionnaire content.

## Transaction sequence

Each decision runs in one PostgreSQL Serializable transaction:

1. lock the provider-user/idempotency scope;
2. replay an exact completed command or reject a changed payload;
3. lock the Booking ID;
4. reload the Booking through provider ownership;
5. reject payment-linked bookings from this no-payment path;
6. verify the consumed BookingHold allocation;
7. validate status, deadline and `expectedVersion`;
8. for approval, revalidate provider, branch, Offering, standard service, professional and active affiliation eligibility;
9. update Booking from `AWAITING_PROVIDER_APPROVAL`;
10. preserve the allocation for approval or release it for rejection;
11. write the BookingTransition, Audit Log and Outbox event;
12. persist the replayable idempotent response.

Any failure rolls back every write.

## State behavior

### Approval

`AWAITING_PROVIDER_APPROVAL -> CONFIRMED`

- Booking version increments atomically.
- Provider must still be approved, booking-enabled and undeleted.
- The assigned branch must still be active.
- Every Booking item must still reference an active/published Offering and active standard service.
- Any assigned professional must remain active, verified and actively affiliated unless they are the provider owner.
- Failed revalidation returns `BOOKING_APPROVAL_ELIGIBILITY_FAILED` without changing Booking or allocation.
- The consumed Hold remains `CONSUMED` and continues to protect the interval.
- Transition reason is `PROVIDER_APPROVED`.

### Rejection

`AWAITING_PROVIDER_APPROVAL -> REJECTED`

- A controlled reason code and explanatory text are stored.
- Booking version increments atomically.
- The consumed Hold changes to `RELEASED` with `releasedAt`.
- Rejection remains available when operational eligibility has failed, so an unusable pending Booking can still release its interval safely.
- `REJECTED` is not a blocking Availability status, so the interval can be offered again.

### Late provider command

A provider command after `approvalDeadlineAt` cannot approve or reject the Booking. The same locked transaction changes the Booking to `EXPIRED`, releases the allocation, writes system transition/audit/outbox evidence and returns `APPROVAL_DEADLINE_EXPIRED`.

Deadline validation precedes optimistic-version validation so a stale client can never keep an elapsed Booking pending.

## Idempotency and concurrency

The idempotency scope is:

`booking:provider-decision:{providerOwnerUserId}`

The SHA-256 request hash includes provider user, Booking ID, action, expected version and normalized rejection reason.

- exact replay returns the same final Booking;
- changed payload with the same key returns `IDEMPOTENCY_CONFLICT`;
- invalid commands do not leave incomplete idempotency rows;
- a Booking advisory lock serializes provider decisions and scheduled expiry;
- `expectedVersion` prevents lost updates;
- serialization/uniqueness conflicts return `BOOKING_CONCURRENCY_RETRY`.

## Scheduled expiry worker

BullMQ registers `provider-booking-approval-expiry` and produces `booking.provider-approvals.expire` once per minute.

For each overdue candidate, the worker:

1. obtains the same Booking advisory lock used by the API;
2. reloads status and deadline;
3. refuses automatic financial mutation when any Payment exists;
4. verifies the `CONSUMED` allocation;
5. changes Booking to `EXPIRED` and increments version;
6. releases the allocation;
7. writes system Transition, Audit and deduplicated Outbox records.

Jobs use retry with exponential backoff. The operation is idempotent because only overdue `AWAITING_PROVIDER_APPROVAL` bookings are eligible and Outbox uses a stable dedupe key.

Payment-blocked or allocation-invalid records are counted but not mutated. Operations monitoring and escalation for these counters remain open.

## Database support

Migration `20260722020000_provider_booking_approval` adds an operational index over Booking status, approval deadline and ID for bounded expiry scans.

The existing Hold allocation constraint remains authoritative:

- `CONSUMED` continues to block overlapping allocations;
- `RELEASED` no longer participates in the GiST exclusion predicate.

## Tests in this slice

- current approval;
- controlled rejection reasons;
- expired deadline priority;
- stale version and non-pending state;
- stable request hash;
- provider-owner approval and exact replay;
- changed-payload idempotency conflict;
- provider rejection and allocation release;
- cross-provider IDOR;
- approval eligibility revalidation with rejection fallback;
- concurrent approve/reject race;
- late command expiry;
- scheduled worker expiry scoped to the target Booking.

## Explicit remaining work

- delegated provider/branch/professional ABAC;
- provider pending-booking list and operational panel;
- payment-backed approval/rejection and refund orchestration;
- SMS/in-app notification delivery and retry reports;
- customer cancellation, rescheduling, no-show and attendance;
- queue dashboard and blocked-record escalation;
- fresh CI, E2E, load and failure-injection tests.
