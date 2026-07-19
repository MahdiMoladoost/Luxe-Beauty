# Known Limitations

This file records incomplete, blocked, unverified, mocked, or externally dependent work. An item remains here until evidence supports removing it.

## KL-001 — Local clone/build unavailable in current execution sandbox
**Status:** Active

The sandbox could not resolve `github.com`, so it could not clone the repository or install dependencies. Current `npm run build` and `npm run lint` have not been executed in this session. Repository inspection and changes use the authenticated GitHub connector. Remote CI must provide reproducible validation.

## KL-002 — Existing application is a UI prototype
**Status:** Active

The initial commit contains client-heavy admin, customer and salon dashboards with hardcoded arrays/statistics and no database/API/authorization backing. Login and registration are presentation flows. These routes are explicitly marked for replacement and must not be represented as operational features.

## KL-003 — No executable persistence infrastructure on `main`
**Status:** Active

The initial repository has no Prisma dependency/schema/migrations, PostgreSQL, Redis, worker, MinIO, Docker Compose or Nginx configuration. Phase-one work is required.

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

## KL-008 — Current quality evidence
**Status:** Active

No lint, typecheck, unit, integration, E2E, accessibility, migration, Docker or security-audit result is yet available for the rebuild branch. Documentation commits alone do not satisfy product completion.

## KL-009 — Full platform scope is not complete
**Status:** Active

Phase zero is in progress. Do not use «پروژه کامل شد» or equivalent wording. The authoritative status is `docs/IMPLEMENTATION_CHECKLIST.md`.
