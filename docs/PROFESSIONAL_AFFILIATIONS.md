# Professional Affiliations

Status: operational vertical slice on `rebuild/full-platform`; not a claim that the complete provider workspace or shared availability engine is finished.

## Purpose

A verified professional may work with one or more approved provider organizations without losing the professional identity, rating history, or future shared calendar. A provider organization may invite a verified professional. Neither request becomes active without acceptance by the counterparty.

## Parties and authority

- **Provider party:** currently the owning user of an approved `ProviderOrganization`.
- **Professional party:** the user linked to an active, verified `ProfessionalProfile`.
- Self-affiliation is rejected.
- Branch IDs, when provided, must belong to the selected organization.
- Provider staff scoped ABAC is intentionally still open; this slice does not infer tenant authority from a global permission alone.

## Professional profile bootstrap

`PUT /api/v1/professionals/me`

A professional profile can be created or updated only when the current user owns an approved professional-type provider application. The profile becomes the stable identity used across affiliations.

`GET /api/v1/professionals/me`

Returns the current user's public professional profile summary. It does not expose identity documents, mobile numbers, or private onboarding fields.

## Affiliation requests

`POST /api/v1/professional-affiliations`

Professional-originated request:

```json
{
  "organizationId": "uuid",
  "branchId": null
}
```

Provider-originated request:

```json
{
  "organizationId": "uuid",
  "professionalProfileId": "uuid",
  "branchId": null,
  "permissions": {
    "bookingRead": true
  }
}
```

`GET /api/v1/professional-affiliations`

Returns affiliations where the current user is either the professional or owner of the provider organization. DTOs contain only affiliation, provider, branch, and public professional summaries.

## Bilateral state transitions

`PATCH /api/v1/professional-affiliations/{affiliationId}`

Supported actions:

- `ACCEPT`
- `REJECT`
- `REQUEST_TERMINATION`
- `ACCEPT_TERMINATION`
- `REJECT_TERMINATION`

State rules:

```text
REQUESTED_BY_PROVIDER --professional ACCEPT--> ACTIVE
REQUESTED_BY_PROVIDER --professional REJECT--> REJECTED
REQUESTED_BY_PROFESSIONAL --provider ACCEPT--> ACTIVE
REQUESTED_BY_PROFESSIONAL --provider REJECT--> REJECTED
ACTIVE --either party REQUEST_TERMINATION--> TERMINATION_REQUESTED
TERMINATION_REQUESTED --counterparty ACCEPT_TERMINATION--> ENDED
TERMINATION_REQUESTED --counterparty REJECT_TERMINATION--> ACTIVE
```

The requester cannot accept their own request or their own termination request. Invalid transitions return stable conflict/forbidden errors.

## Consistency and evidence

- Creation and transitions use PostgreSQL serializable transactions.
- Open duplicate relations for the same professional/organization/branch scope are rejected after a transactional predicate check.
- Every request and transition writes an `AuditLog` row with actor party, previous state, next state, provider scope, branch, and correlation ID.
- Historical rows are retained when rejected or ended; a later request creates a new record.

## Tests

- Pure unit tests cover counterparty acceptance, rejection, termination, restoration, and duplicate-state protection.
- PostgreSQL integration tests cover provider-originated and professional-originated requests, IDOR denial, activation, bilateral termination, and audit evidence.

## Explicit remaining work

- Provider/branch staff ABAC and delegated invitation authority.
- Branch management and per-affiliation operational permissions UI.
- Shared availability calendar and database-level booking conflict constraints across every affiliation.
- Invitation discovery/search UX and privacy-safe professional lookup.
- Dispute workflow for contested affiliations.
- Expiry/review policy for affiliations and professional credentials.
