# Project Constitution

Status: Active
Owner: MahdiMoladoost
Product: Luxe Beauty / لوکس بیوتی
Default branch: `main`
Implementation branch: `rebuild/full-platform`
Local application URL: `http://localhost:5000`

## Product definition
Luxe Beauty is a nationwide, Persian-first and RTL marketplace for discovering, verifying, consulting with, booking, paying, and reviewing beauty-service providers. It serves salons, multi-branch groups, independent professionals, home-service professionals, home studios, hybrid providers, customers, support teams, and platform administrators.

## Product invariants
1. Business-critical UI must be backed by persistent data, an API or server action, authorization, validation, and explicit domain logic.
2. Static demonstration data may only exist in development seeds and must be visibly labelled as test data.
3. Booking availability must be enforced by database transactions and constraints/locking; UI checks and Redis locks are supplementary.
4. Financial balances are ledger-derived. No sensitive balance is changed by mutating a single number without entries and audit evidence.
5. Booking price, duration, policies, commission, and questionnaire answers are snapshotted so later configuration changes do not rewrite history.
6. Provider visibility and booking eligibility require the appropriate verification, subscription, document, and operational status.
7. Exact private addresses and private files are disclosed only to authorized actors for a valid workflow and all sensitive access is auditable.
8. Customer and provider phone numbers, national IDs, credentials, and private documents are never public.
9. External providers are accessed through replaceable adapters with explicit mock/development modes.
10. No production secret is stored in Git, screenshots, logs, tests, pull requests, or documentation.

## Delivery rules
- `main` is protected by process: no direct implementation commits and no merge without explicit owner approval.
- Changes are committed in small, meaningful units.
- Each phase updates the implementation checklist, decision log, tests, and known limitations.
- Irreversible, financial, or legal-risk decisions require explicit owner approval when a safe adapter or reversible default is unavailable.
- Legal content is treated as software draft content pending review by qualified counsel.

## Definition of done
A capability is done only when its data model, authorization, validation, business behavior, failure states, audit behavior, tests, documentation, and operational configuration are implemented. A visually complete screen without those elements is not done.

The phrase «پروژه کامل شد» is prohibited until all mandatory items in `docs/IMPLEMENTATION_CHECKLIST.md` are checked and all mandatory quality gates pass.
