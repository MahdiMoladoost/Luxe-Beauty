# Payment and Ledger

## Principles
- The platform's primary revenue is subscriptions, SMS packages, advertising, featured placement, campaigns, and platform services.
- Service commission infrastructure exists but defaults to zero and is versioned. New commission versions affect only new bookings.
- Provider service funds must not pass through a personal platform account without a legally and technically suitable marketplace/payment-facilitator structure.
- Until a real gateway is selected, all payment behavior runs through explicit mock/sandbox adapters. Mock status must be visible and must never be represented as real settlement.
- Money is integer tomans. Floating-point arithmetic is forbidden.

## Payment adapter
The provider port supports:
- create payment intent/attempt
- redirect or client action data
- verify callback/webhook signature
- fetch/verify transaction status
- full refund
- partial refund
- marketplace split/beneficiary metadata when supported
- reconciliation export/import
- idempotency and provider event identity

Implementations:
- `MockPaymentProvider` for development and tests.
- Future marketplace-capable provider adapter.
- Future provider-owned gateway adapter where a provider legally connects its own terminal/account.
- Platform-revenue gateway configuration isolated from service-payment configuration.

## Ledger model
Accounts include platform cash/clearing, provider payable, customer wallet liabilities, platform revenue, commissions, payment fees, refund clearing, dispute holds, adjustments, and settlement clearing.

A `LedgerTransaction` groups immutable `LedgerEntry` rows. Posted transactions must balance. Draft transactions are not included in balances. Corrections use reversing and replacement transactions; posted entries are never edited or deleted.

## Typical postings

### Successful platform subscription payment
- Debit: platform payment clearing/cash
- Credit: platform subscription revenue (or deferred revenue according to accounting policy)

### Successful service deposit/full payment
- Debit: marketplace/provider payment clearing
- Credit: provider payable or service funds held
- Credit/debit additional accounts only for explicit fees/commission/tax rules

### Refund
- Debit: relevant held/provider/platform liability or revenue-reversal account
- Credit: refund clearing/cash

### Customer wallet credit
- Debit: source account (refund clearing, marketing expense, compensation expense, referral expense)
- Credit: customer wallet liability account

### Settlement to provider
- Debit: provider payable
- Credit: settlement clearing/cash

## Holds and release
- Deposit funds become releasable after valid completion/no-show rules.
- Full service payment enters a hold until the provider marks completion and the default 24-hour dispute window expires.
- Opening a dispute creates or maintains a dispute hold.
- Provider cancellation/no-show leads to full customer refund and releases booking resources.
- Partial refund and partial provider payment require an auditable dispute/decision basis.

## Idempotency
Payment creation, provider callbacks, refunds, settlement batches, reconciliation imports, wallet credits, and ledger posting use unique idempotency keys. Duplicate callbacks return the previously stored result and do not post additional entries.

## Reconciliation
The system stores provider events and periodically compares payment attempts, successful payments, refunds, fees, settlements, and ledger totals. Differences create reconciliation items; they are never silently auto-corrected without a recorded policy or approved adjustment.

## Commission versioning
A commission policy may be scoped by provider type, plan, provider, service category, service, or campaign. The selected version and calculated amount are snapshotted on booking creation. Updates do not affect prior bookings.

## Controls
- Refund, settlement, payout account change, and manual adjustment require explicit permissions and recent 2FA/re-authentication.
- Material operations require maker/checker approval when configured.
- Every financial action has actor, reason, correlation ID, source resource, policy version, and before/after references.
- Balances shown in UI are queries over ledger entries or trusted materialized views, not mutable authoritative columns.

## Mock behavior
The mock gateway supports deterministic success, failure, timeout, duplicate callback, late callback, full refund, partial refund, settlement, and reconciliation scenarios for integration/E2E tests.
