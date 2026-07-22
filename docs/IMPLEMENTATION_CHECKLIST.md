# Implementation Checklist

Legend: `[ ]` open, `[x]` verified complete, `[~]` started/partial, `[!]` blocked and recorded in known limitations.

Latest verified authentication/RBAC CI: workflow run `29740506514` on 2026-07-20. Provider, catalog, availability, Booking lifecycle and operational provider/customer-panel commits require a fresh CI run before their status can be upgraded to verified complete.

## Phase 0 — Audit and project memory
- [x] Confirm connected GitHub account is `MahdiMoladoost`.
- [x] Confirm repository admin/read/write access and default branch `main`.
- [x] Create `rebuild/full-platform` from `main`.
- [x] Inspect repository metadata and initial commit.
- [x] Inventory current business routes and hardcoded panel data.
- [!] Run local install/build/lint; direct DNS access to GitHub is unavailable in the execution sandbox and no dependency checkout is present.
- [x] Create required project-memory documents.
- [x] Document target architecture and migration strategy.
- [x] Mark legacy business routes as replacement targets.
- [x] Create initial executable Prisma schema.
- [x] Validate foundation migrations against clean PostgreSQL in CI.
- [~] Production dependency audit passes; dedicated source/history secret scanning remains open.

## Phase 1 — Infrastructure
- [x] Normalize package name, scripts, dependency versions and lockfile.
- [x] Add `.env.example` with names/placeholders only.
- [x] Add PostgreSQL, Prisma Client and committed migrations.
- [~] Redis/BullMQ includes scheduled Booking-Hold and provider-approval expiry with retry/backoff; complete queue monitoring and dead-letter operations remain open.
- [~] Worker handles health, Hold expiry and manual-approval expiry with structured logs; additional domain jobs remain open.
- [~] Add MinIO namespaces and S3-compatible contract; complete storage operations remain open.
- [x] Add Dockerfile, Compose, Nginx and health endpoints; full runtime smoke test remains open.
- [~] Structured worker logs exist; full request correlation/observability remains open.
- [x] Add CI gates for locked install, Prisma, migrations, seed, lint, typecheck, tests, build, Compose, Docker and dependency audit.

## Phase 2 — Design system and public experience
- [ ] RTL layout, licensed Persian font and theme tokens.
- [ ] Replaceable logo/favicon settings.
- [ ] Responsive header/footer/navigation and mobile bottom bar.
- [ ] Data-backed homepage/search entry.
- [ ] Public provider/professional/service/geography pages.
- [ ] Legal/static/content pages backed by CMS data.
- [~] Authentication/security screens and provider/customer operational panels have real states; public experience and remaining panels remain open.
- [ ] WCAG checks and responsive verification.

## Phase 3 — Authentication and security
- [x] Customer mobile OTP registration/login, expiry, attempt limits, cooldown, rate limiting and persistent sessions.
- [x] Staff/provider mobile-password login with versioned memory-hard scrypt and environment pepper.
- [x] SMS 2FA and password recovery through replaceable provider with development-only mock.
- [~] Deny-by-default RBAC with seeded/custom roles and protected APIs; scoped provider/branch/professional ABAC remains open.
- [~] National-ID HMAC/encryption and audited administrative access exist; production identity provider and retention workflows remain open.
- [~] Forced initial password change and staff 2FA are active; step-up for every future sensitive action remains open.
- [~] Same-origin mutation checks, secure cookies, expiry/revocation and safe envelopes exist; CSP/XSS/SSRF/upload controls remain open.
- [x] Super-admin mobile is `09399496078`; initial password is environment-only.
- [x] Session/device listing and revocation are persisted and audited.
- [x] Authentication/RBAC migrations, seed, API/UI and tests pass verified CI.

