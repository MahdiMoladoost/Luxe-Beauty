# Architecture

## Architectural style
Luxe Beauty is implemented as a modular monolith. Domain modules share one deployable application and one PostgreSQL cluster, but they do not bypass module boundaries. The design must permit selected modules to be extracted later without rewriting business behavior.

## Runtime topology

```text
Browser / PWA
    |
Nginx (production-like edge)
    |
Next.js Web (App Router, server components, route handlers/server actions)
    |--------------------|
PostgreSQL            Redis
    |                    |
Prisma               BullMQ-compatible queues
                         |
                       Worker
                         |
                 External adapters
          SMS / Maps / KYC / Payments / Storage

Development object storage: MinIO
Production object storage: S3-compatible provider
```

## Source boundaries

```text
src/
  app/                    # routing, layouts, route handlers and composition only
  modules/
    identity/
    access/
    geography/
    providers/
    catalog/
    availability/
    booking/
    consultation/
    payments/
    ledger/
    subscriptions/
    messaging/
    notifications/
    reviews/
    content/
    promotions/
    support/
    reporting/
  shared/
    domain/               # IDs, money, time, domain errors, events
    application/          # transaction, idempotency, outbox abstractions
    infrastructure/       # Prisma, Redis, queue, logging, storage, crypto
    ui/                   # reviewed shared UI primitives
  adapters/
    identity-verification/
    payment/
    sms/
    maps/
    storage/
    malware-scan/
    error-tracking/
    accounting/
  worker/
```

Each business module may contain:

```text
domain/          # entities, value objects, policies, state transitions
application/     # commands, queries, use cases, ports
infrastructure/  # Prisma repositories and external implementations
ui/              # module-specific server/client components
contracts/       # validated request/response schemas
```

## Request flow
1. Route handler/server action validates input with Zod and normalizes Persian input.
2. Authentication resolves the current principal and session.
3. Authorization evaluates role permissions and contextual policies.
4. Application service executes a use case inside an explicit transaction where required.
5. Domain logic changes aggregate state and emits domain events.
6. Repository writes state, audit data, idempotency result, and outbox events atomically.
7. Worker publishes notifications or external calls with retry/backoff and deduplication.
8. Response returns a stable contract with a correlation ID and safe error code.

## Critical consistency patterns
- Booking holds and confirmations: PostgreSQL transaction, exclusion/unique constraints where possible, row/advisory locks where appropriate; Redis lock is supplementary.
- Payments/webhooks: idempotency record keyed by provider/event/request key.
- Financial changes: immutable ledger entries that balance by transaction.
- Notifications: transactional outbox plus queue retry/dead-letter handling.
- Configurable rules: versioned policy records; bookings store the accepted version and computed snapshot.
- Sensitive edits: optimistic version column and conflict handling.
- Deletes: soft-delete operational records when history is required; hard-delete only by retention workflow.

## Multi-tenancy and ownership
The platform is not database-per-tenant. Tenant boundaries are represented by provider organizations, branches, memberships, and scoped permissions. Every repository method handling tenant data must require an explicit scope; unrestricted queries are reserved for audited platform-admin use cases.

## Rendering rules
- Server Components are the default for data-backed pages.
- Client Components are limited to interactive state, browser APIs, and rich controls.
- Business logic never lives only in a Client Component.
- Search/filter state uses URL parameters where shareable.
- Sensitive data is never embedded in static output or unsafe browser caches.

## API strategy
Versioned HTTP contracts live below `/api/v1`. Server Actions may serve first-party forms but must call the same application services and authorization policies as route handlers. Future native applications can use the HTTP contracts without depending on UI internals.

## Observability
Every request/job receives a correlation ID. Logs are structured and sanitized. Audit logs are business evidence and separate from operational logs. Health, readiness, liveness, queue health, migration status, external-adapter mode, and dependency availability are exposed only at appropriately protected endpoints.

## Migration strategy from the current UI
1. Preserve reviewed generic UI primitives.
2. Mark existing `app/admin`, `app/dashboard`, `app/salon-dashboard`, login, and registration implementations as legacy replacement targets.
3. Build infrastructure and domain modules beside the legacy UI.
4. Replace each route with a data-backed vertical slice and tests.
5. Delete obsolete hardcoded panels only after replacement routes pass their quality gates.
