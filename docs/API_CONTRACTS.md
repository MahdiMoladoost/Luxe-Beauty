# API Contracts

Base path: `/api/v1`
Content type: JSON unless an upload/download contract states otherwise.

## Contract rules
- Validate every input and output boundary with Zod-compatible schemas.
- Normalize Persian/Arabic letters and digits before domain validation where applicable.
- Never expose ORM objects directly.
- Use opaque IDs and stable error codes.
- Require `Idempotency-Key` for booking holds, booking confirmation, payment creation, callbacks, refunds, wallet credits, and other repeat-sensitive commands.
- Return a correlation ID in `X-Correlation-Id`.
- Pagination uses opaque cursors for operational lists and explicit page metadata for SEO/public pages.
- Dates are ISO-8601 UTC values. UI-localized values are presentation concerns.
- Money fields use integer tomans and end with `Toman`.
- Private URLs are short-lived signed URLs, never permanent public object URLs.

## Error envelope

```json
{
  "error": {
    "code": "BOOKING_SLOT_UNAVAILABLE",
    "message": "این زمان دیگر در دسترس نیست.",
    "fieldErrors": {},
    "retryable": false,
    "correlationId": "opaque-id"
  }
}
```

Authentication and account-discovery errors must not reveal whether an account exists.

## Initial endpoint families

### Authentication and sessions
- `POST /auth/customer/otp/request`
- `POST /auth/customer/otp/verify`
- `POST /auth/staff/login`
- `POST /auth/staff/2fa/verify`
- `POST /auth/password/recovery/request`
- `POST /auth/password/recovery/confirm`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `GET /auth/sessions`
- `DELETE /auth/sessions/{sessionId}`

### Identity verification
- `GET /identity/status`
- `POST /identity/profile`
- `POST /identity/verify`
- `GET /identity/provider-mode` returns `mock`, `sandbox`, or `production` without secret configuration.

### Geography and search
- `GET /geography/provinces`
- `GET /geography/cities`
- `GET /geography/districts`
- `GET /geography/neighborhoods`
- `GET /search/suggestions`
- `GET /search/providers`
- `GET /availability/today`

### Providers and onboarding
- `POST /providers`
- `GET /providers/me`
- `PATCH /providers/me`
- `POST /providers/{providerId}/branches`
- `POST /providers/{providerId}/documents`
- `GET /providers/{providerId}/verification`
- `POST /professionals/affiliations`
- `POST /professional-affiliations/{id}/approve`
- `POST /professional-affiliations/{id}/terminate`

### Catalog and offerings
- `GET /catalog/categories`
- `GET /catalog/services`
- `POST /providers/{providerId}/offerings`
- `PATCH /offerings/{offeringId}`
- `POST /offerings/{offeringId}/quote`
- `GET /offerings/{offeringId}/availability`

### Booking
- `POST /booking-recipients`
- `POST /booking-holds`
- `GET /booking-holds/{holdId}`
- `POST /bookings`
- `GET /bookings/{bookingId}`
- `POST /bookings/{bookingId}/provider-approve`
- `POST /bookings/{bookingId}/provider-reject`
- `POST /bookings/{bookingId}/cancel`
- `POST /bookings/{bookingId}/reschedule-proposals`
- `POST /reschedule-proposals/{proposalId}/accept`
- `POST /bookings/{bookingId}/check-in`
- `POST /bookings/{bookingId}/complete`
- `POST /bookings/{bookingId}/dispute`
- `POST /waitlist`

### Consultation and messaging
- `POST /consultations`
- `POST /consultations/{id}/proposals`
- `POST /conversations`
- `GET /conversations/{id}/messages`
- `POST /conversations/{id}/messages`
- `POST /uploads/initiate`
- `POST /uploads/{uploadId}/complete`

### Payment and ledger
- `POST /payments`
- `POST /payments/{paymentId}/confirm-mock`
- `POST /payment-webhooks/{provider}`
- `POST /refunds`
- `GET /wallet`
- `GET /ledger/transactions`
- `GET /settlements`

### Reviews and support
- `POST /reviews`
- `POST /reviews/{reviewId}/response`
- `POST /reviews/{reviewId}/report`
- `POST /support/tickets`
- `POST /complaints`
- `GET /disputes/{id}`
- `POST /disputes/{id}/evidence`
- `POST /disputes/{id}/appeal`

### Administration
Admin endpoints follow the same application services and are permission-scoped under `/admin/*`, including users, providers, verification, bookings, finance, plans, SMS, content, geography, policies, feature flags, reports, audit, queue health, service health, roles, permissions, and global settings.

## Command response pattern
Commands return the changed resource summary, current version, and permitted next actions. They do not imply completion of asynchronous external delivery.

```json
{
  "data": {
    "id": "opaque-id",
    "status": "AWAITING_PROVIDER_APPROVAL",
    "version": 4,
    "allowedActions": ["CANCEL"]
  },
  "meta": {
    "correlationId": "opaque-id"
  }
}
```

OpenAPI generation is planned from the validated schemas. Any breaking contract change requires a versioned endpoint or an explicit migration period.
