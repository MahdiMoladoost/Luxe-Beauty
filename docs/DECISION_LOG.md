# Decision Log

Accepted requirements are not changed or removed without an entry here. New technical decisions use the heading «تصمیم تخصصی افزوده‌شده» as required by the project brief.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Modular monolith
**Status:** Accepted

Use a feature/domain-oriented modular monolith before considering services. This keeps transactions for Booking and ledger reliable while preserving extraction boundaries.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: PostgreSQL is the booking authority
**Status:** Accepted

PostgreSQL transactions, constraints and locks are authoritative for availability and double-booking prevention. Redis locks may reduce contention but can never be the sole correctness mechanism.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Immutable policy and price snapshots
**Status:** Accepted

Bookings retain selected services, prices, duration, questionnaire answers, commission, cancellation, delay, payment and legal-acceptance snapshots. New configuration versions affect new workflows only.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Ledger-derived money
**Status:** Accepted

Customer wallet, provider payable, platform revenue, holds, refunds and settlements derive from immutable balanced ledger entries. Mutable balance columns may be caches only and are never authoritative.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: External integration modes are explicit
**Status:** Accepted

KYC, payment, SMS, maps, storage and malware scanning use ports/adapters. Development mocks are labelled and queryable; no mock response may be described as production verification, payment, delivery or mapping.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: One professional calendar across affiliations
**Status:** Accepted

Professional identity and schedule conflicts persist across every salon, branch and independent location. Affiliation changes do not erase ratings or Booking history.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Private location disclosure
**Status:** Accepted

Exact customer and home-studio addresses are private. Search and pre-confirmation use approximate geography. Exact details are released only to authorized Booking participants at the valid stage and all sensitive access is audited.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Preserve generic UI, replace business prototypes
**Status:** Accepted

Reviewed generic UI primitives and useful design utilities may remain. Current admin/customer/provider business pages are replacement targets because they use client-only state and hardcoded data.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Early draft PR
**Status:** Accepted

Open a Draft PR after phase-zero foundations so progress, commits, CI and limitations are continuously visible. It is never merged without explicit owner instruction.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Versioned scrypt password KDF
**Status:** Accepted

Use Node.js scrypt with random salt, environment pepper and encoded algorithm/version/parameters, preserving a future Argon2id migration path. Passwords and pepper values are never logged or seeded.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Development OTP observability without production leakage
**Status:** Accepted

The mock SMS adapter may return OTP to the development UI only outside production with `SMS_PROVIDER=mock`. It never logs the OTP and refuses production use.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Authentication state is PostgreSQL-authoritative
**Status:** Accepted

OTP challenges, cooldowns, rate limits, credentials, sessions, expiry, revocation and RBAC assignments are stored in PostgreSQL. Redis may accelerate but cannot be the only correctness authority.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Multi-file Prisma schema by domain
**Status:** Accepted

Prisma reads the `prisma` directory as one schema. Domain files can be separated gradually while committed SQL migrations remain the deployment source of truth.

## 2026-07-21 — تصمیم تخصصی افزوده‌شده: Stable professional identity before affiliations
**Status:** Accepted

A professional has one user-linked `ProfessionalProfile` that survives salon and provider-mode changes. Affiliations reference the stable profile rather than creating duplicate identities.

## 2026-07-21 — تصمیم تخصصی افزوده‌شده: Bilateral affiliation activation and termination
**Status:** Accepted

Provider-professional relationships activate only after counterparty acceptance. Ending an active relationship also requires a request and counterparty response. Serializable transactions and Audit preserve history. Provider authority stays owner-only until scoped ABAC exists.

## 2026-07-21 — تصمیم تخصصی افزوده‌شده: Final and indicative prices are distinct
**Status:** Accepted

Only a server-calculated fixed Quote is final/directly bookable in the initial slice. Starting/range values are explicit estimates and consultation never invents a price. Every Quote stores Offering version and calculation snapshot.

## 2026-07-21 — تصمیم تخصصی افزوده‌شده: Professional calendar takes precedence
**Status:** Accepted

An Offering assigned to a professional always resolves availability through the stable professional calendar. Branch calendar is used only without an assigned professional.

## 2026-07-22 — تصمیم تخصصی افزوده‌شده: Consumed Hold is the durable Booking allocation
**Status:** Accepted

Hold-to-Booking conversion must not temporarily release the resource. The same Serializable transaction creates Booking/BookingItem and changes `BookingHold` from `ACTIVE` to `CONSUMED`. A PostgreSQL GiST exclusion constraint covers both statuses, so another transaction cannot reserve the interval during or after conversion. Future cancellation and accepted rescheduling may change the consumed allocation to `RELEASED` only after their state and financial operations succeed atomically.

## 2026-07-22 — تصمیم تخصصی افزوده‌شده: Payment-required Booking cannot bypass finance
**Status:** Accepted

The initial conversion supports only no-payment instant/manual policies. Online, deposit and prepaid policies return `PAYMENT_FLOW_REQUIRED`; they do not create a confirmed or approval-pending Booking until mock payment, callbacks and ledger posting exist.

## 2026-07-22 — تصمیم تخصصی افزوده‌شده: Provider decisions and deadline expiry share one Booking lock
**Status:** Accepted

Provider approval, provider rejection, late provider commands and the scheduled approval-expiry worker use the same PostgreSQL advisory lock for a Booking. Approval revalidates current provider, branch, Offering, standard service, professional and affiliation eligibility and preserves the consumed allocation. Rejection and no-payment deadline expiry change the allocation to `RELEASED` in the same Serializable transaction as the Booking transition. Payment-linked records are not automatically mutated until refund and ledger orchestration exists.

## 2026-07-22 — تصمیم تخصصی افزوده‌شده: Operational panels are clients of domain APIs
**Status:** Accepted

Business panels must not duplicate Booking, pricing, affiliation, branch or availability rules in browser state. A panel may provide validation and presentation, but every mutation calls the existing domain API and the server rechecks ownership, version, eligibility, transaction, Audit and Outbox rules. Dashboard metrics come from PostgreSQL queries and unavailable finance metrics remain hidden rather than mocked. No navigation item, button or dialog is shown as operational unless its endpoint and failure states exist.

The salon owner manages branch schedules. A professional's stable cross-affiliation calendar remains under the professional account until explicit scoped delegation is implemented.

## 2026-07-20 — Execution limitation
**Status:** Active

The local execution sandbox cannot reliably clone `github.com`, so dependency-based local checks are unavailable. Repository inspection/writes use the authenticated connector. GitHub Actions remains the reproducible validation authority; unrun checks are never represented as passing.
