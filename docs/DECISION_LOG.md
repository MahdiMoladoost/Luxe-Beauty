# Decision Log

Accepted requirements are not changed or removed without an entry here. New technical decisions use the heading «تصمیم تخصصی افزوده‌شده» as required by the project brief.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Modular monolith
**Status:** Accepted

Use a feature/domain-oriented modular monolith before considering services. This keeps transactions for booking and ledger reliable while preserving extraction boundaries.

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

Professional identity and schedule conflicts persist across every salon, branch and independent location. Affiliation changes do not erase ratings or booking history.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Private location disclosure
**Status:** Accepted

Exact customer and home-studio addresses are private. Search and pre-confirmation use approximate geography. Exact details are released only to authorized booking participants at the valid stage and all sensitive access is audited.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Preserve generic UI, replace business prototypes
**Status:** Accepted

Reviewed generic shadcn/ui primitives and useful design utilities may remain. Current admin/customer/provider business pages are replacement targets because they use client-only state and hardcoded data. Authentication screens may be removed from this list only when their full database/API/security flow is operational and tested.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Early draft PR
**Status:** Accepted

Open a draft pull request after phase-zero foundations so progress, commits, CI and limitations are continuously visible. The PR remains draft and is never merged without explicit owner instruction.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Versioned scrypt password KDF
**Status:** Accepted

Use Node.js scrypt as the approved memory-hard password hashing equivalent, with a random per-password salt, an environment-managed pepper and an encoded algorithm/version/parameter envelope. This avoids fragile native-build dependencies in the current deployment while preserving an explicit migration path to Argon2id. Passwords and pepper values are never logged or stored in seeds/source.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Development OTP observability without production leakage
**Status:** Accepted

The mock SMS adapter may return the OTP to the development UI only when the application is not in production and `SMS_PROVIDER=mock`. The adapter refuses production use, logs only masked mobile/correlation metadata, and never logs the OTP. Real SMS delivery remains adapter-driven.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Authentication state is PostgreSQL-authoritative
**Status:** Accepted

OTP challenges, attempt counters, resend cooldowns, application rate-limit windows, credentials, active sessions, idle/absolute expiry, device revocation and RBAC assignments are stored in PostgreSQL. Redis may later accelerate distributed limits but cannot be the only authority for authentication correctness.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Multi-file Prisma schema by domain
**Status:** Accepted

Prisma reads the `prisma` directory as one schema. Authentication tables are defined in `prisma/auth.prisma` while the existing marketplace models remain in `prisma/schema.prisma`; committed SQL migrations remain the deployment source of truth. This permits gradual domain separation without rewriting the accepted foundation schema.

## 2026-07-20 — Execution limitation
**Status:** Active

The local execution sandbox cannot reliably clone `github.com`, so direct local dependency-based checks are unavailable. Repository inspection and writes continue through the authenticated GitHub connector. GitHub Actions is the reproducible validation authority for this session; failed or unrun checks remain visible and are never represented as passing.
