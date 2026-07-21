# API Contracts

Target versioned base path: `/api/v1`.

Current operational authentication/RBAC compatibility routes use `/api/auth/*` and `/api/admin/rbac/*` while the remaining versioned marketplace API is implemented. A future versioning migration must preserve a documented compatibility window.

Content type: JSON unless an upload/download contract states otherwise.

## Contract rules
- Validate every input boundary with Zod-compatible schemas and return explicit output DTOs.
- Normalize Persian/Arabic letters and digits before domain validation where applicable.
- Never expose ORM objects, credentials, OTP hashes, session hashes or sensitive identity values directly.
- Use opaque IDs and stable error codes.
- Cookie-authenticated mutations require same-origin/same-site request checks.
- Require `Idempotency-Key` for booking holds, booking confirmation, payment creation, callbacks, refunds, wallet credits, and other repeat-sensitive commands.
- Carry a correlation ID through requests, audit events and async work.
- Pagination uses opaque cursors for operational lists and explicit page metadata for SEO/public pages.
- Dates are ISO-8601 UTC values. UI-localized values are presentation concerns.
- Money fields use integer tomans and are serialized as decimal strings ending in `Toman` in field names.
- Private URLs are short-lived signed URLs, never permanent public object URLs.

## Current response envelopes

Success:

```json
{
  "ok": true,
  "data": {}
}
```

Error:

```json
{
  "ok": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "دسترسی لازم برای این عملیات وجود ندارد.",
    "details": {}
  },
  "correlationId": "opaque-id"
}
```

Authentication and account-discovery errors do not reveal whether an account exists. OTPs, password hashes, session tokens/hashes, raw IP addresses and national IDs never appear in errors or analytics. Database uniqueness, foreign-key and check-constraint failures are mapped to stable safe errors without exposing SQL details.

## Operational authentication and RBAC routes

### Customer OTP and account
- `POST /api/auth/otp/request`
  - input: `{ "mobile": "09..." }`
  - enforces mobile/IP rate windows, resend cooldown and one active challenge per purpose.
  - development mock mode may include `developmentCode`; production never does.
- `POST /api/auth/otp/verify`
  - input: `{ "mobile", "challengeId", "code" }`
  - consumes the code once, creates/activates the customer, ensures the customer role and sets a secure session cookie.
- `GET /api/auth/me`
  - returns the current account/profile/identity status/roles/permissions without sensitive credential material.
- `PATCH /api/auth/me`
  - updates normalized first and last name and audits the mutation.

### Staff/provider authentication
- `POST /api/auth/staff/login`
  - input: `{ "mobile", "password" }`
  - mobile-only; verifies the versioned memory-hard password hash, applies temporary lockout and starts SMS 2FA when required.
- `POST /api/auth/staff/verify-2fa`
- `POST /api/auth/password/request-reset`
- `POST /api/auth/password/reset`
- `POST /api/auth/password/change`

### Sessions and devices
- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `GET /api/auth/sessions`
- `DELETE /api/auth/sessions/{sessionId}`
  - ownership is enforced in the transaction; cross-user IDs return not found and are never revoked.

### Roles and permissions
- `GET /api/admin/rbac/roles` requires `role.read`.
- `POST /api/admin/rbac/roles` requires `role.manage` and atomically writes role, role-permission links and audit evidence.
- `GET /api/admin/rbac/permissions` requires `permission.read`.
- `POST /api/admin/rbac/permissions` requires `permission.manage` and atomically writes permission and audit evidence.

## Operational versioned marketplace routes

### Identity verification
- `GET /api/v1/identity/status`
- `POST /api/v1/identity/verify`
- `GET /api/v1/admin/identity/users/{userId}` requires identity review permission and recent step-up authentication for sensitive access.

### Providers and verification
- `POST /api/v1/providers`
  - creates a persisted provider application in draft status and assigns the matching provider role.
- `GET /api/v1/providers/me`
- `GET /api/v1/providers/{providerId}`
- `POST /api/v1/providers/{providerId}/documents`
  - private multipart upload; validates MIME/size/signature, runs the malware adapter, stores privately and writes audit evidence.
- `GET /api/v1/provider-documents/{documentId}/content`
  - owner or authorized reviewer only; reviewer access requires a reason and is audited.
- `POST /api/v1/providers/{providerId}/submit`
- `POST /api/v1/providers/{providerId}/appeal`
- `POST /api/v1/provider-documents/{documentId}/appeal`
- `GET /api/v1/admin/providers/review-queue`
- `POST /api/v1/admin/providers/{providerId}/review`
- `POST /api/v1/admin/provider-documents/{documentId}/review`

