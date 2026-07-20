# Known Limitations

This file records incomplete, blocked, unverified, mocked, or externally dependent work. An item remains here until evidence supports removing it.

## KL-001 — Local clone/build unavailable in current execution sandbox
**Status:** Active

The sandbox cannot reliably clone the repository from `github.com`, so repository inspection and writes use the authenticated GitHub connector. Remote GitHub Actions provides reproducible validation. A developer-machine runtime smoke test is still required and local commands are documented in the pull request/report.

## KL-002 — Most business panels remain UI prototypes
**Status:** Active

Customer OTP registration/login, profile completion, session/device security, staff password/2FA/recovery and role/permission management now use PostgreSQL-backed APIs. The main admin, customer and salon business dashboards still contain legacy hardcoded arrays/statistics and must not be represented as operational marketplace panels.

## KL-003 — Infrastructure is foundational, not production-complete
**Status:** Active

The rebuild branch contains Prisma/PostgreSQL schemas and migrations, Redis/BullMQ worker scaffold, MinIO namespaces, Docker Compose, Nginx and health endpoints. Application storage adapters, real queue workflows, scheduling, dead-letter handling, complete observability, backup/restore and production deployment validation remain open.

## KL-004 — External production providers are unconfigured
**Status:** Expected

KYC and payment providers are not selected/configured. Kavenegar and Neshan credentials/templates are intentionally absent from Git/chat. Authentication uses an explicit mock SMS provider outside production; it exposes the OTP only in the development response/UI and refuses to run as a production provider. Production must configure a real adapter and secrets outside Git.

## KL-005 — Legal review pending
**Status:** Expected

Required legal pages will be software drafts and must be reviewed by qualified legal counsel before production publication.

## KL-006 — Real payment marketplace/legal structure pending
**Status:** Active

A compliant marketplace/payment-facilitator arrangement and provider contract have not been finalized. Service funds must not be routed through a personal platform account. The implementation must remain adapter-based and mock/sandbox only until resolved.

## KL-007 — Data retention periods pending legal/business approval
**Status:** Active

Retention is configurable by policy, but final production durations for identity, finance, documents, messages, consultations, support evidence and backups require legal/business approval.

## KL-008 — Current quality evidence covers foundations and authentication/RBAC
**Status:** Active

GitHub Actions workflow run `29740506514` passed locked installation, multi-file Prisma validation/client generation, clean deployment of the committed foundation and authentication migrations, migration status, system role/super-admin seed, lint, strict TypeScript, unit and PostgreSQL integration tests, production build, Docker Compose validation, application image build and production dependency audit. Auth tests cover OTP cooldown/attempts, session lifecycle/logout-all, staff password/2FA, device IDOR, RBAC permission denial/allow and mutation audit. E2E, accessibility, upload, KYC, booking/payment concurrency, queue, backup/restore and full runtime smoke tests remain open.

## KL-009 — Secret scanning is incomplete
**Status:** Active

No real secret was intentionally added. `.env.example` contains names and blank placeholders for sensitive values, and the dependency audit passes. A dedicated repository-history and source secret-scanning job is not yet installed.

## KL-010 — Full platform scope is not complete
**Status:** Active

Phase zero, infrastructure and an operational authentication/RBAC vertical slice are established. Customer/provider identity verification, provider onboarding, service/repository coverage for marketplace entities, salons/branches/professionals, availability, booking, payment/ledger, subscriptions, complete panels, public search, integrations, communications, reviews/disputes, full seed data, E2E and release hardening remain open. Do not use «پروژه کامل شد» or equivalent wording. The authoritative status is `docs/IMPLEMENTATION_CHECKLIST.md`.

## KL-011 — Password KDF migration remains a maintained security decision
**Status:** Active review

The implementation uses versioned Node.js scrypt with per-password random salt and an environment-managed pepper as the approved memory-hard equivalent permitted by the requirements. The encoded format records the algorithm/version/parameters so a future Argon2id migration can occur during successful login or password change without invalidating accounts.
