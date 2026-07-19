# Master Requirements and Traceability

Source of truth: the owner's master platform brief supplied on 2026-07-20.

This document converts the brief into stable requirement groups. Detailed implementation tasks are tracked in `IMPLEMENTATION_CHECKLIST.md`; architecture and behavior details live in the linked domain documents.

| ID | Requirement group | Mandatory outcome |
|---|---|---|
| MR-001 | Product scope | Nationwide beauty booking marketplace for salons, branches, independent, home, home-studio, and hybrid providers. |
| MR-002 | Geography | Admin-managed provinces, cities, districts, and neighborhoods; initial operations for Tehran, Karaj, Mashhad, Isfahan, Shiraz, Tabriz, Qom, Ahvaz, and Rasht. |
| MR-003 | Legacy replacement | Rebuild admin, customer, provider, and authentication business flows; remove hardcoded demo data from core logic. |
| MR-004 | Project memory | Maintain constitution, requirements, architecture, schema, contracts, permissions, state machines, checklist, decisions, tests, integrations, security, deployment, and limitations docs. |
| MR-005 | Git workflow | Feature branch, topical commits, tests per phase, no secrets, draft PR to `main`, no merge without owner approval. |
| MR-006 | Runtime | npm and Docker workflows; application on port 5000; web, PostgreSQL, Redis, MinIO, worker, and production-like Nginx. |
| MR-007 | Architecture | Strict TypeScript Next.js App Router modular monolith with domain/application/infrastructure/UI boundaries, repositories/services, adapters, transactions, idempotency, outbox, audit, and soft delete where appropriate. |
| MR-008 | Localization | Complete RTL Persian UX, input normalization, UTC storage, Iran timezone display, Gregorian persistence, Jalali presentation. |
| MR-009 | Brand and accessibility | Light luxury design, restrained rose-gold accents, licensed readable Persian font, responsive UI, WCAG 2.1 AA target, replaceable logo/theme foundation. |
| MR-010 | Business model | Subscription-first revenue, SMS packs, advertising, featured placement, campaigns, platform services; commission infrastructure defaults to zero and is versioned. |
| MR-011 | Plans | Configurable Basic, Professional, Premium plans by provider type, quotas, features, test prices, trial, renewal grace, and booking suspension rules. |
| MR-012 | Customer workspace | Real customer dashboard for profile, KYC, bookings, payments, refunds, ledger wallet, referrals, favorites, reviews, consultation, chat, notifications, addresses, recipients, tickets, complaints, privacy, deletion, and session controls. |
| MR-013 | Provider workspaces | Separate real workspaces for salons/groups and independent professionals covering branches, services, staff, schedules, resources, bookings, waitlist, customers, content, reviews, campaigns, subscription, SMS, finance, reports, users, documents, verification, settings, support, and notifications. |
| MR-014 | Admin workspace | Configurable roles and permissions plus operational management for users, providers, KYC, bookings, finance, ledger, refunds, settlements, disputes, subscriptions, SMS, ads, commission, content, catalog, geography, policies, flags, reports, audit, queues, health, security, and global settings. |
| MR-015 | Customer authentication | Mobile OTP account creation; complete verified identity before first booking; pluggable identity provider with clearly labelled development mock. |
| MR-016 | Sensitive identity | National ID uniqueness via HMAC/hash, reversible encrypted value with environment key, no logs/public display, restricted audited access. |
| MR-017 | Staff authentication | Mobile plus Argon2id password, SMS 2FA, recovery, session/device controls, rate limits, audit, suspicious-login alerts; initial super-admin from environment and forced password change. |
| MR-018 | Provider onboarding | Fast registration, configurable document requirements/statuses, private storage, manual review, home-location verification, expiry/review workflows, appeals, and booking restrictions. |
| MR-019 | Professional affiliations | Many-to-many professional-location relationships with bilateral approval, per-location access/services/prices, preserved history/ratings, and a shared conflict-free calendar. |
| MR-020 | Audience rules | Configurable gender/target groups, age limits, guardian consent/presence, per-service and per-location overrides within admin safety bounds. |
| MR-021 | Booking recipients | Distinguish booking customer and service recipient; support booking for others and configurable higher verification/consent rules. |
| MR-022 | Service catalog | Hierarchical standard catalog, provider customization, variants, add-ons, packages, combined and consultation services, media, warnings, duration, pricing, location, audience, resources, questionnaires, policies, and publication. |
| MR-023 | Pricing engine | Fixed/from/range/consultation/calculated/package/variant/add-on/location models; configurable factors; questionnaire calculations; consented post-booking price changes; immutable snapshots/history. |
| MR-024 | Consultation | Internal chat/media, scheduled audio/video, in-person consultation, free/paid/creditable modes, expiring locked proposals, private scanned files, and retention controls. |
| MR-025 | Availability | Weekly schedules, shifts, breaks, leave, holidays, emergencies, capacity, resources, service buffers, travel, provider/branch rules, subscription and verification eligibility. |
| MR-026 | Booking concurrency | Database transaction plus lock/constraint, expiring holds, idempotency keys, Redis only as supplementary protection. |
| MR-027 | Multi-service booking | Sequential services, same/different professionals, add-ons/packages, resource/travel/price calculation, and actionable alternatives when combinations fail. |
| MR-028 | Booking state machine | Instant/manual approval, response SLA, expiry and alternatives, fully documented/tested lifecycle from draft through finalization/refund/dispute. |
| MR-029 | Payments | Configurable no deposit/fixed/percentage/full/onsite policies; marketplace-ready and independent-gateway adapters; platform gateway limited to platform revenue; mock callbacks/webhooks/refunds/reconciliation. |
| MR-030 | Ledger and settlement | Double-entry-style accounts/entries, holds/releases/refunds/partial refunds/settlements/reconciliation/payouts/revenue/commission/adjustments/dispute holds. |
| MR-031 | Attendance and completion | Expiring per-booking attendance OTP, fallback confirmations, completion declaration, 24-hour dispute window, automatic finalization, audit. |
| MR-032 | Cancellation and no-show | Versioned visible accepted policies, admin bounds, provider settings, automatic penalties/refunds, appealable no-show. |
| MR-033 | Delay and reschedule | Configurable delay choices, consent for service/price changes, free and approved reschedule rules, revalidation, safe resource release/relock, full history. |
| MR-034 | Provider cancellation | Full refund, alternatives/compensation, performance impact, configurable enforcement thresholds and appeals. |
| MR-035 | Disputes | Immutable case workflow, evidence snapshots, support and finance decisions, second-level appeal, auditable outcomes. |
| MR-036 | Customer home service | Service polygons/radii/cities/neighborhoods, travel pricing/time, minimums, privacy-preserving address reveal, restricted audited access. |
| MR-037 | Professional home studio | Separate service settings, price/duration/audience/schedule/policy/privacy; exact address only after confirmed eligible booking. |
| MR-038 | Internal messaging | Text/media/files/replies/status/search/report/block/close/history, booking/consultation linkage, contact-sharing detection with appealable moderation, audited support access. |
| MR-039 | Notifications | In-app, SMS, PWA push, future email/WhatsApp adapters; transactional events, reminders, idempotency, retries and preference rules. |
| MR-040 | Kavenegar | Direct adapter using environment/panel templates, mock provider, delivery status, retry/backoff, usage reports, deduplication and rate limiting. |
| MR-041 | SMS quota | Monthly plan quota, purchased packs, balances, categorized usage, expiry/priority/gifts/retries/alerts and platform-gateway purchase flow. |
| MR-042 | Neshan maps | Adapter for map, selection, geocoding, reverse geocoding, distance/routes when supported, search, polygons, radius, clusters and results map; explicit mock mode. |
| MR-043 | Waitlist | Requested service/provider/branch/date/window, release notifications, short first-accept hold, configurable ordering, safe booking and reporting. |
| MR-044 | Search | Persian normalization, spelling variants, combined intent, geography/service/provider matching, recents/popularity/nearby, PostgreSQL FTS/pg_trgm initial implementation and replaceable search adapter. |
| MR-045 | Ranking and ads | Configurable organic ranking; clearly labelled sponsored placement with impression/click/conversion reporting. |
| MR-046 | Filters | Full location, provider, service, audience, price, quality, availability, policy, payment, home-service and facility filters with removable chips. |
| MR-047 | Reviews | Verified completed-service/consultation eligibility, verified full name notice, multi-axis ratings, media, provider response, moderation, appeal, edit history and auditable removal. |
| MR-048 | Portfolios | Consent-aware moderated public media linked to provider/service/city/price/booking; separate public/private storage and infringement reporting. |
| MR-049 | Homepage | Search-and-book-first responsive home with configurable announcement/header/hero/trust/catalog/availability/nearby/featured/deals/professionals/portfolios/cities/how-to/reviews/quality/provider/PWA/magazine/FAQ/footer sections; no fabricated metrics. |
| MR-050 | Footer and support | Dynamic legal/support/contact/hours/social/network/city/service links; hide absent social URLs; configurable legal entity fields. |
| MR-051 | Global UI states | Support/chat, back-to-top, city, bookings, status, mobile booking CTA, toasts, notification center; avoid competing popups. |
| MR-052 | Error/empty states | Actionable handling for coverage, availability, geolocation, connectivity, inactive providers, consultation pricing, auth, discounts, payment, OTP, concurrency, subscription, documents, SMS, uploads, maps and external outages. |
| MR-053 | Promotions and advertising | Configurable coupon/credit/referral rules and paid placements/campaigns with approval, invoices, metrics and payments. |
| MR-054 | Wallet and referrals | Ledger-based credit types, expiry/restrictions/priority/returns/audit/anti-abuse; referral rewards after valid completed booking and self-referral prevention. |
| MR-055 | Loyalty | Feature-flagged configurable points, tiers, rewards, rebooking, consented birthday offers, completion and valid-review rewards. |
| MR-056 | Professional extensions | Feature-flagged wedding/group bookings, personalization, off-peak offers, consumable inventory, accounting adapters, permitted product commerce and rule-based recommendation adapter without medical claims. |
| MR-057 | Content management | Admin-controlled homepage, order, titles, banners, geography, pages, articles, FAQ, laws, contact, plans, pricing, quotas, commission, policies, SMS templates, flags, SEO, logo/favicon/media; version risky content. |
| MR-058 | Legal acceptance | Editable software-draft legal pages with counsel warning; versioned acceptance for sensitive actions. |
| MR-059 | Deletion and retention | Block deletion with open bookings/disputes, retain legally necessary finance, delete/anonymize unnecessary PII, export before deletion, audited configurable retention. |
| MR-060 | Security | OWASP controls, secure cookies/headers/CSP/HSTS, rate limits, session rotation, secure hashing/encryption, signed URLs, safe uploads/malware adapter, sanitized logs, backups, permission tests and step-up auth. |
| MR-061 | Storage | Development MinIO/local adapter and production S3-compatible storage with separated namespaces, signed URLs, validation, scan state, ownership, lifecycle and secure deletion. |
| MR-062 | SEO | Dynamic metadata/canonical/OG/sitemap/robots/breadcrumb/pagination/stable slugs/redirects/404/410/index controls/internal links and accurate structured data. |
| MR-063 | Accessibility | WCAG 2.1 AA target, keyboard/focus/labels/errors/contrast/alt/touch/zoom/reduced motion/screen reader/RTL/loading/layout stability plus automated and manual checks. |
| MR-064 | PWA | Manifest/icons/service worker/install/offline/update/push/deep links/permissions and safe cache rules excluding sensitive booking data. |
| MR-065 | Seed data | Complete development-only labelled test seeds for nine cities, business entities and specified test roles/scenarios; no production demo seeding. |
| MR-066 | Testing | Unit, integration, E2E and security coverage for listed business flows; no deleting/skipping tests merely to turn CI green. |
| MR-067 | CI/CD | Install/cache/lint/typecheck/unit/integration/build/Prisma/migrations/Docker/security/E2E using GitHub Secrets only. |
| MR-068 | Operations | Health/readiness/liveness, structured logs/correlation IDs, error/metrics adapters, queue/DLQ, encrypted scheduled backups, restore docs/tests, lifecycle/log rotation and admin health. |
| MR-069 | Reporting | Role-scoped real metrics, Jalali date filters, period comparison and CSV/Excel/PDF where appropriate; no hardcoded figures. |
| MR-070 | Secret handling | Never request secrets in public chat or Git; `.env.example` names only; local/GitHub Secrets guidance; warn and rotate on exposure. |
| MR-071 | Delivery output | Source, branch, draft PR, real DB/schema/migrations/seed/backends/panels/API/docs/Docker/worker/PWA/tests/CI/env/readmes/security/test/integration reports and no legacy hardcoded business panels. |

## Traceability rule
Every implementation commit must reference one or more requirement IDs in the updated checklist or decision log. Requirements remain open until code, tests, documentation, and operational behavior are all present.
