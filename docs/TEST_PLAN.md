# Test Plan

## Quality gate
A releasable commit series must pass:
1. dependency install from a committed reproducible lockfile
2. lint
3. strict TypeScript typecheck
4. unit tests
5. integration tests
6. Prisma validation and migration checks
7. production build
8. Playwright E2E in an isolated environment
9. accessibility checks on critical pages
10. dependency/security audit
11. Docker image/build validation

No mandatory test is deleted or skipped merely to make CI green. Quarantined tests require an owner, reason, issue, expiry date, and visible CI reporting.

## Unit tests
- Persian/Arabic/Latin normalization.
- Money arithmetic and rounding-free integer calculations.
- Authentication OTP HMAC/challenge binding, password hashing/verification and password policy.
- Deny-by-default RBAC, forced initial-password boundaries and the protected panel/API permission matrix.
- Fixed/from/range/consultation/calculated/variant/add-on/location pricing.
- Duration, buffers, travel and multi-service sequencing.
- Discounts, caps, minimums, eligibility and stacking.
- Commission selection/versioning.
- Cancellation, delay, reschedule and no-show boundaries.
- Refund and partial refund calculations.
- Age, gender/target, guardian and location policies.
- Subscription trial/grace/feature/quota eligibility.
- SMS quota consumption and package priority.
- Ledger balancing, reversals, holds, releases and settlements.
- Booking state-machine allowed/forbidden transitions.

## Integration tests
Run against PostgreSQL, Redis and MinIO-compatible services.
- Customer OTP registration, expiry, resend cooldown, attempt limits, persisted profile, active session and logout-all.
- Staff mobile/password login, temporary lockout foundation, SMS 2FA and password recovery primitives.
- Active-device listing, owned-session revocation and cross-user session IDOR denial.
- All role/permission API operations for unauthenticated, denied and super-admin principals.
- Atomic audit evidence for custom permission and role creation.
- KYC mock, encrypted identity and duplicate national-ID HMAC.
- Provider onboarding, private documents and review transitions.
- Professional affiliation bilateral approval and scope.
- Availability calculation and resource locking.
- Concurrent booking/double-booking race.
- Booking hold expiry and idempotent creation.
- Payment mock callbacks, duplicate/late callbacks and reconciliation.
- Ledger postings, refunds, settlements and dispute holds.
- Consultation proposal expiry and private attachment access.
- Review eligibility after verified completion.
- Notifications/outbox/queue retry/deduplication.
- Subscription expiry/grace and booking suspension.

## E2E journeys
- Customer OTP registration, KYC mock, search, booking, mock payment, confirmation, attendance, completion and review.
- Cancellation and automatic refund.
- Booking for another recipient including child/guardian rules.
- Customer-home service with approximate then exact address disclosure.
- Provider registration, documents, admin approval, plan purchase, service setup, schedule/resource setup and booking receipt.
- Independent/home professional flows and multi-location conflict prevention.
- Manual booking approval/expiry/reschedule.
- Dispute evidence, support review, finance decision and appeal.
- Admin management for geography, plans, policies, roles, content and audit.

## Security tests
- Cross-tenant IDOR and object ownership.
- Missing/revoked/expired permission scopes.
- Role escalation and role-change step-up auth.
- CSRF, XSS, injection and unsafe URL/SSRF validation.
- Login/OTP/password recovery rate limits and enumeration resistance.
- Session fixation/rotation/revocation/logout-all and per-device revocation.
- Upload MIME/size/hash/private URL/scan-state controls.
- Sensitive national ID, address, document and conversation access/audit.
- Webhook signature/idempotency/replay.
- Refund/settlement/reconciliation authorization.

## Accessibility
Automated axe-compatible checks for home, search, provider page, authentication, booking, customer dashboard, provider dashboard and admin critical flows. Manual keyboard, screen reader, zoom, reduced motion, RTL and mobile touch-target review is also required.

## Test data
Factories create deterministic domain data. Development seeds are clearly labelled «آزمایشی». Production must never seed test accounts. Secrets and real PII are prohibited in fixtures and snapshots.

## Current status
GitHub Actions workflow run `29740506514` passed locked dependency installation, multi-file Prisma validation and client generation, both committed migrations on clean PostgreSQL, migration status, RBAC/super-admin seed, lint, strict TypeScript, authentication/RBAC plus foundational unit tests, PostgreSQL integration tests, production build, Docker Compose validation, application image build and production dependency audit. E2E, accessibility, upload/security completion, backup/restore and full runtime smoke tests remain open. Local execution in this session remains unavailable because the sandbox cannot clone GitHub; the user can run the documented commands on a developer machine.
