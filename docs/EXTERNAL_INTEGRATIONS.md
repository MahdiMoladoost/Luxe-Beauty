# External Integrations

No real credential is committed or requested in public chat. Configuration names belong in `.env.example`; values belong in local secret storage and GitHub Secrets/production secret management.

## Common adapter requirements
Every external integration exposes:
- a typed port used by application services
- development mock implementation
- production implementation selected by configuration
- explicit runtime mode (`mock`, `sandbox`, `production`)
- timeouts, retries with backoff, circuit/open-state behavior where appropriate
- idempotency/deduplication
- sanitized structured logs and metrics
- health reporting that never exposes secrets
- deterministic integration tests

## Identity verification
Port: `IdentityVerificationProvider`

Responsibilities:
- validate national ID/mobile ownership and identity attributes when supported
- return a provider reference and normalized decision
- distinguish verified/rejected/pending/unavailable
- never store raw provider payloads without privacy review

Development uses a deterministic mock with clear UI/admin labelling. Production provider is not yet selected.

Environment names:
- `IDENTITY_PROVIDER`
- `IDENTITY_API_BASE_URL`
- `IDENTITY_API_KEY`
- `NATIONAL_ID_HMAC_KEY`
- `PII_ENCRYPTION_KEY`
- `PII_ENCRYPTION_KEY_VERSION`

## Payments
Port: `PaymentProvider`

Development mock covers success, failure, timeout, duplicate/late callback, full/partial refund, settlement and reconciliation. Production marketplace and provider-owned gateway adapters remain pending provider/legal selection.

Environment names:
- `PAYMENT_PROVIDER`
- `PAYMENT_API_BASE_URL`
- `PAYMENT_API_KEY`
- `PAYMENT_WEBHOOK_SECRET`
- `PLATFORM_PAYMENT_MERCHANT_ID`

## Kavenegar SMS
Port: `SmsProvider`; implementation: `KavenegarSmsProvider` plus mock.

Requirements:
- environment/panel-managed template IDs
- delivery tracking
- retry/backoff and failure reason
- idempotent send key
- rate-limit handling
- usage/quota reporting

Environment names:
- `SMS_PROVIDER`
- `KAVENEGAR_API_KEY`
- `KAVENEGAR_OTP_TEMPLATE`
- `KAVENEGAR_BOOKING_TEMPLATE`
- `KAVENEGAR_REMINDER_TEMPLATE`
- `KAVENEGAR_ATTENDANCE_TEMPLATE`

## Neshan maps
Port: `MapProvider`; implementation: `NeshanMapProvider` plus explicit development fallback.

Capabilities:
- map display configuration
- geocoding/reverse geocoding
- address search
- distance and route/time when supported
- coordinates, polygons, radius and result markers

Environment names:
- `MAP_PROVIDER`
- `NESHAN_API_KEY`
- `NEXT_PUBLIC_NESHAN_MAP_KEY`
- `NESHAN_API_BASE_URL`

Server and browser keys must be separately scoped when the provider supports it.

## Object storage
Port: `ObjectStorageProvider`

Development: MinIO. Production: S3-compatible service.
Namespaces/buckets: public media, private documents, consultation, review, portfolio, support and temporary uploads.

Environment names:
- `STORAGE_PROVIDER`
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_FORCE_PATH_STYLE`
- bucket-name variables per namespace

## Malware scan
Port: `MalwareScanProvider`.
Uploaded private/public files remain quarantined until validation and scan policy allow use. Development may use a deterministic mock; production scanner remains unselected.

## Push notifications
Web Push/PWA adapter requires VAPID keys stored only in secrets. Subscription records are revocable and scoped to a user/session/device.

## Future adapters
- masked/relay phone number
- WhatsApp notification
- email notification
- error tracking
- metrics exporter
- accounting/webhook integrations
- recommendation model provider

## Current limitations
Real KYC, payment, Kavenegar and Neshan credentials are intentionally absent. This is a correct security state, not an implementation failure. The application must remain runnable in clearly labelled development modes until secrets are configured outside Git.