## Phase 4 — Providers and verification
- [~] Persisted onboarding exists for salon/professional modes; dynamic requirements and complete workspace remain open.
- [~] Provider organizations, stable professional profiles and owner-scoped branch CRUD exist; delegated staff, private address verification and public pages remain open.
- [~] Private documents support validation, scan adapter, private storage, audited reads and review; configurable requirements remain open.
- [~] Verification supports submit, correction, rejection, approval and appeals; scheduled expiry/re-review remains open.
- [ ] Home-location verification.
- [~] Bilateral affiliations support requests, counterparty decisions, termination, Serializable transactions and Audit. Booking revalidates active affiliation; scoped delegated ABAC remains open.

## Phase 5 — Catalog, pricing and availability
- [~] Platform categories/services and provider-owner Offering operations are implemented with publication guards and optimistic versioning; full admin ordering/edit and delegated ABAC remain open.
- [ ] Variants, add-ons, packages and complete consultation workflows.
- [~] Integer-toman fixed/starting/range/consultation policy and immutable Quote snapshots exist; calculated/location/package/variant pricing and Quote-expiry jobs remain open.
- [~] Audience and required-questionnaire rules are enforced during initial Booking conversion; guardian workflow, rich definitions and location rules remain open.
- [~] Weekly schedules, exceptions, timezone-aware slots and professional-first shared calendars exist; holidays and richer leave policies remain open.
- [~] Preparation, cleanup and buffers are enforced; resource/equipment capacity and travel-time scheduling remain open.
- [~] Single-Offering preview and Hold subtract Booking intervals, allocations and past time. Multi-service search, alternatives and waitlist remain open.

## Phase 6 — Booking, mock payment and ledger
- [~] Customer-owned service-recipient create/read/update/soft-delete APIs, exact date validation, optimistic concurrency and Audit are implemented; guardian relationships and richer recipient workflows remain open.
- [~] Transactional Booking Holds use verified identity, final Quote validation, TTL, idempotency, Serializable transactions, advisory locks, GiST exclusion, Audit, Outbox and scheduled/lazy expiry.
- [~] Atomic Hold-to-Booking conversion creates Booking, BookingItem, immutable price/duration/policy/questionnaire/legal snapshots, two transitions, Audit and Outbox without releasing the resource allocation. Exact replay, IDOR, expired Hold and concurrent consumption tests are present; fresh CI is pending.
- [~] No-payment instant approval produces `CONFIRMED`; no-payment manual approval produces `AWAITING_PROVIDER_APPROVAL` with a bounded deadline.
- [~] Provider-owner approve/reject APIs use `Idempotency-Key`, `expectedVersion`, Serializable locking, controlled rejection reasons, Audit and Outbox. Approval revalidates provider/branch/Offering/service/professional/affiliation eligibility and preserves the allocation; rejection releases it. Delegated provider/branch/professional ABAC remains open.
- [~] BullMQ expires overdue no-payment manual approvals and releases allocations. Payment-linked and allocation-invalid records are counted but not mutated; operations escalation and dashboarding remain open.
- [ ] Payment-required conversion, payment-backed provider decisions, mock callbacks/webhooks/refunds/reconciliation.
- [~] Ledger persistence and integer-toman helpers exist; posting services and balance invariants remain open.
- [ ] Cancellation, delay, reschedule and no-show policies.
- [ ] Attendance OTP, completion and dispute window.
- [ ] Dispute workflow and financial hold.

## Phase 7 — Operational panels
- [~] Customer panel now has a responsive authenticated shell, live dashboard counts, owned Booking search/filter/detail, recipient CRUD, versioned account profile, active-session management, loading/error states and owner-isolation tests. Payment actions, cancellation/reschedule, reviews, favorites, notifications, support and browser E2E remain open; fresh CI is pending.
- [~] Salon/provider panel now has a responsive data-backed shell, provider switcher, real dashboard counts, booking filters/detail/approve/reject dialogs, branch CRUD, Offering management/publication, bilateral professional collaboration UI and branch weekly schedules/exceptions. Payment, cancellation/reschedule/attendance, messaging, finance, reports, delegated staff ABAC and E2E remain open; fresh CI is pending.
- [ ] Independent professional panel, including personal calendar, affiliations, appointments and portfolio.
- [~] Role/permission management and provider verification queue are protected and data-backed; complete admin panel remains open.
- [x] Seeded/configurable roles and permissions with server-side enforcement.
- [ ] Real reports and CSV/Excel exports.

