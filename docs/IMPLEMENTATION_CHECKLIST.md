# Implementation Checklist

Legend: `[ ]` open, `[x]` verified complete, `[~]` started/partial, `[!]` blocked and recorded in known limitations.

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
- [~] Create initial executable Prisma schema.
- [ ] Validate Prisma schema in CI/runtime.
- [ ] Complete a repository-wide secret scan and dependency audit.

## Phase 1 — Infrastructure
- [ ] Normalize package name/scripts/dependencies and lockfile.
- [ ] Add `.env.example` with names/placeholders only.
- [ ] PostgreSQL and Prisma client/migrations.
- [ ] Redis connection and queue abstraction.
- [ ] Worker process, retries and dead-letter queue.
- [ ] MinIO/S3 storage adapter and buckets/namespaces.
- [ ] Dockerfiles, Docker Compose, Nginx and health checks.
- [ ] Structured logging and correlation IDs.
- [ ] CI quality gates.

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
- [ ] Booking recipient model.
- [ ] Transactional holds, TTL and idempotency.
- [ ] Complete tested booking state machine.
- [ ] Instant/manual approval and expiry jobs.
- [ ] Mock payment callbacks/webhooks/refunds/reconciliation.
- [ ] Balanced immutable ledger postings.
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
- [ ] Persian normalization, PostgreSQL FTS and pg_trgm.
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
- [ ] Unit test matrix.
- [ ] Integration test matrix.
- [ ] Playwright E2E matrix.
- [ ] Security/permission/IDOR/rate/session/upload tests.
- [ ] Accessibility automated and manual checks.
- [ ] Production build, migration and Docker validation.
- [ ] Dependency/security audit.
- [ ] Backup and restore test.
- [ ] Operations/health/queue dashboards.
- [ ] Persian README, installation, production, backup and restore docs.
- [ ] External integration limitations report.
- [ ] Draft PR description updated with final architecture, migrations, capabilities, tests, build, env, accounts, runbook and security.
- [ ] All MR-001 through MR-071 requirements traced to code/tests/docs.
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
