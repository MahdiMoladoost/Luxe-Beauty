# Security and Privacy

## Security baseline
The implementation targets OWASP Top 10 controls and defense in depth. Security decisions apply to server-side behavior; hiding UI controls is insufficient.

## Authentication
- Customer mobile OTP has short expiry, hashed codes, purpose binding, attempt limits, request limits and one-time consumption.
- Staff/provider passwords use Argon2id or an approved equivalent with versioned parameters.
- Staff/provider 2FA is SMS-based initially; super-admin 2FA is mandatory.
- Sessions use secure, HttpOnly, SameSite cookies, rotation on authentication/privilege change, inactivity/absolute expiry, device metadata and revocation.
- Login, OTP and recovery messages resist account enumeration.
- Suspicious login events are audited and may trigger notification/step-up requirements.

## Authorization
- Deny by default.
- RBAC permissions are restricted by provider/branch/user scope and contextual policy.
- Repository/application methods require explicit scope; IDs received from clients are never trusted as ownership proof.
- IDOR, revoked membership and role-escalation tests are mandatory.

## Sensitive identity
- National ID is never public or logged.
- Uniqueness uses a keyed HMAC derived from a normalized value.
- Recoverable national ID is encrypted with an environment-managed key and key version.
- Decryption and private-document views require specific permission, valid purpose and an audit record.
- Key rotation is supported by versioned ciphertext metadata.

## Web and API controls
- Input and output validation.
- Parameterized Prisma queries; no unsafe dynamic SQL without review.
- CSRF protection for cookie-authenticated mutations.
- Contextual output encoding and CSP to reduce XSS.
- SSRF allowlists/URL parsing for server-side network access.
- Secure headers including CSP, frame restrictions, MIME sniffing prevention, referrer policy and HSTS in production.
- Rate limits at edge/application level with stricter sensitive-route policies.
- Safe error envelopes; no production stack traces.

## Uploads and storage
- Size, extension, MIME and file-signature validation.
- Content hash and duplicate tracking where useful.
- Quarantine and malware-scan adapter before publication/use.
- Private namespaces have no permanent public URLs.
- Short-lived signed URLs are actor/resource/purpose scoped.
- Authorization is rechecked when generating access URLs.
- Retention/lifecycle and secure deletion are documented and auditable.

## Payments and webhooks
- Provider signature verification and timestamp/replay protection.
- Unique provider event IDs and idempotency keys.
- Amount/currency/order references verified against server state.
- Refunds, settlements, payout account changes and adjustments require permission, recent 2FA/re-authentication and audit.
- No card data is stored unless a selected certified provider contract explicitly requires and permits it; hosted provider flows are preferred.

## Logging and audit
Operational logs are structured, sanitized and exclude secrets, OTPs, passwords, national IDs, exact private addresses, full document URLs, raw payment credentials and unreviewed provider payloads. Audit logs are append-oriented business evidence with actor, action, reason, scope, resource, timestamp and correlation ID.

## Privacy
- Collect the minimum data required for the workflow.
- Separate booking customer from service recipient and limit recipient data.
- Exact home addresses are disclosed only at the valid confirmed stage.
- Support access to conversations/private data requires a case or explicit authorized reason and is audited.
- Reviews may show verified full name only after an explicit publication notice; contact/identity details never appear.
- Marketing consent is distinct from transactional notifications.
- Users can request export and deletion subject to open bookings/disputes and legally required financial retention.
- Retention policies delete or anonymize unnecessary data after configured periods.

## Step-up authentication required
- change mobile number
- change password
- change payout/IBAN details
- change roles or high-risk permissions
- execute refund/settlement/manual adjustment
- view/decrypt sensitive identity or documents
- change security configuration

## Secret management
- Commit `.env.example` variable names/placeholders only.
- Local values use ignored environment files or a secret manager.
- CI uses GitHub Secrets.
- Production uses a managed secret store with rotation and least privilege.
- Suspected exposure triggers immediate revocation/rotation, history assessment and documented remediation.

## Security review gates
Threat modelling is required for identity, booking concurrency, payments/ledger, private files, messaging moderation/support access, addresses, deletion/retention and admin impersonation/override behavior.
