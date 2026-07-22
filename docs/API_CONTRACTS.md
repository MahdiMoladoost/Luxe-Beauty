# API Contracts

Target versioned base path: `/api/v1`.

Current operational authentication/RBAC compatibility routes use `/api/auth/*` and `/api/admin/rbac/*`. A future versioning migration must preserve a documented compatibility window.

Content type is JSON unless an upload/download contract states otherwise.

## Contract rules

- Validate every input boundary with Zod-compatible schemas and return explicit output DTOs.
- Normalize Persian/Arabic letters and digits before domain validation where applicable.
- Never expose ORM objects, credentials, OTP hashes, session hashes or sensitive identity values directly.
- Use opaque IDs and stable error codes.
- Cookie-authenticated mutations require same-origin/same-site checks.
- Require `Idempotency-Key` for booking holds, Booking creation, provider Booking decisions, payments, callbacks, refunds, wallet credits and other repeat-sensitive commands.
- Carry a correlation ID through requests, audit events and async work.
- Dates are ISO-8601 UTC values. UI-localized values are presentation concerns.
- Money is integer toman and serialized as decimal strings in API DTOs.
- Private URLs are short-lived signed URLs, never permanent public object URLs.
- Database uniqueness, foreign-key, exclusion and check-constraint failures are mapped to stable errors without exposing SQL details.

## Response envelopes

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

Authentication errors do not reveal whether an account exists. OTPs, passwords, session tokens/hashes, raw IP addresses and national IDs never appear in errors or analytics.

## Operational authentication and RBAC routes

### Customer OTP and account

- `POST /api/auth/otp/request`
- `POST /api/auth/otp/verify`
- `GET /api/auth/me`
- `PATCH /api/auth/me`

OTP requests enforce mobile/IP windows, resend cooldown and one active challenge per purpose. Development mock mode may include `developmentCode`; production never does.

### Staff/provider authentication

- `POST /api/auth/staff/login`
- `POST /api/auth/staff/verify-2fa`
- `POST /api/auth/password/request-reset`
- `POST /api/auth/password/reset`
- `POST /api/auth/password/change`

### Sessions and devices

- `POST /api/auth/logout`
- `POST /api/auth/logout-all`
- `GET /api/auth/sessions`
- `DELETE /api/auth/sessions/{sessionId}`

Ownership is enforced in the transaction. Cross-user IDs return not found.

### Roles and permissions

- `GET /api/admin/rbac/roles` requires `role.read`.
- `POST /api/admin/rbac/roles` requires `role.manage`.
- `GET /api/admin/rbac/permissions` requires `permission.read`.
- `POST /api/admin/rbac/permissions` requires `permission.manage`.

## Operational versioned marketplace routes

### Identity verification

- `GET /api/v1/identity/status`
- `POST /api/v1/identity/verify`
- `GET /api/v1/admin/identity/users/{userId}` requires review permission and recent step-up authentication.

### Providers and verification

- `POST /api/v1/providers`
- `GET /api/v1/providers/me`
- `GET /api/v1/providers/{providerId}`
- `POST /api/v1/providers/{providerId}/documents`
- `GET /api/v1/provider-documents/{documentId}/content`
- `POST /api/v1/providers/{providerId}/submit`
- `POST /api/v1/providers/{providerId}/appeal`
- `POST /api/v1/provider-documents/{documentId}/appeal`
- `GET /api/v1/admin/providers/review-queue`
- `POST /api/v1/admin/providers/{providerId}/review`
- `POST /api/v1/admin/provider-documents/{documentId}/review`

Private uploads validate MIME, size and signature, run the malware adapter, use private storage and write audit evidence. Reviewer access requires permission and reason.

### Provider branches

- `GET /api/v1/providers/{providerId}/branches`
- `POST /api/v1/providers/{providerId}/branches`
- `GET /api/v1/providers/{providerId}/branches/{branchId}`
- `PATCH /api/v1/providers/{providerId}/branches/{branchId}`
- `DELETE /api/v1/providers/{providerId}/branches/{branchId}?expectedUpdatedAt={ISO-8601}`

New branches are inactive and address-unverified. Location hierarchy is validated. Stale mutations return `VERSION_CONFLICT`. Owners cannot set `addressVerified`.

