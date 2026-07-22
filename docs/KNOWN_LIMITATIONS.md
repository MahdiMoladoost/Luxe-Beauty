# Known Limitations

This file records incomplete, blocked, unverified, mocked or externally dependent work. An item remains until evidence supports removing it.

## KL-001 — Local clone/build unavailable in current execution sandbox
**Status:** Active

The sandbox cannot reliably clone from `github.com`, so repository inspection and writes use the authenticated GitHub connector. GitHub Actions is the reproducible validation authority. A developer-machine runtime smoke test is still required.

## KL-002 — Operational panels are incomplete
**Status:** Active

The salon/provider dashboard has been replaced with a data-backed responsive shell and operational pages for bookings, branches, services, professional affiliations and branch schedules. It must remain `partial / pending fresh CI` until lint, strict TypeScript, integration tests, production build and browser E2E run on the current head.

The customer business panel, independent-professional panel and complete admin panel still contain legacy or incomplete presentation paths and must not be represented as completed marketplace panels. Finance, reports, messaging, cancellation/rescheduling, attendance and delegated provider staff are also absent from the provider panel.

## KL-003 — Infrastructure is foundational, not production-complete
**Status:** Active

The branch contains PostgreSQL/Prisma, Redis/BullMQ, MinIO namespaces, Compose, Nginx and health endpoints. Hold expiry and no-payment provider-approval expiry are scheduled, but complete queue monitoring, dead-letter operations, remaining jobs, observability, backup/restore and production deployment validation remain open.

## KL-004 — External production providers are unconfigured
**Status:** Expected

KYC and payment providers are not selected/configured. Kavenegar and Neshan credentials/templates are intentionally absent from Git/chat. Development mocks are explicit and refuse production use where implemented.

## KL-005 — Legal review and publication workflow pending
**Status:** Active

Legal pages require qualified review. The initial Booking conversion compares environment-configured immutable version identifiers; a CMS-backed legal publication/version history and user-facing acceptance UI remain open. Development `dev-*` identifiers are not production legal approval.

## KL-006 — Real payment marketplace/legal structure pending
**Status:** Active

A compliant marketplace/payment-facilitator arrangement and provider contract are not finalized. Service funds must not be routed through a personal platform account. Payment work remains adapter-based and mock/sandbox only until resolved.

## KL-007 — Data retention periods pending approval
**Status:** Active

Final production durations for identity, finance, documents, messages, consultations, support evidence and backups require legal/business approval.

## KL-008 — Verified quality evidence predates newest marketplace and panel slices
**Status:** Active

GitHub Actions workflow run `29740506514` passed locked installation, Prisma validation/generation, clean foundation/auth migration deployment, seed, lint, strict TypeScript, unit/integration tests, production build, Compose, Docker image and production dependency audit.

Identity/provider verification, affiliations, branches, Catalog/Offering, Quote, availability, transactional Holds, atomic Hold-to-Booking conversion, provider approve/reject/deadline-expiry and the operational provider panel were added after that run. Connector-created commits have not produced a fresh visible workflow run. These slices remain partial/pending validation and are not represented as CI-passing. Browser E2E for every panel button, dialog, mobile Sheet and form is especially still open. Accessibility, load/failure testing, backup/restore and runtime smoke tests also remain open.

## KL-009 — Secret scanning is incomplete
**Status:** Active

No real secret was intentionally added. `.env.example` contains placeholders and the dependency audit passes. Dedicated repository-history/source secret scanning remains open.

## KL-010 — Full platform scope is not complete
**Status:** Active

Foundation, authentication/RBAC and initial identity/provider/catalog/availability/Booking/provider-panel slices exist. Dynamic document requirements, private address verification, scoped staff ABAC, variants/packages, capacity/travel/multi-service availability, payment-backed decisions and ledger posting, cancellation/rescheduling/no-show, subscriptions, customer/professional/admin panels, public search, communications, reviews/disputes, complete seed, E2E and release hardening remain open. Do not use «پروژه کامل شد». The authoritative status is `docs/IMPLEMENTATION_CHECKLIST.md`.

## KL-011 — Password KDF migration remains an active decision
**Status:** Active review

The implementation uses versioned Node.js scrypt with per-password random salt and environment pepper. The encoded format preserves an explicit future Argon2id migration path.

## KL-012 — Provider authority is temporarily owner-only
**Status:** Active

Provider branch/Offering/schedule operations, provider-originated affiliations and provider Booking decisions currently require the provider owner. The provider panel therefore does not expose a staff switcher or delegated controls. Scoped provider/branch/professional ABAC, delegated managers and branch staff remain open. Exact addresses and verification remain unavailable until private-location storage and the Neshan adapter exist.

## KL-013 — Pricing and availability are bounded
**Status:** Active

Only fixed prices are final/directly bookable. Starting/range are estimates and consultation services do not invent prices. Calculated/package/variant/add-on/location pricing remains rejected. The current provider service form intentionally creates no-payment policies only; Deposit/Online/Prepaid controls remain hidden until payment and ledger are operational. Availability supports one Offering and one professional-or-branch calendar; resources, capacity, travel, multi-service adjacency, alternatives, waitlist and cache invalidation remain open.

The salon panel manages branch schedules only. The stable professional calendar belongs to the professional account and must not be overwritten by the salon owner without future scoped authority.

## KL-014 — Booking lifecycle is still an initial no-payment slice
**Status:** Active

One active fixed-price Hold can become one Booking/BookingItem atomically. The path enforces Recipient ownership, audience/age rules, required answers, legal versions, current Offering/affiliation eligibility, immutable snapshots and exact replay. A consumed Hold remains the blocking allocation.

No-payment manual Bookings can be approved or rejected by the provider owner. Approval revalidates current provider, branch, Offering, service, professional and affiliation eligibility. Rejection and approval-deadline expiry release the allocation; approval preserves it. Payment-required policies are rejected rather than bypassed, and payment-linked pending approvals are not mutated by the current API/worker.

This is not the complete Booking lifecycle. Payment/refund orchestration, delegated decision authority, customer cancellation, reschedule allocation swap, attendance, no-show and dispute workflows remain open. Guardian processing and rich questionnaire definitions are also open.

## KL-015 — PostgreSQL extension and operational migration permissions
**Status:** Active

Booking allocation exclusion constraints require `btree_gist`. The deployment role must be permitted to install it or operations must preinstall the extension before migration deployment.

## KL-016 — Approval-expiry blocked-record operations are incomplete
**Status:** Active

The approval-expiry worker counts payment-linked and allocation-invalid overdue records without mutating them. This is safer than releasing money or resources incorrectly, but production still needs queue metrics, alert thresholds, an operational review queue and financial recovery workflows for those counters.

## KL-017 — Provider panel browser verification is pending
**Status:** Active

The provider panel contains real buttons, forms, dialogs and responsive navigation, but this execution environment cannot run a checked-out browser build. Required follow-up evidence includes Playwright coverage for navigation, Provider switching, booking filters/details/approve/reject, Branch CRUD, Offering publication, affiliation transitions, weekly schedules, exceptions, mobile Sheet, keyboard focus, validation and stale-version recovery.
