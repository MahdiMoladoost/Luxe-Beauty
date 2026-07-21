# Implementation Checklist

Legend: `[ ]` open, `[x]` verified complete, `[~]` started/partial, `[!]` blocked and recorded in known limitations.

Latest verified authentication/RBAC CI: workflow run `29740506514` on 2026-07-20. Provider verification, affiliation, branch management, catalog, quote and availability commits require a fresh CI run before their implementation status can be upgraded to verified complete.

## Phase 0 — Audit and project memory
- [x] Confirm connected GitHub account is `MahdiMoladoost`.
- [x] Confirm repository admin/read/write access and default branch `main`.
- [x] Create `rebuild/full-platform` from `main`.
- [x] Inspect repository metadata and initial commit.
- [x] Inventory current business routes and identify hardcoded panel data.
- [!] Run current local install/build/lint; direct DNS access to GitHub is unavailable in the execution sandbox and no dependency checkout is present.
- [x] Create required project-memory documents.
- [x] Document target architecture and migration strategy.
- [x] Mark legacy admin/customer/provider/auth routes as replacement targets.
- [x] Create initial executable Prisma schema.
- [x] Validate Prisma schema and committed migrations against a clean PostgreSQL instance in CI.
- [~] Complete repository-wide secret scanning and dependency auditing; production dependency audit passes, dedicated source/secret scanning is still open.

## Phase 1 — Infrastructure
- [x] Normalize package name, scripts, dependency versions and committed lockfile.
- [x] Add `.env.example` with names/placeholders only.
- [x] Add PostgreSQL, Prisma Client, baseline schema and committed migration foundation.
- [~] Add Redis connection and BullMQ-compatible queue foundation; production queue services and monitoring remain open.
- [~] Add worker process scaffold; retries, scheduled jobs and dead-letter handling remain open.
- [~] Add MinIO development namespaces and S3-compatible environment contract; application storage adapter remains open.
- [x] Add Dockerfile, Docker Compose, production-like Nginx and liveness/readiness endpoints; full runtime smoke test remains open.
- [~] Add structured worker logs; request correlation middleware and full observability remain open.
- [x] Add read-only reproducible CI gates for locked install, Prisma, migrations, seed, lint, typecheck, unit/integration tests, build, Compose, Docker image and production dependency audit.

## Phase 2 — Design system and public experience
- [ ] RTL layout, licensed Persian font and theme tokens.
- [ ] Replaceable logo/favicon settings.
- [ ] Responsive header/footer/navigation and mobile bottom bar.
- [ ] Data-backed homepage/search entry.
- [ ] Public provider/professional/service/geography pages.
- [ ] Legal/static/content pages backed by CMS data.
- [~] Authentication and security screens now have real loading/error/success states; public and business panels remain open.
- [ ] WCAG checks and responsive verification.

## Phase 3 — Authentication and security
- [x] Customer mobile OTP registration/login, expiry, attempt limits, resend cooldown, rate limiting and persistent session lifecycle.
- [x] Staff/provider mobile-password login using versioned scrypt with an environment pepper as an approved memory-hard KDF equivalent.
- [x] SMS 2FA and password recovery through a replaceable provider with a development-only mock; login lockout and suspicious/failure audit are active.
- [~] RBAC is deny-by-default with ten seeded roles, custom roles/permissions, protected APIs/layouts and atomic audit; provider/branch/professional scoped ABAC is still open.
- [~] Sensitive national-ID HMAC/encryption, mock verification adapter and audited administrative access are implemented; production identity provider and complete retention workflows remain open.
- [~] Forced initial super-admin password change and staff SMS 2FA are active; freshness-based step-up for every future financial/identity action remains open.
- [~] Same-origin mutation checks, secure cookies, session expiry/revocation, OTP/password rate limits and safe error envelopes are active; CSP/XSS/SSRF/upload controls remain open.
- [x] Super-admin bootstrap uses mobile `09399496078`; the initial password is read only from `SEED_SUPER_ADMIN_INITIAL_PASSWORD`, never from code or a public seed.
- [x] Active device/session listing, per-device revocation, current logout and logout-all are persisted and audited.
- [x] Authentication/RBAC migration, multi-file Prisma schema, development seed, UI, API, permission matrix, unit tests and PostgreSQL integration tests pass CI.