### Professional profile and bilateral affiliations

- `GET /api/v1/professionals/me`
- `PUT /api/v1/professionals/me`
- `GET /api/v1/professional-affiliations`
- `POST /api/v1/professional-affiliations`
- `PATCH /api/v1/professional-affiliations/{affiliationId}`

Activation and termination require counterparty action. Provider-side authority remains owner-only until scoped ABAC is implemented.

### Standard catalog

- `GET /api/v1/catalog/categories`
- `POST /api/v1/catalog/categories` requires `content.manage`.
- `POST /api/v1/catalog/services` requires `content.manage`.

Provider users cannot create arbitrary standard catalog records through Offering endpoints.

### Provider offerings

- `GET /api/v1/providers/{providerId}/offerings`
- `POST /api/v1/providers/{providerId}/offerings`
- `PATCH /api/v1/providers/{providerId}/offerings/{offeringId}`
- `DELETE /api/v1/providers/{providerId}/offerings/{offeringId}?expectedVersion={integer}`
- `GET /api/v1/offerings/{offeringId}`

Provider ownership, standard service, branch and active professional affiliation are checked. Supported initial price modes are `FIXED`, `STARTING_FROM`, `RANGE` and `AFTER_CONSULTATION`. `published=true` requires `active=true` and operational provider/target state.

### Server quote

- `POST /api/v1/offerings/{offeringId}/quote`

Input: `{ "quantity": 1 }`, maximum 20 and maximum total duration 1,440 minutes. The server reloads the Offering, calculates integer-toman money and duration, persists a 15-minute `ServiceQuote`, and snapshots Offering version and rules.

- `FIXED` is final and directly bookable.
- `STARTING_FROM` and `RANGE` are estimates.
- `AFTER_CONSULTATION` has no invented price.

Quote ownership, expiry, amount, duration, quantity and Offering-version consistency are revalidated during Hold and Booking creation.

### Shared schedule and availability

- `GET /api/v1/availability/schedules?ownerType=PROFESSIONAL|BRANCH&ownerId={uuid}`
- `PUT /api/v1/availability/schedules`
- `POST /api/v1/availability/exceptions`
- `DELETE /api/v1/availability/exceptions/{exceptionId}`
- `GET /api/v1/offerings/{offeringId}/availability?from={ISO}&to={ISO}&stepMinute=15&limit=60`

The initial availability path supports a maximum 31-day range and 200 slots. Professional-bound Offerings use the stable professional calendar across affiliations; otherwise the branch calendar is used.

### Service recipients

- `GET /api/v1/booking-recipients`
  - returns only non-deleted recipients owned by the current customer.
- `POST /api/v1/booking-recipients`
  - same-origin authenticated mutation;
  - input includes normalized name fields and optional valid date-only birth date, controlled gender code, relation, Iranian mobile and accessibility notes;
  - writes Audit Log evidence.

### Transactional booking holds

- `POST /api/v1/booking-holds`
  - requires verified identity, same-origin request and `Idempotency-Key`;
  - body: `{ "quoteId": "uuid", "startsAt": "ISO-8601 with offset" }`.
- `GET /api/v1/booking-holds/{holdId}`
- `DELETE /api/v1/booking-holds/{holdId}`

A Hold is created only for a valid final Quote and available interval. PostgreSQL Serializable transactions, advisory locks and a GiST exclusion constraint protect the stable professional/branch resource. Exact replay returns the same Hold. See `docs/BOOKING_HOLDS.md`.

### Atomic Hold-to-Booking conversion

- `POST /api/v1/bookings`
  - requires verified identity, same-origin request and `Idempotency-Key`;
  - body:

```json
{
  "holdId": "uuid",
  "recipientId": "uuid",
  "legalAcceptance": {
    "termsVersion": "published-version",
    "privacyVersion": "published-version",
    "bookingVersion": "published-version"
  },
  "questionnaireAnswers": {}
}
```

The command revalidates Hold ownership/state/expiry, Recipient ownership, complete Quote snapshot, Offering/provider/branch/professional eligibility, active affiliation, audience/age rules, required answers and current legal versions.

