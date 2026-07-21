# Provider Branches

Status: operational owner-scoped vertical slice on `rebuild/full-platform`; delegated provider staff ABAC and public branch pages remain open.

## Contracts

### List and create

- `GET /api/v1/providers/{providerId}/branches`
- `POST /api/v1/providers/{providerId}/branches`

Creation input:

```json
{
  "nameFa": "شعبه مرکزی",
  "cityId": "uuid",
  "districtId": "uuid-or-null",
  "neighborhoodId": "uuid-or-null",
  "latitude": 35.75,
  "longitude": 51.2
}
```

A newly created branch is always inactive and its address is not verified. The owner cannot set `addressVerified`.

### Read, update and soft delete

- `GET /api/v1/providers/{providerId}/branches/{branchId}`
- `PATCH /api/v1/providers/{providerId}/branches/{branchId}`
- `DELETE /api/v1/providers/{providerId}/branches/{branchId}?expectedUpdatedAt={ISO-8601}`

Every update requires `expectedUpdatedAt`. The command fails with `VERSION_CONFLICT` when another write has changed the branch. Delete is soft-delete: the branch becomes inactive and receives `deletedAt`; historical references remain available to authorized internal workflows.

## Ownership and activation

- Current provider-side authority is limited to the provider owner.
- Cross-owner IDs return `PROVIDER_NOT_FOUND` or `BRANCH_NOT_FOUND` rather than leaking existence.
- A branch may be drafted before provider verification.
- `active=true` is allowed only after the provider organization is approved.
- Provider staff and branch-manager delegation will be added through scoped ABAC; global permissions are not treated as tenant authority.

## Geography validation

- City must exist and be active.
- District, when supplied, must belong to the city and be active.
- Neighborhood, when supplied, must belong to the city and be active.
- If the neighborhood has a district and no district was supplied, the district is derived.
- A mismatched district and neighborhood is rejected with `LOCATION_HIERARCHY_MISMATCH`.
- Exact street address and home-studio privacy fields are intentionally not exposed by this slice.

## Audit evidence

The following mutations are written atomically with an `AuditLog` record:

- `provider.branch.created`
- `provider.branch.updated`
- `provider.branch.deleted`

Audit metadata contains provider scope, geography IDs, active state, previous version timestamp and correlation ID. Raw sensitive addresses are not logged.

## Tests

PostgreSQL integration coverage verifies:

- inactive-by-default creation;
- district derivation from neighborhood;
- cross-owner IDOR denial;
- activation after provider approval;
- stale-update conflict;
- soft deletion;
- geography hierarchy rejection;
- activation denial for draft providers.

## Remaining work

- Branch address profile with encrypted/private fields and Neshan adapter.
- Admin address verification and re-verification workflow.
- Branch users, roles and scoped permissions.
- Business hours, resources, capacity and holiday exceptions.
- Public branch pages and SEO metadata.
- Booking/availability checks that require provider, branch and subscription eligibility.
