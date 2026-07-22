# Booking State Machine

A Booking transition is valid only through an application service. Direct status mutation is forbidden. Every transition records actor, source state, destination state, reason, timestamp, correlation ID and safe metadata.

## Temporary Hold and durable allocation

`BookingHold` is a separate pre-booking aggregate with states:

- `ACTIVE`
- `CONSUMED`
- `EXPIRED`
- `RELEASED`

Creating a Hold does not create a Booking and does not imply payment or provider approval.

The Hold-to-Booking command is now implemented for one fixed-price Offering. In one Serializable transaction it:

1. locks and reloads the owning active Hold;
2. rejects elapsed, released or already consumed Holds;
3. validates Recipient ownership, questionnaire, audience/age rules, legal versions and current Offering eligibility;
4. creates Booking in `HOLDING_SLOT` and creates its BookingItem/snapshots;
5. records `null -> HOLDING_SLOT`;
6. records `HOLDING_SLOT -> CONFIRMED` for no-payment instant approval, or `HOLDING_SLOT -> AWAITING_PROVIDER_APPROVAL` for no-payment manual approval;
7. changes the Hold to `CONSUMED` with `consumedBookingId`;
8. writes Audit, Outbox and replayable Idempotency state.

The consumed Hold remains the authoritative resource allocation. PostgreSQL excludes overlaps for both `ACTIVE` and `CONSUMED` Holds, so no allocation gap opens during conversion.

Payment-required policies are explicitly rejected with `PAYMENT_FLOW_REQUIRED` until the payment and ledger path is implemented. See `docs/BOOKING_HOLDS.md` and `docs/HOLD_TO_BOOKING.md`.

## Booking states

- `DRAFT`
- `AWAITING_IDENTITY`
- `HOLDING_SLOT`
- `AWAITING_PAYMENT`
- `PAYMENT_PENDING`
- `AWAITING_PROVIDER_APPROVAL`
- `CONFIRMED`
- `REJECTED`
- `EXPIRED`
- `RESCHEDULE_PROPOSED`
- `RESCHEDULED`
- `CUSTOMER_CANCELLED`
- `PROVIDER_CANCELLED`
- `CHECKED_IN`
- `IN_SERVICE`
- `COMPLETED_BY_PROVIDER`
- `AWAITING_CUSTOMER_DISPUTE_WINDOW`
- `FINALIZED`
- `CUSTOMER_NO_SHOW`
- `PROVIDER_NO_SHOW`
- `DISPUTED`
- `REFUNDED`
- `PARTIALLY_REFUNDED`

## Primary path

```text
ACTIVE BookingHold
  -> Booking(HOLDING_SLOT) + BookingItem + BookingHold(CONSUMED)
HOLDING_SLOT
  -> AWAITING_PROVIDER_APPROVAL (manual approval, no online payment)
  -> CONFIRMED (instant approval, no online payment)
  -> AWAITING_PAYMENT (target path; not implemented yet)
AWAITING_PAYMENT
  -> PAYMENT_PENDING
  -> EXPIRED
PAYMENT_PENDING
  -> AWAITING_PROVIDER_APPROVAL
  -> CONFIRMED
  -> EXPIRED / REFUNDED
AWAITING_PROVIDER_APPROVAL
  -> CONFIRMED
  -> REJECTED
  -> EXPIRED
CONFIRMED
  -> CHECKED_IN
  -> RESCHEDULE_PROPOSED
  -> CUSTOMER_CANCELLED
  -> PROVIDER_CANCELLED
  -> CUSTOMER_NO_SHOW
  -> PROVIDER_NO_SHOW
CHECKED_IN -> IN_SERVICE
IN_SERVICE -> COMPLETED_BY_PROVIDER
COMPLETED_BY_PROVIDER -> AWAITING_CUSTOMER_DISPUTE_WINDOW
AWAITING_CUSTOMER_DISPUTE_WINDOW -> FINALIZED | DISPUTED
DISPUTED -> FINALIZED | REFUNDED | PARTIALLY_REFUNDED
```

Only the initial no-payment Hold conversion is operational. Later transitions shown above remain target contracts unless explicitly implemented elsewhere.

## Invariants

- A temporary Hold has a TTL and never outlives its Quote.
- Booking creation is idempotent and tied to the exact Hold, Recipient, Quote, price/duration/policy snapshots, questionnaire and accepted legal versions.
- The client cannot submit price, duration or final status.
- Current Offering, provider, branch, professional and affiliation eligibility are checked in the conversion transaction.
- A consumed allocation remains blocking until a future cancellation/reschedule workflow releases or swaps it atomically.
- Rejected/expired manual requests must release resources and release/refund money according to the snapshot; this workflow remains open.
- Rescheduling must hold the new resources before releasing the old allocation.
- Cancellation/no-show outcomes must use snapshotted policy versions, never current settings.
- Provider cancellation/no-show cannot retain customer funds.
- Funds remain held while a valid dispute is open.
- Terminal history is never deleted.

## Manual approval timing

The conversion command persists a bounded `approvalDeadlineAt`, limited by configured response time and minimum lead time before the appointment. Provider approve/reject APIs and the idempotent deadline-expiry worker remain open.

## Attendance and rescheduling targets

Attendance requires an expiring per-Booking challenge with rate limits and Audit. Rescheduling is proposal-based when bilateral acceptance is required and must recheck price, payment, availability, Recipient eligibility and policy versions.

## Required tests

- Every allowed and forbidden transition.
- Exact replay and changed-payload idempotency conflict.
- Stale Booking version.
- Expired Hold and approval deadline.
- Concurrent Hold conversion and double-booking race.
- Payment callback before/after expiry.
- Cancellation/refund/no-show boundaries.
- Reschedule rollback when new locking fails.
- Dispute-window finalization race.
