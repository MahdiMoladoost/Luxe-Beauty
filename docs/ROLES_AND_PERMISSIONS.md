# Roles and Permissions

Authorization is enforced on the server. Navigation visibility is not authorization.

## Authorization model
- RBAC grants named permissions through roles.
- Scope limits a role to platform, provider organization, branch, professional profile, or the current user.
- Contextual policies (ABAC) add booking ownership, affiliation status, verification state, financial amount, dispute state, and step-up authentication requirements.
- Deny by default.
- Platform-admin override access must be permissioned, reasoned, and audited.

## Seed platform roles

### Super Admin / مدیر کل
May configure the platform, roles, permissions, security settings, feature flags, geography, plans, policies, content, and operational modules. Sensitive access and financial actions still require step-up authentication and audit.

### Support / پشتیبان
May view scoped customer/provider/booking/support information required for tickets and complaints. Conversation and private-file access requires a linked case, explicit reason, and audit. Cannot change settlement or global security settings.

### Finance Manager / مدیر مالی
May view payments, ledger, refunds, reconciliation, settlements, payouts, invoices, and financial disputes. Refund/settlement execution requires step-up authentication and separate permissions.

### Verification Specialist / کارشناس احراز هویت
May review provider/customer verification evidence and record decisions. Sensitive identity/document views are audited. Cannot modify financial configuration.

### Content Manager / مدیر محتوا
May manage pages, articles, FAQ, banners, announcements, taxonomy copy, media, and SEO. Cannot publish versioned legal/commercial policy without the corresponding publish permission.

### Marketing Manager / مدیر بازاریابی
May manage promotions, coupons, campaigns, ads, featured placements, attribution, and marketing reports within budget/approval permissions.

## Provider-side roles
- Provider Owner: organization-wide administrative access, except actions restricted by platform policy.
- Organization Admin: configurable multi-branch management.
- Branch Manager: branch-scoped bookings, staff, services, schedules, customers and reports.
- Receptionist: booking/customer/calendar operations without unrestricted finance or sensitive document access.
- Professional: own profile, assigned offerings, shared calendar, own bookings, consultation and permitted income views.
- Provider Finance: organization/branch finance and reporting within granted scope.
- Provider Content: profile, portfolio, service and campaign content within approval rules.

## Customer principal
A customer may access only their own profile, recipients, addresses, bookings, payments, wallet, conversations, reviews, tickets, privacy, export, and deletion workflows unless they are an explicitly authorized guardian/representative.

## Permission naming
Permissions use `resource.action`, for example:
- `booking.read`, `booking.manage`, `booking.cancel-provider`
- `payment.read`, `refund.propose`, `refund.execute`
- `ledger.read`, `settlement.approve`
- `identity.sensitive-read`, `document.review`
- `role.manage`, `security.configure`
- `content.edit`, `legal.publish`, `plan.publish`
- `conversation.support-access`
- `audit.read`, `queue.manage`, `health.read`

## Mandatory contextual policies
- Exact addresses: only booking participants and authorized support during the valid lifecycle.
- National ID/private documents: only explicitly authorized verification/admin roles; every view audited.
- Conversation support access: linked complaint/ticket or explicitly approved operational reason.
- Refunds, settlements, payout account changes, role changes, security changes, sensitive document views: recent re-authentication or 2FA.
- Provider data: active membership and matching provider/branch scope.
- Professional calendar: all affiliations contribute to conflict detection; a branch cannot hide conflicts from other locations.
- Public publishing/booking: verification, document, subscription, and operational policies all pass.

## Permission tests
Every protected use case requires positive and negative tests, including cross-tenant IDOR attempts, revoked memberships, expired sessions, missing 2FA, stale optimistic versions, and suspended/expired provider states.
