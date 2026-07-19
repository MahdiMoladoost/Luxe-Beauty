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

Reviewed generic shadcn/ui primitives and useful design utilities may remain. Current admin/customer/provider/auth business pages are replacement targets because they use client-only state and hardcoded data.

## 2026-07-20 — تصمیم تخصصی افزوده‌شده: Early draft PR
**Status:** Accepted

Open a draft pull request after phase-zero foundations so progress, commits, CI and limitations are continuously visible. The PR remains draft and is never merged without explicit owner instruction.

## 2026-07-20 — Execution limitation
**Status:** Active

The local execution sandbox could not resolve `github.com`, so a direct clone and local dependency-based build/lint could not run. Repository inspection and writes continue through the authenticated GitHub connector. Remote CI will be introduced for reproducible validation; failed/unrun checks remain visible and are not represented as passing.
