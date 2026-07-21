# Master Brief Refresh — 2026-07-21

## Status

The repository owner supplied a refreshed comprehensive master brief on 2026-07-21. It reaffirms the existing rebuild mission and remains authoritative together with `docs/MASTER_REQUIREMENTS.md`.

## Reconciliation result

- No accepted requirement from MR-001 through MR-071 is removed or weakened.
- The active implementation branch remains `rebuild/full-platform`.
- Pull request #2 remains Draft and must not be merged without explicit owner approval.
- Existing operational authentication, session, device security and RBAC work is retained.
- Legacy hardcoded admin, customer, provider and public-business data remain replacement targets.
- Header and hero work on `main` are not used as a substitute for the data-backed marketplace rebuild; branch changes must preserve reviewed generic UI only when it remains compatible with the target architecture.
- Production claims are forbidden until mandatory quality gates pass.

## Execution priority after reconciliation

1. Provider and professional onboarding domain.
2. Configurable KYC document requirements, private document storage and review workflow.
3. Salons, organizations, branches, professional affiliations and shared professional calendar identity.
4. Catalog, pricing, questionnaires, schedules, resources and availability.
5. Transactional booking holds, state machine use cases, mock payment and ledger posting.
6. Complete customer, provider, professional and admin workspaces.
7. Communications, content/growth, maps/search, hardening and release readiness.

## External integrations

Kavenegar, Neshan, production identity verification, payment gateway, production S3 storage and malware scanning remain adapter-based until the owner supplies production credentials and provider documentation through secure environment/secret channels. No credentials belong in Git, chat transcripts, seed data or pull-request text.

## Traceability

All implementation work continues to reference the stable requirement groups in `docs/MASTER_REQUIREMENTS.md`, with phase status in `docs/IMPLEMENTATION_CHECKLIST.md`, technical decisions in `docs/DECISION_LOG.md`, and blockers in `docs/KNOWN_LIMITATIONS.md`.
