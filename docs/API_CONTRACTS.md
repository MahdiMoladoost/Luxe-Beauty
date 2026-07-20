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
- Money fields use integer tomans and end with `Toman`.
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

Authentication and account-discovery errors do not reveal whether an account exists. OTPs, password hashes, session tokens/hashes, raw IP addresses and national IDs never appear in errors or analytics.

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
  - input: `{ "challengeId", "code" }`
  - creates a two-factor-verified session.
- `POST /api/auth/password/request-reset`
  - enumeration-resistant response; sends a reset challenge only for eligible credential accounts.
- `POST /api/auth/password/reset`
  - verifies the reset OTP, updates the password and revokes every active session.
- `POST /api/auth/password/change`
  - requires an authenticated session and current password; updates the password, clears forced-change state and revokes every session.

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

## Target endpoint families

### Identity verification
- `GET /api/v1/identity/status`
- `POST /api/v1/identity/profile`
- `POST /api/v1/identity/verify`
- `GET /api/v1/identity/provider-mode` returns `mock`, `sandbox`, or `production` without secret configuration.

### Geography and search
- `GET /api/v1/geography/provinces`
- `GET /api/v1/geography/cities`
- `GET /api/v1/geography/districts`
- `GET /api/v1/geography/neighborhoods`
- `GET /api/v1/search/suggestions`
- `GET /api/v1/search/providers`
- `GET /api/v1/availability/today`

### Providers and onboarding
- `POST /api/v1/providers`
- `GET /api/v1/providers/me`
- `PATCH /api/v1/providers/me`
- `POST /api/v1/providers/{providerId}/branches`
- `POST /api/v1/providers/{providerId}/documents`
- `GET /api/v1/providers/{providerId}/verification`
- `POST /api/v1/professionals/affiliations`
- `POST /api/v1/professional-affiliations/{id}/approve`
- `POST /api/v1/professional-affiliations/{id}/terminate`

### Catalog and offerings
- `GET /api/v1/catalog/categories`
- `GET /api/v1/catalog/services`
- `POST /api/v1/providers/{providerId}/offerings`
- `PATCH /api/v1/offerings/{offeringId}`
- `POST /api/v1/offerings/{offeringId}/quote`
- `GET /api/v1/offerings/{offeringId}/availability`

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
