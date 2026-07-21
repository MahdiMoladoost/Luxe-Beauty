# Booking State Machine

A booking transition is valid only through the booking application service. Direct status mutation is forbidden. Every transition records actor, source state, destination state, reason, timestamp, version, correlation ID, and safe metadata.

## Temporary hold before Booking creation

`BookingHold` is a separate pre-booking aggregate. Its states are:

- `ACTIVE`
- `CONSUMED`
- `EXPIRED`
- `RELEASED`

Creating a Hold does not create a `Booking` and does not imply payment or provider approval. A future Hold-to-Booking command must atomically:

1. lock and reload the owning active Hold;
2. reject elapsed, released or already consumed Holds;
3. validate the accepted recipient, questionnaire, legal versions and current eligibility;
4. create the Booking and initial Booking item/snapshots;
5. transition the Hold to `CONSUMED` with `consumedBookingId`;
6. preserve the same resource lock so no gap opens between Hold and Booking occupancy.

The current implemented slice covers Hold creation/read/release/expiry only. See `docs/BOOKING_HOLDS.md`.

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

## Primary booking path

```text
DRAFT
  -> AWAITING_IDENTITY (identity incomplete)
  -> HOLDING_SLOT (identity and eligibility pass)
HOLDING_SLOT
  -> AWAITING_PAYMENT (online payment required)
  -> AWAITING_PROVIDER_APPROVAL (manual approval, no online payment required)
  -> CONFIRMED (instant approval, no online payment required)
AWAITING_PAYMENT
  -> PAYMENT_PENDING
  -> EXPIRED
PAYMENT_PENDING
  -> AWAITING_PROVIDER_APPROVAL (successful payment + manual approval)
  -> CONFIRMED (successful payment + instant approval)
  -> EXPIRED / REFUNDED (failed/expired according to payment state)
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
AWAITING_CUSTOMER_DISPUTE_WINDOW
  -> FINALIZED (window expires without dispute)
  -> DISPUTED
DISPUTED
  -> FINALIZED
  -> REFUNDED
  -> PARTIALLY_REFUNDED
```

## Invariants
- A slot hold has a TTL and cannot outlive its payment/provider-approval deadline.
- Booking creation is idempotent and tied to the exact hold, price snapshot, duration snapshot, recipient, policies, and accepted legal versions.
- Confirmation succeeds only if professional, branch, resources, buffers, travel, subscription, verification, and document eligibility remain valid in the same transaction.
- A rejected or expired manual request releases resources and releases/refunds money according to the payment snapshot.
- Rescheduling is proposal-based when bilateral acceptance is required; old resources are not released until new resources are safely held, then changes occur transactionally.
- Cancellation/no-show transitions calculate policy outcome from the snapshotted accepted policy, never current settings.
- Provider cancellation/no-show cannot retain customer funds.
- Completing a service starts the configured dispute window (default 24 hours).
- Funds remain held while a valid dispute is open.
- Terminal history is never deleted.

## Manual approval timing
The platform configures allowed response bounds; suggested range is 15 minutes to 2 hours, shortened for near-term appointments. The customer sees the deadline. Expiry is performed by an idempotent scheduled job.

## Attendance challenge
An expiring per-booking one-time code is generated near the appointment. Failed attempts are rate-limited and audited. Fallback confirmation by customer or support requires reason and audit evidence.

## Rescheduling
- First customer reschedule may be free within the configured window.
- Later or late reschedules follow provider approval and cancellation-cost rules.
- Price, discount, payment, availability, recipient eligibility, and policy validity are rechecked.
- All proposals and decisions remain in history.

## Required tests
- Every allowed transition.
- Every forbidden transition.
- Duplicate/idempotent transition requests.
- Stale booking version.
- Expired hold and approval deadline.
- Double-booking race.
- Payment callback before/after expiry.
- Cancellation/refund/no-show policy boundaries.
- Reschedule rollback when new locking fails.
- Dispute-window finalization race.
