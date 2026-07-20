-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETION_REQUESTED', 'DELETED');

-- CreateEnum
CREATE TYPE "IdentityStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED', 'UNAVAILABLE');

-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('LICENSED_SALON', 'SINGLE_SALON', 'MULTI_BRANCH_GROUP', 'INDEPENDENT_PROFESSIONAL', 'HOME_SERVICE_PROFESSIONAL', 'HOME_STUDIO_PROFESSIONAL', 'HYBRID_PROFESSIONAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ProviderStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'NEEDS_CORRECTION', 'APPROVED', 'REJECTED', 'SUSPENDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AffiliationStatus" AS ENUM ('REQUESTED_BY_PROVIDER', 'REQUESTED_BY_PROFESSIONAL', 'PENDING_COUNTERPART', 'ACTIVE', 'TERMINATION_REQUESTED', 'ENDED', 'REJECTED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "PriceModel" AS ENUM ('FIXED', 'STARTING_FROM', 'RANGE', 'AFTER_CONSULTATION', 'CALCULATED', 'PACKAGE', 'VARIANT', 'ADDON', 'BY_LOCATION');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('DRAFT', 'AWAITING_IDENTITY', 'HOLDING_SLOT', 'AWAITING_PAYMENT', 'PAYMENT_PENDING', 'AWAITING_PROVIDER_APPROVAL', 'CONFIRMED', 'REJECTED', 'EXPIRED', 'RESCHEDULE_PROPOSED', 'RESCHEDULED', 'CUSTOMER_CANCELLED', 'PROVIDER_CANCELLED', 'CHECKED_IN', 'IN_SERVICE', 'COMPLETED_BY_PROVIDER', 'AWAITING_CUSTOMER_DISPUTE_WINDOW', 'FINALIZED', 'CUSTOMER_NO_SHOW', 'PROVIDER_NO_SHOW', 'DISPUTED', 'REFUNDED', 'PARTIALLY_REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('BOOKING', 'SUBSCRIPTION', 'SMS_PACKAGE', 'ADVERTISING', 'FEATURED_PLACEMENT', 'PLATFORM_SERVICE');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('CREATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'EXPIRED', 'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "LedgerAccountType" AS ENUM ('ASSET', 'LIABILITY', 'REVENUE', 'EXPENSE', 'EQUITY', 'CLEARING');

-- CreateEnum
CREATE TYPE "LedgerTransactionStatus" AS ENUM ('DRAFT', 'POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "LedgerDirection" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "FileVisibility" AS ENUM ('PUBLIC', 'PRIVATE', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "FileScanStatus" AS ENUM ('PENDING', 'CLEAN', 'REJECTED', 'FAILED', 'NOT_REQUIRED');

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'PUBLISHED', 'FAILED', 'DEAD_LETTER');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "mobileNormalized" VARCHAR(16) NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "identityStatus" "IdentityStatus" NOT NULL DEFAULT 'UNVERIFIED',
    "locale" VARCHAR(16) NOT NULL DEFAULT 'fa-IR',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "firstName" VARCHAR(100),
    "lastName" VARCHAR(100),
    "normalizedName" VARCHAR(220),
    "birthDate" DATE,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SensitiveIdentity" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "nationalIdHmac" VARCHAR(128) NOT NULL,
    "encryptedNationalId" TEXT NOT NULL,
    "encryptionKeyVersion" VARCHAR(50) NOT NULL,
    "verifiedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "SensitiveIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" VARCHAR(128) NOT NULL,
    "deviceIdHash" VARCHAR(128),
    "ipHash" VARCHAR(128),
    "userAgentSummary" VARCHAR(300),
    "twoFactorVerifiedAt" TIMESTAMPTZ(6),
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "lastSeenAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "key" VARCHAR(100) NOT NULL,
    "nameFa" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "system" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "key" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "scopeType" VARCHAR(40) NOT NULL DEFAULT 'PLATFORM',
    "scopeId" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMPTZ(6),

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "action" VARCHAR(160) NOT NULL,
    "resourceType" VARCHAR(100) NOT NULL,
    "resourceId" VARCHAR(100),
    "scopeType" VARCHAR(50),
    "scopeId" VARCHAR(100),
    "reason" TEXT,
    "correlationId" VARCHAR(100) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Province" (
    "id" UUID NOT NULL,
    "nameFa" VARCHAR(100) NOT NULL,
    "normalizedName" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" UUID NOT NULL,
    "provinceId" UUID NOT NULL,
    "nameFa" VARCHAR(100) NOT NULL,
    "normalizedName" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "nameFa" VARCHAR(100) NOT NULL,
    "normalizedName" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Neighborhood" (
    "id" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "districtId" UUID,
    "nameFa" VARCHAR(100) NOT NULL,
    "normalizedName" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Neighborhood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProviderOrganization" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "type" "ProviderType" NOT NULL,
    "status" "ProviderStatus" NOT NULL DEFAULT 'DRAFT',
    "nameFa" VARCHAR(180) NOT NULL,
    "normalizedName" VARCHAR(220) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "verificationAt" TIMESTAMPTZ(6),
    "bookingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "ProviderOrganization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "cityId" UUID NOT NULL,
    "districtId" UUID,
    "neighborhoodId" UUID,
    "nameFa" VARCHAR(180) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "addressVerified" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "displayNameFa" VARCHAR(180) NOT NULL,
    "normalizedName" VARCHAR(220) NOT NULL,
    "bio" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ProfessionalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfessionalAffiliation" (
    "id" UUID NOT NULL,
    "professionalId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "branchId" UUID,
    "status" "AffiliationStatus" NOT NULL DEFAULT 'PENDING_COUNTERPART',
    "requestedBy" VARCHAR(30) NOT NULL,
    "startsAt" TIMESTAMPTZ(6),
    "endsAt" TIMESTAMPTZ(6),
    "permissions" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ProfessionalAffiliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceCategory" (
    "id" UUID NOT NULL,
    "parentId" UUID,
    "nameFa" VARCHAR(160) NOT NULL,
    "nameEn" VARCHAR(160),
    "normalizedName" VARCHAR(180) NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "ServiceCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandardService" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "titleFa" VARCHAR(180) NOT NULL,
    "titleEn" VARCHAR(180),
    "normalizedTitle" VARCHAR(220) NOT NULL,
    "slug" VARCHAR(220) NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "StandardService_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceOffering" (
    "id" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "branchId" UUID,
    "professionalId" UUID,
    "standardServiceId" UUID NOT NULL,
    "titleFa" VARCHAR(180) NOT NULL,
    "priceModel" "PriceModel" NOT NULL,
    "priceMinToman" BIGINT,
    "priceMaxToman" BIGINT,
    "baseDurationMinute" INTEGER NOT NULL,
    "preparationMinute" INTEGER NOT NULL DEFAULT 0,
    "cleanupMinute" INTEGER NOT NULL DEFAULT 0,
    "bufferBeforeMinute" INTEGER NOT NULL DEFAULT 0,
    "bufferAfterMinute" INTEGER NOT NULL DEFAULT 0,
    "audienceRules" JSONB NOT NULL,
    "bookingPolicy" JSONB NOT NULL,
    "pricingRules" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "ServiceOffering_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceRecipient" (
    "id" UUID NOT NULL,
    "customerUserId" UUID NOT NULL,
    "firstName" VARCHAR(100) NOT NULL,
    "lastName" VARCHAR(100) NOT NULL,
    "birthDate" DATE,
    "genderCode" VARCHAR(30),
    "relationLabel" VARCHAR(60),
    "contactMobile" VARCHAR(16),
    "accessibilityNeeds" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "ServiceRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" UUID NOT NULL,
    "customerUserId" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "branchId" UUID,
    "status" "BookingStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" VARCHAR(10) NOT NULL DEFAULT 'TOMAN',
    "subtotalToman" BIGINT NOT NULL DEFAULT 0,
    "discountToman" BIGINT NOT NULL DEFAULT 0,
    "travelFeeToman" BIGINT NOT NULL DEFAULT 0,
    "platformFeeToman" BIGINT NOT NULL DEFAULT 0,
    "totalToman" BIGINT NOT NULL DEFAULT 0,
    "priceSnapshot" JSONB NOT NULL,
    "policySnapshot" JSONB NOT NULL,
    "questionnaireSnapshot" JSONB,
    "legalAcceptanceSnapshot" JSONB,
    "idempotencyKey" VARCHAR(160) NOT NULL,
    "approvalDeadlineAt" TIMESTAMPTZ(6),
    "disputeWindowEndsAt" TIMESTAMPTZ(6),
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "cancelledAt" TIMESTAMPTZ(6),
    "finalizedAt" TIMESTAMPTZ(6),

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingItem" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "offeringId" UUID NOT NULL,
    "professionalId" UUID,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6) NOT NULL,
    "occupiedFrom" TIMESTAMPTZ(6) NOT NULL,
    "occupiedUntil" TIMESTAMPTZ(6) NOT NULL,
    "travelBeforeMinute" INTEGER NOT NULL DEFAULT 0,
    "travelAfterMinute" INTEGER NOT NULL DEFAULT 0,
    "unitPriceToman" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceSnapshot" JSONB NOT NULL,
    "durationSnapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingTransition" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "fromStatus" "BookingStatus",
    "toStatus" "BookingStatus" NOT NULL,
    "actorUserId" UUID,
    "reasonCode" VARCHAR(100),
    "reason" TEXT,
    "metadata" JSONB,
    "correlationId" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingTransition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "bookingId" UUID,
    "purpose" "PaymentPurpose" NOT NULL,
    "providerKey" VARCHAR(60) NOT NULL,
    "providerRef" VARCHAR(180),
    "status" "PaymentStatus" NOT NULL DEFAULT 'CREATED',
    "amountToman" BIGINT NOT NULL,
    "idempotencyKey" VARCHAR(160) NOT NULL,
    "metadata" JSONB,
    "succeededAt" TIMESTAMPTZ(6),
    "failedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerAccount" (
    "id" UUID NOT NULL,
    "code" VARCHAR(120) NOT NULL,
    "nameFa" VARCHAR(180) NOT NULL,
    "type" "LedgerAccountType" NOT NULL,
    "ownerType" VARCHAR(40),
    "ownerId" UUID,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'TOMAN',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerTransaction" (
    "id" UUID NOT NULL,
    "status" "LedgerTransactionStatus" NOT NULL DEFAULT 'DRAFT',
    "referenceType" VARCHAR(60) NOT NULL,
    "referenceId" VARCHAR(100),
    "idempotencyKey" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "correlationId" VARCHAR(100) NOT NULL,
    "postedAt" TIMESTAMPTZ(6),
    "reversedById" UUID,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" UUID NOT NULL,
    "transactionId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "direction" "LedgerDirection" NOT NULL,
    "amountToman" BIGINT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LedgerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdempotencyRecord" (
    "id" UUID NOT NULL,
    "scope" VARCHAR(100) NOT NULL,
    "key" VARCHAR(160) NOT NULL,
    "requestHash" VARCHAR(128) NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" JSONB,
    "resourceType" VARCHAR(80),
    "resourceId" VARCHAR(100),
    "expiresAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(6),

    CONSTRAINT "IdempotencyRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" UUID NOT NULL,
    "aggregateType" VARCHAR(80) NOT NULL,
    "aggregateId" VARCHAR(100) NOT NULL,
    "eventType" VARCHAR(160) NOT NULL,
    "payload" JSONB NOT NULL,
    "dedupeKey" VARCHAR(180),
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMPTZ(6),
    "lastErrorCode" VARCHAR(100),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" UUID NOT NULL,
    "ownerUserId" UUID,
    "providerId" UUID,
    "namespace" VARCHAR(60) NOT NULL,
    "objectKey" VARCHAR(500) NOT NULL,
    "visibility" "FileVisibility" NOT NULL DEFAULT 'QUARANTINED',
    "originalFileName" VARCHAR(255),
    "mimeType" VARCHAR(150) NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "contentHash" VARCHAR(128) NOT NULL,
    "scanStatus" "FileScanStatus" NOT NULL DEFAULT 'PENDING',
    "retentionUntil" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMPTZ(6),

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_mobileNormalized_key" ON "User"("mobileNormalized");

-- CreateIndex
CREATE INDEX "User_status_createdAt_idx" ON "User"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_userId_key" ON "UserProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SensitiveIdentity_userId_key" ON "SensitiveIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SensitiveIdentity_nationalIdHmac_key" ON "SensitiveIdentity"("nationalIdHmac");

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_revokedAt_expiresAt_idx" ON "Session"("userId", "revokedAt", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Role_key_key" ON "Role"("key");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_key_key" ON "Permission"("key");

-- CreateIndex
CREATE INDEX "UserRole_scopeType_scopeId_revokedAt_idx" ON "UserRole"("scopeType", "scopeId", "revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_scopeType_scopeId_key" ON "UserRole"("userId", "roleId", "scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "AuditLog_resourceType_resourceId_createdAt_idx" ON "AuditLog"("resourceType", "resourceId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_correlationId_idx" ON "AuditLog"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "Province_normalizedName_key" ON "Province"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Province_slug_key" ON "Province"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "City_slug_key" ON "City"("slug");

-- CreateIndex
CREATE INDEX "City_active_nameFa_idx" ON "City"("active", "nameFa");

-- CreateIndex
CREATE UNIQUE INDEX "City_provinceId_normalizedName_key" ON "City"("provinceId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "District_slug_key" ON "District"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "District_cityId_normalizedName_key" ON "District"("cityId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Neighborhood_slug_key" ON "Neighborhood"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Neighborhood_cityId_normalizedName_key" ON "Neighborhood"("cityId", "normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderOrganization_slug_key" ON "ProviderOrganization"("slug");

-- CreateIndex
CREATE INDEX "ProviderOrganization_status_bookingEnabled_idx" ON "ProviderOrganization"("status", "bookingEnabled");

-- CreateIndex
CREATE INDEX "ProviderOrganization_normalizedName_idx" ON "ProviderOrganization"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_slug_key" ON "Branch"("slug");

-- CreateIndex
CREATE INDEX "Branch_organizationId_active_idx" ON "Branch"("organizationId", "active");

-- CreateIndex
CREATE INDEX "Branch_cityId_neighborhoodId_active_idx" ON "Branch"("cityId", "neighborhoodId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalProfile_userId_key" ON "ProfessionalProfile"("userId");

-- CreateIndex
CREATE INDEX "ProfessionalProfile_normalizedName_active_idx" ON "ProfessionalProfile"("normalizedName", "active");

-- CreateIndex
CREATE INDEX "ProfessionalAffiliation_professionalId_status_idx" ON "ProfessionalAffiliation"("professionalId", "status");

-- CreateIndex
CREATE INDEX "ProfessionalAffiliation_organizationId_branchId_status_idx" ON "ProfessionalAffiliation"("organizationId", "branchId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceCategory_slug_key" ON "ServiceCategory"("slug");

-- CreateIndex
CREATE INDEX "ServiceCategory_parentId_active_idx" ON "ServiceCategory"("parentId", "active");

-- CreateIndex
CREATE INDEX "ServiceCategory_normalizedName_idx" ON "ServiceCategory"("normalizedName");

-- CreateIndex
CREATE UNIQUE INDEX "StandardService_slug_key" ON "StandardService"("slug");

-- CreateIndex
CREATE INDEX "StandardService_categoryId_active_idx" ON "StandardService"("categoryId", "active");

-- CreateIndex
CREATE INDEX "StandardService_normalizedTitle_idx" ON "StandardService"("normalizedTitle");

-- CreateIndex
CREATE INDEX "ServiceOffering_providerId_branchId_active_published_idx" ON "ServiceOffering"("providerId", "branchId", "active", "published");

-- CreateIndex
CREATE INDEX "ServiceOffering_standardServiceId_active_published_idx" ON "ServiceOffering"("standardServiceId", "active", "published");

-- CreateIndex
CREATE INDEX "ServiceOffering_professionalId_active_idx" ON "ServiceOffering"("professionalId", "active");

-- CreateIndex
CREATE INDEX "ServiceRecipient_customerUserId_deletedAt_idx" ON "ServiceRecipient"("customerUserId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Booking_customerUserId_status_createdAt_idx" ON "Booking"("customerUserId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Booking_providerId_branchId_status_createdAt_idx" ON "Booking"("providerId", "branchId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "BookingItem_professionalId_occupiedFrom_occupiedUntil_idx" ON "BookingItem"("professionalId", "occupiedFrom", "occupiedUntil");

-- CreateIndex
CREATE INDEX "BookingItem_bookingId_startsAt_idx" ON "BookingItem"("bookingId", "startsAt");

-- CreateIndex
CREATE INDEX "BookingTransition_bookingId_createdAt_idx" ON "BookingTransition"("bookingId", "createdAt");

-- CreateIndex
CREATE INDEX "BookingTransition_correlationId_idx" ON "BookingTransition"("correlationId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerRef_key" ON "Payment"("providerRef");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Payment_bookingId_status_idx" ON "Payment"("bookingId", "status");

-- CreateIndex
CREATE INDEX "Payment_purpose_status_createdAt_idx" ON "Payment"("purpose", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerAccount_code_key" ON "LedgerAccount"("code");

-- CreateIndex
CREATE INDEX "LedgerAccount_ownerType_ownerId_active_idx" ON "LedgerAccount"("ownerType", "ownerId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerTransaction_idempotencyKey_key" ON "LedgerTransaction"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "LedgerTransaction_reversedById_key" ON "LedgerTransaction"("reversedById");

-- CreateIndex
CREATE INDEX "LedgerTransaction_referenceType_referenceId_idx" ON "LedgerTransaction"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "LedgerTransaction_status_createdAt_idx" ON "LedgerTransaction"("status", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_accountId_createdAt_idx" ON "LedgerEntry"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "LedgerEntry_transactionId_idx" ON "LedgerEntry"("transactionId");

-- CreateIndex
CREATE INDEX "IdempotencyRecord_expiresAt_idx" ON "IdempotencyRecord"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyRecord_scope_key_key" ON "IdempotencyRecord"("scope", "key");

-- CreateIndex
CREATE UNIQUE INDEX "OutboxEvent_dedupeKey_key" ON "OutboxEvent"("dedupeKey");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_availableAt_idx" ON "OutboxEvent"("status", "availableAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_aggregateType_aggregateId_idx" ON "OutboxEvent"("aggregateType", "aggregateId");

-- CreateIndex
CREATE UNIQUE INDEX "FileAsset_objectKey_key" ON "FileAsset"("objectKey");

-- CreateIndex
CREATE INDEX "FileAsset_ownerUserId_namespace_deletedAt_idx" ON "FileAsset"("ownerUserId", "namespace", "deletedAt");

-- CreateIndex
CREATE INDEX "FileAsset_providerId_namespace_deletedAt_idx" ON "FileAsset"("providerId", "namespace", "deletedAt");

-- CreateIndex
CREATE INDEX "FileAsset_scanStatus_createdAt_idx" ON "FileAsset"("scanStatus", "createdAt");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SensitiveIdentity" ADD CONSTRAINT "SensitiveIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "City" ADD CONSTRAINT "City_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Neighborhood" ADD CONSTRAINT "Neighborhood_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Neighborhood" ADD CONSTRAINT "Neighborhood_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProviderOrganization" ADD CONSTRAINT "ProviderOrganization_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ProviderOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalProfile" ADD CONSTRAINT "ProfessionalProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalAffiliation" ADD CONSTRAINT "ProfessionalAffiliation_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "ProfessionalProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalAffiliation" ADD CONSTRAINT "ProfessionalAffiliation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "ProviderOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalAffiliation" ADD CONSTRAINT "ProfessionalAffiliation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceCategory" ADD CONSTRAINT "ServiceCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardService" ADD CONSTRAINT "StandardService_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOffering" ADD CONSTRAINT "ServiceOffering_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOffering" ADD CONSTRAINT "ServiceOffering_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOffering" ADD CONSTRAINT "ServiceOffering_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "ProfessionalProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceOffering" ADD CONSTRAINT "ServiceOffering_standardServiceId_fkey" FOREIGN KEY ("standardServiceId") REFERENCES "StandardService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceRecipient" ADD CONSTRAINT "ServiceRecipient_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "ServiceRecipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "ServiceOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingItem" ADD CONSTRAINT "BookingItem_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "ProfessionalProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingTransition" ADD CONSTRAINT "BookingTransition_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerTransaction" ADD CONSTRAINT "LedgerTransaction_reversedById_fkey" FOREIGN KEY ("reversedById") REFERENCES "LedgerTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "LedgerTransaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LedgerEntry" ADD CONSTRAINT "LedgerEntry_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "LedgerAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FileAsset" ADD CONSTRAINT "FileAsset_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderOrganization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