### Provider branches
- `GET /api/v1/providers/{providerId}/branches`
- `POST /api/v1/providers/{providerId}/branches`
  - creates an inactive, unverified branch after validating city/district/neighborhood hierarchy.
- `GET /api/v1/providers/{providerId}/branches/{branchId}`
- `PATCH /api/v1/providers/{providerId}/branches/{branchId}`
  - requires `expectedUpdatedAt`; stale mutations return `VERSION_CONFLICT`.
  - `active=true` is rejected until the provider organization is approved.
- `DELETE /api/v1/providers/{providerId}/branches/{branchId}?expectedUpdatedAt={ISO-8601}`
  - soft deletes and deactivates the branch while preserving historical references.

The owner cannot set `addressVerified`. Exact-address storage, Neshan integration and delegated branch staff remain open. See `docs/PROVIDER_BRANCHES.md`.

### Professional profile and bilateral affiliations
- `GET /api/v1/professionals/me`
- `PUT /api/v1/professionals/me`
- `GET /api/v1/professional-affiliations`
- `POST /api/v1/professional-affiliations`
  - professional request: `{ "organizationId", "branchId?" }`.
  - provider request: `{ "organizationId", "professionalProfileId", "branchId?", "permissions?" }`.
- `PATCH /api/v1/professional-affiliations/{affiliationId}`
  - actions: `ACCEPT`, `REJECT`, `REQUEST_TERMINATION`, `ACCEPT_TERMINATION`, `REJECT_TERMINATION`.
  - the requester cannot accept their own request; termination also requires counterparty action.

Provider-side authority is owner-only until provider/branch scoped ABAC is implemented. See `docs/PROFESSIONAL_AFFILIATIONS.md`.

### Standard catalog
- `GET /api/v1/catalog/categories`
  - public; returns active categories with active standard services.
- `POST /api/v1/catalog/categories`
  - requires `content.manage`.
  - input: `{ "parentId?", "nameFa", "nameEn?", "slug" }`.
- `POST /api/v1/catalog/services`
  - requires `content.manage`.
  - input: `{ "categoryId", "titleFa", "titleEn?", "slug", "description?" }`.

Provider users cannot create arbitrary standard catalog records through Offering endpoints.

### Provider offerings
- `GET /api/v1/providers/{providerId}/offerings`
  - provider-owner scoped list including drafts and inactive records.
- `POST /api/v1/providers/{providerId}/offerings`
  - provider must be approved.
  - validates standard service, branch ownership and active professional affiliation.
  - supported price models in this slice: `FIXED`, `STARTING_FROM`, `RANGE`, `AFTER_CONSULTATION`.
  - money inputs are digit-only decimal strings, for example `"650000"` toman.
- `PATCH /api/v1/providers/{providerId}/offerings/{offeringId}`
  - requires integer `expectedVersion` in the body; stale writes return `VERSION_CONFLICT`.
- `DELETE /api/v1/providers/{providerId}/offerings/{offeringId}?expectedVersion={integer}`
  - soft archive; disables `active` and `published`.
- `GET /api/v1/offerings/{offeringId}`
  - public only when Offering, provider, standard service and assigned branch/professional are operational.

`published=true` requires `active=true` and is enforced by PostgreSQL. Publishing also requires `bookingEnabled=true`, an active branch when branch-bound, and an active verified professional when professional-bound.

### Server quote
- `POST /api/v1/offerings/{offeringId}/quote`
  - guest or authenticated caller; same-origin mutation check applies.
  - input: `{ "quantity": 1 }`, maximum 20 and maximum total duration 1,440 minutes.
  - reloads the Offering, calculates integer-toman money and duration on the server, persists a 15-minute `ServiceQuote`, and snapshots Offering version and rules.
  - `FIXED` returns `finalPrice=true` and `directlyBookable=true`.
  - `STARTING_FROM` and `RANGE` return explicit estimates with `directlyBookable=false`.
  - `AFTER_CONSULTATION` returns no invented price and requires consultation.

Quote expiry enforcement during booking, calculated pricing, package/variant/add-on/location pricing and consultation-to-final-quote are still open.

### Shared schedule and availability
- `GET /api/v1/availability/schedules?ownerType=PROFESSIONAL|BRANCH&ownerId={uuid}`
  - owner-only; cross-owner IDs return not found.
