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
- Customer OTP, expiry, attempt limits and session rotation.
- Staff password/2FA/recovery.
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
- Session fixation/rotation/revocation/logout-all.
- Upload MIME/size/hash/private URL/scan-state controls.
- Sensitive national ID, address, document and conversation access/audit.
- Webhook signature/idempotency/replay.
- Refund/settlement/reconciliation authorization.

## Accessibility
Automated axe-compatible checks for home, search, provider page, authentication, booking, customer dashboard, provider dashboard and admin critical flows. Manual keyboard, screen reader, zoom, reduced motion, RTL and mobile touch-target review is also required.

## Test data
Factories create deterministic domain data. Development seeds are clearly labelled «آزمایشی». Production must never seed test accounts. Secrets and real PII are prohibited in fixtures and snapshots.

## Current status
Phase-zero documentation tests are review-only. Local build/lint was not executable because the sandbox could not clone GitHub or install dependencies. Remote CI remains required before any build claim.
