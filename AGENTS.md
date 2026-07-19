# Luxe Beauty — Agent Operating Rules

## Mission
Build Luxe Beauty as a production-oriented, nationwide beauty-services marketplace. The repository must not regress into a static demo or a UI-only prototype.

## Non-negotiable workflow
- Work only on feature branches. The active rebuild branch is `rebuild/full-platform`.
- Never merge to `main` without the repository owner's explicit instruction.
- Read `docs/PROJECT_CONSTITUTION.md`, `docs/MASTER_REQUIREMENTS.md`, and `docs/IMPLEMENTATION_CHECKLIST.md` before each implementation phase.
- Update the checklist and decision log at the end of every phase.
- Do not remove an accepted requirement without recording the reason in `docs/DECISION_LOG.md`.
- Use small, topical commits and keep the branch buildable.
- Never commit real `.env` files, credentials, tokens, private keys, national IDs, or production customer data.
- Do not claim that the project is complete until every mandatory checklist item and quality gate has passed.

## Engineering constraints
- Next.js App Router, React, strict TypeScript, Tailwind CSS, and reviewed shadcn/ui primitives.
- PostgreSQL and Prisma for persistent data.
- Redis and BullMQ-compatible jobs for queues, retries, and scheduled work.
- MinIO in development and an S3-compatible adapter in production.
- Modular monolith with explicit domain, application, infrastructure, and UI boundaries.
- Money is stored as integer tomans; never use floating-point arithmetic for financial values.
- Store timestamps in UTC and render Iran timezone/Jalali dates in the UI.
- Normalize Persian, Arabic, and Latin digits and Persian/Arabic letter variants at input boundaries.
- Enforce authorization server-side using RBAC and contextual policies where needed.
- Sensitive operations require audit logs, idempotency, transactions, and versioned policy snapshots.

## Required validation
Before a phase is marked complete, run the relevant subset of:
- lint
- TypeScript typecheck
- unit tests
- integration tests
- Playwright E2E tests
- Prisma validation and migration checks
- production build
- accessibility checks
- dependency/security audit
- Docker build

A failing or skipped mandatory check must remain visible in `docs/KNOWN_LIMITATIONS.md` and the pull request description.