The client cannot submit price or duration. Booking, BookingItem, immutable snapshots, transitions, Hold consumption, Audit, Outbox and idempotency response are written in one Serializable transaction.

- no-payment `approval=INSTANT` -> `CONFIRMED`;
- no-payment `approval=MANUAL` -> `AWAITING_PROVIDER_APPROVAL` with a bounded deadline;
- online/deposit/prepaid policies -> `PAYMENT_FLOW_REQUIRED` until the payment path is implemented.

A consumed Hold remains the authoritative resource allocation. The `ACTIVE` + `CONSUMED` GiST exclusion predicate prevents an allocation gap during conversion.

- `GET /api/v1/bookings/{bookingId}`
  - customer-owner only; cross-user IDs return `BOOKING_NOT_FOUND`.

See `docs/HOLD_TO_BOOKING.md`.

### Provider Booking approval and rejection

- `POST /api/v1/bookings/{bookingId}/provider-approve`
  - current authority is the owning `ProviderOrganization.ownerUserId`;
  - requires same-origin request and `Idempotency-Key`;
  - body: `{ "expectedVersion": 1 }`.
- `POST /api/v1/bookings/{bookingId}/provider-reject`
  - same ownership and idempotency requirements;
  - body: `{ "expectedVersion": 1, "reasonCode": "PROFESSIONAL_UNAVAILABLE", "reason": "..." }`.

Only `AWAITING_PROVIDER_APPROVAL` bookings before `approvalDeadlineAt` are eligible. Approval moves the Booking to `CONFIRMED` and preserves the consumed allocation. Rejection moves it to `REJECTED`, records a controlled reason and releases the allocation.

A late provider command atomically expires the Booking and releases the allocation. A BullMQ scheduler runs the same expiry transition every minute for overdue no-payment bookings. Payment-linked records are not mutated by this bounded path.

Cross-provider IDs return `BOOKING_NOT_FOUND`. Exact replay returns the same Booking; changed payload with the same key returns `IDEMPOTENCY_CONFLICT`. See `docs/PROVIDER_BOOKING_APPROVAL.md`.

## Target endpoint families still open

### Geography and search

- `GET /api/v1/geography/provinces`
- `GET /api/v1/geography/cities`
- `GET /api/v1/geography/districts`
- `GET /api/v1/geography/neighborhoods`
- `GET /api/v1/search/suggestions`
- `GET /api/v1/search/providers`
- `GET /api/v1/availability/today`

### Provider operations

- private-address verification;
- provider staff memberships and scoped role assignments;
- professional discovery and privacy-safe invitation lookup;
- service areas, travel rules and resource/capacity configuration;
- provider pending-booking list and delegated decision authority.

### Catalog and availability

- category/service edit, deactivate, ordering and admin UI;
- variants, add-ons, packages and full questionnaire definitions;
- calculated and location-aware pricing;
- resources, capacity, holidays, leave and travel time;
- multi-service contiguous availability, alternatives and waitlist;
- quote-expiry jobs and cache invalidation.

### Booking lifecycle

- payment-backed provider approval/rejection and refund orchestration;
- `POST /api/v1/bookings/{bookingId}/cancel`
- `POST /api/v1/bookings/{bookingId}/reschedule-proposals`
- `POST /api/v1/reschedule-proposals/{proposalId}/accept`
- `POST /api/v1/bookings/{bookingId}/check-in`
- `POST /api/v1/bookings/{bookingId}/complete`
- `POST /api/v1/bookings/{bookingId}/dispute`
- `POST /api/v1/waitlist`

### Consultation and messaging

- consultation requests and proposals;
- conversations and messages;
- resumable/private upload completion.

### Payment and ledger

- payment creation and mock confirmation;
- signed callbacks/webhooks;
- refunds and reconciliation;
- wallet, ledger and settlement reads.

### Reviews and support

- verified reviews, responses and reports;
- support tickets and complaints;
- dispute evidence and appeal.

## Command response pattern

Commands return the changed resource summary, current version and permitted next actions. They do not imply completion of asynchronous external delivery.

OpenAPI generation is planned from validated schemas. Breaking changes require a versioned endpoint or an explicit migration period.