## Phase 4 — Providers and verification
- [~] Provider-type onboarding supports persisted applications for salon and professional modes; dynamic per-type requirement configuration and the complete workspace remain open.
- [~] Provider organizations, stable professional profiles and owner-scoped branch CRUD exist. Branch creation validates city/district/neighborhood hierarchy, remains inactive by default, supports soft delete and optimistic concurrency, and can activate only after provider approval. Delegated branch staff, private address verification, business hours and public branch pages remain open.
- [~] Private provider documents support validation, malware-scan adapter state, private storage, audited reads and review; configurable document requirement definitions remain open.
- [~] Verification supports submit, review, correction, rejection, approval and appeals; scheduled expiry/re-review and complete appeal operations remain open.
- [ ] Home-location verification.
- [~] Bilateral professional affiliations support provider/professional requests, counterparty acceptance/rejection, bilateral termination, serializable transactions and audit. Shared professional calendar ownership is now represented; delegated provider-staff ABAC and booking-time conflict constraints remain open.

## Phase 5 — Catalog, pricing and availability
- [~] Platform-owned categories and standard services have protected creation, public reads and audit. Provider-owner Offering create/list/update/archive, branch/professional ownership checks, publication guards and optimistic `version` are implemented; full admin editing/order and delegated provider ABAC remain open.
- [ ] Variants, add-ons, packages and complete consultation workflows.
- [~] Integer-toman policy supports fixed, starting-from, range and consultation-required modes. Server Quotes persist Offering version, duration formula and rule snapshots with expiry; calculated/location/package/variant pricing and quote-expiry jobs remain open.
- [~] Audience, booking and pricing rule objects are persisted and snapshotted, but age/guardian/questionnaire/location rule engines are still open.
- [~] Weekly schedules, open/closed exceptions, timezone-aware slot generation and professional-first shared calendar resolution are implemented. Holiday templates, leave workflow and schedule administration UI remain open.
- [~] Preparation, cleanup and before/after buffers are enforced. Resource capacity, equipment/room constraints and travel-time scheduling remain open.
- [~] Single-Offering slot preview subtracts blocking Booking intervals and past time. Multi-service contiguous search, alternatives, waitlist and transactional holds remain open.

## Phase 6 — Booking, mock payment and ledger
- [~] Booking recipient, booking, booking-item and transition persistence models exist; application workflows remain open.
- [~] Idempotency/outbox persistence foundations exist; transactional booking holds and TTL remain open.
- [~] Booking transition guard and initial unit coverage exist; complete use-case/state-machine integration tests remain open.
- [ ] Instant/manual approval and expiry jobs.
- [ ] Mock payment callbacks/webhooks/refunds/reconciliation.
- [~] Ledger account/transaction/entry persistence and integer-toman helpers exist; posting services and balance invariants remain open.
- [ ] Cancellation, delay, reschedule and no-show policies.
- [ ] Attendance OTP, completion and dispute window.
- [ ] Dispute workflow and financial hold.

## Phase 7 — Operational panels
- [~] Customer authentication, profile completion and security/device management are data-backed; the complete customer panel remains open.
- [ ] Salon/group panel.
- [ ] Independent professional panel.
- [~] Platform role/permission management and provider verification queue are data-backed and protected; the complete administration panel remains open.
- [x] Seeded and configurable roles/permissions with server-side API and layout enforcement.
- [ ] Real reports and CSV/Excel exports.

