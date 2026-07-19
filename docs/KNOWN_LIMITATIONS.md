# Known Limitations

This file records incomplete, blocked, unverified, mocked, or externally dependent work. An item remains here until evidence supports removing it.

## KL-001 — Local clone/build unavailable in current execution sandbox
**Status:** Active

The sandbox could not resolve `github.com`, so it could not clone the repository or run dependency-based checks locally. Repository inspection and changes use the authenticated GitHub connector. Remote GitHub Actions now provides reproducible validation, but a developer-machine runtime smoke test is still required.

## KL-002 — Existing business application remains a UI prototype
**Status:** Active

The initial commit contains client-heavy admin, customer and salon dashboards with hardcoded arrays/statistics and no database/API/authorization backing. Login and registration remain presentation flows. These routes are explicit replacement targets and must not be represented as operational features.

## KL-003 — Infrastructure is foundational, not production-complete
**Status:** Active

The rebuild branch now contains Prisma/PostgreSQL schema and migration, Redis/BullMQ worker scaffold, MinIO namespaces, Docker Compose, Nginx and health endpoints. Application storage adapters, real queue workflows, scheduling, dead-letter handling, complete observability, backup/restore and production deployment validation remain open.

## KL-004 — External production providers are unconfigured
**Status:** Expected

KYC and payment providers are not selected/configured. Kavenegar and Neshan credentials/templates exist with the owner but are intentionally absent from Git/chat. Development must use clearly labelled mocks until secret configuration occurs outside Git.

## KL-005 — Legal review pending
**Status:** Expected

Required legal pages will be software drafts and must be reviewed by qualified legal counsel before production publication.

## KL-006 — Real payment marketplace/legal structure pending
**Status:** Active

A compliant marketplace/payment-facilitator arrangement and provider contract have not been finalized. Service funds must not be routed through a personal platform account. The implementation must remain adapter-based and mock/sandbox only until resolved.

## KL-007 — Data retention periods pending legal/business approval
**Status:** Active

Retention is configurable by policy, but final production durations for identity, finance, documents, messages, consultations, support evidence and backups require legal/business approval.

## KL-008 — Current quality evidence covers foundations only
**Status:** Active

GitHub Actions workflow run `29706453678` passed locked installation, Prisma validation/client generation, deployment of the committed migration to clean PostgreSQL, migration status, lint, strict TypeScript, foundational unit tests, production build, Docker Compose validation, application image build and production dependency audit. Integration, E2E, accessibility, permission/IDOR, upload, session, queue, backup/restore and full runtime smoke tests remain open.

## KL-009 — Secret scanning is incomplete
**Status:** Active

No real secret was intentionally added, `.env.example` contains names/placeholders only, and dependency audit passes. A dedicated repository-history and source secret-scanning job is not yet installed.

## KL-010 — Full platform scope is not complete
**Status:** Active

Phase zero and the initial infrastructure foundation are established. Public data-backed pages, authentication, provider onboarding, booking use cases, payment/ledger services, operational panels, communications, maps/search, growth modules and release hardening remain open. Do not use «پروژه کامل شد» or equivalent wording. The authoritative status is `docs/IMPLEMENTATION_CHECKLIST.md`.
