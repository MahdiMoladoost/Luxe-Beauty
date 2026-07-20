# Database Schema

The executable schema lives in `prisma/schema.prisma`. This document explains ownership, invariants, and planned migrations.

## Shared conventions
- IDs: UUID/CUID-compatible opaque identifiers.
- Time: UTC `timestamptz` semantics; UI converts to Iran timezone and Jalali presentation.
- Money: signed integer tomans (`BigInt` where aggregate range requires it).
- Concurrency: `version` integer on sensitive mutable aggregates.
- Historical records: `createdAt`, `updatedAt`; `deletedAt` for soft-deleted records where required.
- Human-entered Persian text stores a display value and normalized/search value where search depends on it.
- Policies and commercial settings are versioned; historical bookings reference immutable snapshots.

## Identity and access
- `User`: account status, verified mobile, identity state, locale and lifecycle fields.
- `UserProfile`: verified/public names and non-sensitive profile fields.
- `SensitiveIdentity`: encrypted national ID, national-ID HMAC, key version, restricted metadata.
- `Credential`: Argon2id password hash for staff/provider logins; forced-reset state.
- `OtpChallenge`: purpose, hashed code, expiry, attempts, consumed timestamp.
- `Session`: device, IP metadata, rotation/revocation and last activity.
- `Role`, `Permission`, `RolePermission`, `UserRole`: platform and scoped RBAC.
- `AuditLog`: actor, action, resource, scope, reason, correlation ID, safe metadata, timestamp.

## Geography and addresses
- `Province`, `City`, `District`, `Neighborhood` with publication and SEO fields.
- `Address`: owner, approximate/public and exact/private parts, normalized coordinates, verification status.
- `ServiceArea`: city/neighborhood/radius/polygon and travel rules.

## Providers and workforce
- `ProviderOrganization`: provider type, verification, subscription and operational state.
- `Branch`: organization location, public profile, verification, schedule and settings.
- `ProfessionalProfile`: persistent professional identity and ratings independent of affiliation.
- `ProfessionalAffiliation`: professional-to-branch/organization relation, bilateral status, dates and scoped access.
- `ProviderMembership`: staff membership, role and branch scope.
- `VerificationCase`, `DocumentRequirement`, `ProviderDocument`, `VerificationReview`: configurable onboarding and review history.

## Catalog, pricing and policies
- `ServiceGroup`, `ServiceCategory`, `StandardService`.
- `ProviderService`: provider-specific activation and publication.
- `ServiceOffering`: branch/professional/location-specific duration, audience, booking and payment settings.
- `ServiceVariant`, `ServiceAddon`, `ServicePackage`, package items.
- `PricingRule`, `PricingFactor`, `Questionnaire`, `Question`, `AnswerOption`.
- `CancellationPolicyVersion`, `DelayPolicyVersion`, `PaymentPolicyVersion`, `CommissionPolicyVersion`.

## Availability and resources
- `WeeklySchedule`, `ScheduleInterval`, `ScheduleException`, `Leave`, `Holiday`.
- `ResourceType`, `Resource`, `OfferingResourceRequirement`.
- `AvailabilityHold`: expiring hold with idempotency key and resource/time range.
- Database constraints and transactional lock strategy prevent overlapping confirmed/held assignments for the same professional/resource.

## Booking and consultation
- `ServiceRecipient`: recipient distinct from booking customer.
- `Booking`: state, customer, recipient, provider, branch, totals, policy snapshots, version.
- `BookingItem`: offering/professional/location, start/end, buffers/travel, price and questionnaire snapshot.
- `BookingStateTransition`: immutable transition history with actor/reason.
- `RescheduleProposal`, `WaitlistEntry`, `AttendanceChallenge`.
- `Consultation`, `ConsultationProposal`, `ConsultationMessage`, private attachments.

## Payments and ledger
- `Payment`, `PaymentAttempt`, `PaymentProviderEvent`.
- `LedgerAccount`, `LedgerTransaction`, `LedgerEntry`.
- `FundsHold`, `FundsRelease`, `Refund`, `Settlement`, `ProviderPayout`, `Reconciliation`, `Adjustment`, `DisputeHold`.
- Each posted ledger transaction must balance. Provider/platform/wallet balances are derived from entries.

## Subscriptions, SMS and growth
- `Plan`, `PlanFeature`, `PlanPriceVersion`, `Subscription`, `Trial`, `SubscriptionInvoice`.
- `SmsPackage`, `SmsWallet`, `SmsUsage`, `SmsPurchase`, `SmsDelivery`.
- `Promotion`, `Coupon`, `CouponRedemption`, `Campaign`, `AdPlacement`, `AdEvent`.
- `WalletAccount` uses the shared ledger; `Referral`, `ReferralReward`, `LoyaltyProgram`, `LoyaltyEntry`.

## Communication, content and support
- `Conversation`, `ConversationParticipant`, `Message`, `MessageAttachment`, `MessageModerationEvent`.
- `Notification`, `NotificationDelivery`, `OutboxEvent`, `JobRecord`.
- `Review`, rating dimensions, response, media and moderation history.
- `PortfolioItem`, consent and moderation fields.
- `Page`, `ContentVersion`, `Article`, `Faq`, `Banner`, `Announcement`, `SeoRedirect`, `FeatureFlag`, `GlobalSetting`.
- `SupportTicket`, `Complaint`, `DisputeCase`, evidence, decisions and appeals.

## Privacy and retention
- `LegalDocumentVersion`, `LegalAcceptance`.
- `DataExportRequest`, `AccountDeletionRequest`, `RetentionExecution`.
- Private file metadata includes owner, namespace, MIME, size, hash, scan state, retention date and linked business resource.

## Initial migration sequence
1. PostgreSQL extensions (`pg_trgm`; optional range-support extensions as approved).
2. Identity/access/audit foundations.
3. Geography/providers/catalog.
4. Availability/booking constraints.
5. Payments/ledger/outbox.
6. Subscriptions/notifications/content/support.
7. Search indexes and reporting views.

No migration may silently delete production data. Destructive changes require an explicit data migration, backup/restore plan, and owner approval when irreversible.