## Phase 8 — Communications
- [~] Replaceable SMS port and explicit development mock support OTP, staff 2FA and password recovery; Kavenegar production adapter remains open.
- [ ] SMS templates, quota, packs, delivery state, retries and reports.
- [ ] In-app notifications and PWA push.
- [ ] Internal messaging with private files and moderation signals.
- [ ] Tickets and support access audit.

## Phase 9 — Content and growth
- [ ] Verified reviews and moderation/appeals.
- [ ] Consent-aware portfolios linked to booking.
- [ ] CMS, articles, FAQ and homepage ordering.
- [ ] Coupons, promotions, campaigns and ads.
- [ ] Ledger wallet, referrals and loyalty.
- [ ] Waitlist and release holds.

## Phase 10 — Maps and advanced search
- [ ] Neshan adapter and explicit development mode.
- [ ] Address selection/geocoding/reverse/distance.
- [ ] Radius/polygon service areas and privacy rules.
- [~] Persian letter/digit/search normalization exists with unit tests; PostgreSQL FTS and pg_trgm remain open.
- [ ] Autocomplete, ranking, filters and sponsored labels.
- [ ] SEO geography/service pages and structured data.

## Phase 11 — Professional extensions
- [ ] Wedding/group/multi-person booking flags.
- [ ] Inventory and consumable usage.
- [ ] Permitted product commerce.
- [ ] Accounting/webhook adapters.
- [ ] Rule-based recommendation engine and future model adapter.

## Phase 12 — Hardening and release readiness
- [ ] Complete development-only seed for nine cities and test roles.
- [~] Unit tests cover authentication cryptography, RBAC, route permission matrices, money, Persian normalization, booking transitions, identity/provider/affiliation policies, catalog pricing and timezone-aware availability intervals; later domains remain open.
- [~] PostgreSQL integration tests cover OTP/session/profile, staff password/2FA, RBAC APIs/audit, device IDOR, identity verification, provider onboarding/private documents, affiliation lifecycle, branch concurrency and the Catalog→Offering→Quote→Schedule→Availability path. Fresh CI verification of the newest slices is pending.
- [ ] Playwright E2E matrix.
- [~] Permission denial, role escalation boundaries, OTP/rate/session/logout/device IDOR, CSRF-origin behavior, provider-document/affiliation IDOR, branch isolation and Offering/schedule owner isolation have automated coverage; upload and full security matrix remain open.
- [ ] Accessibility automated and manual checks.
- [x] Current authentication/RBAC production build, clean migration deployment, seed, Compose validation and Docker image build pass in CI.
- [x] Current production dependency audit passes at high severity threshold.
- [ ] Backup and restore test.
- [ ] Operations/health/queue dashboards.
- [ ] Persian README, installation, production, backup and restore docs.
- [x] External integration limitations and environment contract documented.
- [x] Draft PR description continuously records current architecture, migrations, capabilities, tests, build, environment, security and limitations.
- [~] MR-001 through MR-071 are documented and traceable; authentication/RBAC, initial provider/identity and initial catalog/availability slices have advanced while most marketplace domains remain open.
- [ ] Owner review completed; merge remains owner-controlled.

## Legacy replacement targets
The following current routes remain presentation prototypes unless explicitly noted:
- `app/admin/page.tsx` — protected, but its business dashboard content remains a replacement target.
- `app/dashboard/page.tsx` — protected, but the full customer business panel remains open.
- `app/salon-dashboard/page.tsx` — protected, but its business dashboard content remains a replacement target.
- `app/auth/login/page.tsx` — replaced with operational customer OTP and staff mobile/password/2FA flows.
- `app/auth/register/page.tsx` — replaced with operational mobile OTP registration and persisted profile completion.
- `app/salon-register/page.tsx` — still a provider-onboarding replacement target.
- hardcoded public listing/statistics sections in current public pages.

Generic reviewed `components/ui/*` primitives may be retained.
