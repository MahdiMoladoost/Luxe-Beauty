# Catalog, Pricing and Availability

## Status

This document describes the first operational Phase 5 vertical slice. The code is committed on `rebuild/full-platform` and remains pending a fresh reproducible CI run. It is not a claim that packages, variants, complex questionnaires, resources, multi-service optimization or transactional booking holds are complete.

## Standard catalog

`ServiceCategory` and `StandardService` remain platform-owned records.

Operational contracts:

- `GET /api/v1/catalog/categories` returns active categories and active standard services.
- `POST /api/v1/catalog/categories` requires `content.manage`, normalizes Persian text, validates an optional active parent and audits creation.
- `POST /api/v1/catalog/services` requires `content.manage`, validates the active category and audits creation.

Slugs are explicit lowercase Latin identifiers. Duplicate slugs return a stable conflict response. Provider users cannot create arbitrary standard services through provider APIs.

## Provider offerings

Operational contracts:

- `GET /api/v1/providers/{providerId}/offerings`
- `POST /api/v1/providers/{providerId}/offerings`
- `PATCH /api/v1/providers/{providerId}/offerings/{offeringId}`
- `DELETE /api/v1/providers/{providerId}/offerings/{offeringId}?expectedVersion={integer}`
- `GET /api/v1/offerings/{offeringId}` for public published data.

Current authority is provider-owner only. Delegated provider/branch staff ABAC remains open.

Creation requires:

- an approved provider;
- an active standard service;
- a branch belonging to the provider when `branchId` is set;
- a verified active professional who owns the provider or has an active bilateral affiliation with the provider/branch when `professionalId` is set.

Publishing additionally requires:

- provider `bookingEnabled=true`;
- active branch when branch-bound;
- active verified professional when professional-bound;
- `published=true` implies `active=true`, enforced by PostgreSQL.

Updates use the Offering integer `version`. Stale writes return `VERSION_CONFLICT`. Archive is a soft delete that disables publication while preserving historical references and audit evidence.

## Pricing

All money is integer toman and serialized to clients as decimal strings.

Implemented models:

- `FIXED`: final and directly bookable in the future booking slice.
- `STARTING_FROM`: estimate only; not a final booking price.
- `RANGE`: estimate only; not a final booking price.
- `AFTER_CONSULTATION`: no invented price; consultation is required.

The remaining schema enum values (`CALCULATED`, `PACKAGE`, `VARIANT`, `ADDON`, `BY_LOCATION`) are intentionally rejected until their dedicated rule engines and tests exist.

PostgreSQL constraints enforce non-negative amounts, valid ranges, duration/buffer bounds, positive version and publication state. Domain policy rejects unsupported combinations before persistence when possible.

## Quotes and snapshots

`POST /api/v1/offerings/{offeringId}/quote` is available to guests and authenticated users. It:

1. reloads the currently published Offering from PostgreSQL;
2. calculates money and duration server-side;
3. stores a `ServiceQuote` with a 15-minute expiry;
4. stores an immutable application-level snapshot containing Offering version, provider/branch/professional IDs, pricing model, duration formula, audience rules, booking policy, pricing rules and calculation result;
5. returns decimal-string toman amounts and flags `finalPrice` and `directlyBookable`.

A Quote may not exceed 1,440 minutes. Booking creation must later reject expired Quotes and Quotes whose `directlyBookable` flag is false unless a completed consultation produces a final replacement Quote.

## Shared availability calendar

Schedule ownership is explicit:

- `PROFESSIONAL`: one calendar per stable `ProfessionalProfile`, shared across every salon affiliation and independent activity.
- `BRANCH`: branch-capacity calendar for offerings not assigned to a specific professional.

A professional-bound Offering always uses the professional calendar. It never creates a separate calendar per salon, preserving cross-salon conflict detection.

Operational contracts:

- `GET /api/v1/availability/schedules?ownerType=...&ownerId=...`
- `PUT /api/v1/availability/schedules`
- `POST /api/v1/availability/exceptions`
- `DELETE /api/v1/availability/exceptions/{exceptionId}`
- `GET /api/v1/offerings/{offeringId}/availability?from=...&to=...&stepMinute=...&limit=...`

Only the professional can manage their professional calendar. Only the owning provider can manage a branch calendar. Cross-owner IDs return not found.

Weekly schedule replacement is Serializable and requires `expectedUpdatedAt`, including `null` for the first write. Stale replacement returns `VERSION_CONFLICT`. Active weekly windows may not overlap on the same day. The current supported timezone is explicitly `Asia/Tehran`.

Exceptions are append-only calendar facts until explicitly deleted by the authorized owner:

- `CLOSED` subtracts time from weekly/extra windows.
- `AVAILABLE` adds a temporary window.

Public availability generation:

1. limits the requested range to 31 days and result count to 200;
2. builds timezone-aware weekly windows;
3. adds `AVAILABLE` and subtracts `CLOSED` exceptions;
4. subtracts occupied intervals from blocking Booking statuses;
5. removes past slots;
6. returns UTC ISO-8601 starts and ends with the presentation timezone.

## Explicit remaining work

- configurable variants, add-ons, packages and questionnaires;
- calculated/location pricing and consultation-to-final-quote workflow;
- resource/capacity calendars and group services;
- schedule templates, holidays, leave approval and travel time;
- multi-service contiguous availability and alternatives;
- transactional holds, exclusion constraints and concurrent booking confirmation;
- delegated schedule permissions and complete provider/branch ABAC;
- expiry jobs for Quotes and schedule cache invalidation;
- public search ranking and SEO integration;
- fresh CI, runtime smoke, E2E and accessibility verification for this slice.