## Phase 8 — Communications
- [~] Replaceable SMS port and development mock support authentication flows; Kavenegar production adapter remains open.
- [ ] SMS templates, quota, packs, delivery state, retries and reports.
- [ ] Booking/provider-decision notifications and PWA push.
- [ ] Internal messaging with private files and moderation signals.
- [ ] Tickets and support access audit.

## Phase 9 — Content and growth
- [ ] Verified reviews and moderation/appeals.
- [ ] Consent-aware portfolios linked to Booking.
- [ ] CMS, articles, FAQ, legal version publication and homepage ordering.
- [ ] Coupons, promotions, campaigns and ads.
- [ ] Ledger wallet, referrals and loyalty.
- [ ] Waitlist and release holds.

## Phase 10 — Maps and advanced search
- [ ] Neshan adapter and explicit development mode.
- [ ] Address selection/geocoding/reverse/distance.
- [ ] Radius/polygon service areas and privacy rules.
- [~] Persian normalization exists; PostgreSQL FTS and pg_trgm remain open.
- [ ] Autocomplete, ranking, filters and sponsored labels.
- [ ] SEO geography/service pages and structured data.

## Phase 11 — Professional extensions
- [ ] Wedding/group/multi-person Booking flags.
- [ ] Inventory and consumable usage.
- [ ] Permitted product commerce.
- [ ] Accounting/webhook adapters.
- [ ] Rule-based recommendation engine and future model adapter.

## Phase 12 — Hardening and release readiness
- [ ] Complete development seed for nine cities and test roles.
- [~] Unit tests cover auth, RBAC, money, Persian normalization, transitions, identity/provider/affiliation, pricing, availability, Hold, Hold-to-Booking and provider-decision policy.
- [~] PostgreSQL integration tests cover auth/RBAC, identity/provider, affiliation/branch, Catalog→Quote→Availability, concurrent Holds, atomic Hold conversion, provider approve/reject, operational revalidation, scheduled approval expiry and provider/customer-panel ownership, queries and recipient/profile mutations. Fresh CI verification of newest slices is pending.
- [ ] Playwright E2E matrix, including every provider/customer-panel navigation item, form, dialog, mobile Sheet and mutation.
- [~] Automated security coverage includes role boundaries, OTP/session/device IDOR, CSRF-origin, provider documents/affiliations/branches, Offering/schedule isolation, Hold IDOR/idempotency/concurrency, Booking owner IDOR, cross-provider Booking decision IDOR and provider/customer-panel query isolation.
- [ ] Accessibility automated and manual checks.
- [x] Verified authentication/RBAC build, migration, seed, Compose, image build and dependency audit pass CI.
- [ ] Backup and restore test.
- [ ] Operations/health/queue dashboards.
- [ ] Persian README, installation, production, backup and restore docs.
- [x] External integration limitations and environment contract documented.
- [x] Draft PR continuously records architecture, migrations, tests and limitations.
- [~] MR-001 through MR-071 are traceable; auth, provider, catalog/availability, initial Booking lifecycle and provider/customer-panel slices have advanced while most marketplace scope remains open.
- [ ] Owner review completed; merge remains owner-controlled.

## Legacy replacement targets
- `app/admin/page.tsx` — business dashboard remains a replacement target.
- `app/dashboard/page.tsx` — operational data-backed replacement exists; payment, cancellation/reschedule, reviews, favorites, notifications and support extensions remain open.
- `app/salon-dashboard/page.tsx` — operational data-backed replacement exists; finance, advanced Booking lifecycle and delegated-staff extensions remain open.
- `app/auth/login/page.tsx` — operational OTP/staff login replacement exists.
- `app/auth/register/page.tsx` — operational OTP registration/profile completion exists.
- `app/salon-register/page.tsx` — provider-onboarding replacement remains open.
- Hardcoded public listings/statistics remain replacement targets.

Generic reviewed `components/ui/*` primitives may be retained.
