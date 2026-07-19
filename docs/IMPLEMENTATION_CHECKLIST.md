# Implementation Checklist

Legend: `[ ]` open, `[x]` verified complete, `[~]` started/partial, `[!]` blocked and recorded in known limitations.

Latest verified foundation CI: workflow run `29706453678` on 2026-07-20.

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
- [x] Validate Prisma schema and committed migration against a clean PostgreSQL instance in CI.
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
- [x] Add read-only reproducible CI gates for locked install, Prisma, migrations, lint, typecheck, unit tests, build, Compose, Docker image and production dependency audit.

## Phase 2 — Design system and public experience
- [ ] RTL layout, licensed Persian font and theme tokens.
- [ ] Replaceable logo/favicon settings.
- [ ] Responsive header/footer/navigation and mobile bottom bar.
- [ ] Data-backed homepage/search entry.
- [ ] Public provider/professional/service/geography pages.
- [ ] Legal/static/content pages backed by CMS data.
- [ ] Empty/error/loading states.
- [ ] WCAG checks and responsive verification.

## Phase 3 — Authentication and security
- [ ] Customer OTP registration and session lifecycle.
- [ ] Staff/provider mobile-password login and Argon2id.
- [ ] SMS 2FA/recovery, attempt limits and suspicious login audit.
- [ ] RBAC/scopes/contextual policies.
- [ ] Sensitive national-ID HMAC/encryption and audited access.
- [ ] Step-up authentication for sensitive actions.
- [ ] Security headers, CSRF/XSS/SSRF/file/rate-limit controls.

## Phase 4 — Providers and verification
- [ ] Provider-type onboarding.
- [ ] Salons, organizations, branches and professionals.
- [ ] Configurable document requirements and private uploads.
- [ ] Verification review, correction, rejection, expiry and appeals.
- [ ] Home-location verification.
- [ ] Bilateral professional affiliations and shared calendar identity.

## Phase 5 — Catalog, pricing and availability
- [ ] Standard catalog and provider offerings.
- [ ] Variants, add-ons, packages and consultation services.
- [ ] Pricing factors/questionnaires and immutable quote snapshots.
- [ ] Audience, age, guardian and location rules.
- [ ] Schedules, exceptions, holidays and leaves.
- [ ] Resources, capacity, buffers and travel time.
- [ ] Multi-service availability and actionable alternatives.

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
- [ ] Customer panel.
- [ ] Salon/group panel.
- [ ] Independent professional panel.
- [ ] Platform administration panel.
- [ ] Configurable roles/permissions.
- [ ] Real reports and CSV/Excel exports.

## Phase 8 — Communications
- [ ] Kavenegar production adapter and explicit mock.
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
- [~] Unit test matrix; foundational money, Persian normalization and booking-state tests pass.
- [ ] Integration test matrix.
- [ ] Playwright E2E matrix.
- [ ] Security/permission/IDOR/rate/session/upload tests.
- [ ] Accessibility automated and manual checks.
- [x] Current foundation production build, clean migration deployment, Compose validation and Docker image build pass in CI.
- [x] Current production dependency audit passes at high severity threshold after remediating Prisma, BullMQ/uuid and Next/PostCSS advisories.
- [ ] Backup and restore test.
- [ ] Operations/health/queue dashboards.
- [ ] Persian README, installation, production, backup and restore docs.
- [x] External integration limitations and environment contract documented.
- [x] Draft PR description updated with current architecture, migration, capabilities, tests, build, environment, runbook, security and limitations.
- [~] MR-001 through MR-071 are documented and traceable; most implementation requirements remain open.
- [ ] Owner review completed; merge remains owner-controlled.

## Legacy replacement targets
The following current routes are presentation prototypes and must not be treated as completed business capabilities:
- `app/admin/page.tsx`
- `app/dashboard/page.tsx`
- `app/salon-dashboard/page.tsx`
- `app/auth/login/page.tsx`
- `app/auth/register/page.tsx`
- `app/salon-register/page.tsx`
- hardcoded public listing/statistics sections in current public pages

Generic reviewed `components/ui/*` primitives may be retained.