- `PUT /api/v1/availability/schedules`
  - input includes `ownerType`, `ownerId`, `expectedUpdatedAt` and up to 50 weekly rules.
  - first write uses `expectedUpdatedAt=null`; stale replacement returns `VERSION_CONFLICT`.
  - current timezone is explicitly `Asia/Tehran`; active rules on one day may not overlap.
- `POST /api/v1/availability/exceptions`
  - creates `CLOSED` or `AVAILABLE` range for an authorized schedule owner.
- `DELETE /api/v1/availability/exceptions/{exceptionId}`
- `GET /api/v1/offerings/{offeringId}/availability?from={ISO}&to={ISO}&stepMinute=15&limit=60`
  - public, maximum range 31 days and maximum 200 slots.
  - professional-bound Offering uses the stable professional calendar across all affiliations; otherwise branch calendar is used.
  - combines weekly rules and exceptions, subtracts blocking Booking intervals and past time, and returns UTC slot ranges.

Complete rules, limitations and examples are in `docs/CATALOG_PRICING_AVAILABILITY.md`.

## Target endpoint families still open

### Geography and search
- `GET /api/v1/geography/provinces`
- `GET /api/v1/geography/cities`
- `GET /api/v1/geography/districts`
- `GET /api/v1/geography/neighborhoods`
- `GET /api/v1/search/suggestions`
- `GET /api/v1/search/providers`
- `GET /api/v1/availability/today`

### Provider operations still open
- branch private-address and verification contracts;
- provider staff memberships and scoped role assignments;
- professional discovery and privacy-safe invitation lookup;
- service areas, travel rules and resource/capacity configuration.

### Catalog and availability still open
- category/service edit, deactivate, ordering and admin UI;
- variants, add-ons, packages and questionnaires;
- calculated and location-aware pricing;
- resources, capacity, holidays, leave and travel time;
- multi-service contiguous availability, alternatives and waitlist;
- quote expiry jobs, cache invalidation and transactional booking holds.

### Booking
- `POST /api/v1/booking-recipients`
- `POST /api/v1/booking-holds`
- `GET /api/v1/booking-holds/{holdId}`
- `POST /api/v1/bookings`
- `GET /api/v1/bookings/{bookingId}`
- `POST /api/v1/bookings/{bookingId}/provider-approve`
- `POST /api/v1/bookings/{bookingId}/provider-reject`
- `POST /api/v1/bookings/{bookingId}/cancel`
- `POST /api/v1/bookings/{bookingId}/reschedule-proposals`
- `POST /api/v1/reschedule-proposals/{proposalId}/accept`
- `POST /api/v1/bookings/{bookingId}/check-in`
- `POST /api/v1/bookings/{bookingId}/complete`
- `POST /api/v1/bookings/{bookingId}/dispute`
- `POST /api/v1/waitlist`

### Consultation and messaging
- `POST /api/v1/consultations`
- `POST /api/v1/consultations/{id}/proposals`
- `POST /api/v1/conversations`
- `GET /api/v1/conversations/{id}/messages`
- `POST /api/v1/conversations/{id}/messages`
- `POST /api/v1/uploads/initiate`
- `POST /api/v1/uploads/{uploadId}/complete`

### Payment and ledger
- `POST /api/v1/payments`
- `POST /api/v1/payments/{paymentId}/confirm-mock`
- `POST /api/v1/payment-webhooks/{provider}`
- `POST /api/v1/refunds`
- `GET /api/v1/wallet`
- `GET /api/v1/ledger/transactions`
- `GET /api/v1/settlements`

### Reviews and support
- `POST /api/v1/reviews`
- `POST /api/v1/reviews/{reviewId}/response`
- `POST /api/v1/reviews/{reviewId}/report`
- `POST /api/v1/support/tickets`
- `POST /api/v1/complaints`
- `GET /api/v1/disputes/{id}`
- `POST /api/v1/disputes/{id}/evidence`
- `POST /api/v1/disputes/{id}/appeal`

### Administration
Admin endpoints use the same application services and server-side permission policies, including users, providers, verification, bookings, finance, plans, SMS, content, geography, policies, feature flags, reports, audit, queue health, service health, roles, permissions, and global settings.

## Command response pattern
Commands return the changed resource summary, current version, and permitted next actions. They do not imply completion of asynchronous external delivery.

OpenAPI generation is planned from validated schemas. Any breaking contract change requires a versioned endpoint or an explicit migration period.
