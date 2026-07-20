-- Provider onboarding, document verification, correction and appeal workflow.

CREATE TABLE "ProviderApplication" (
    "providerId" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "providerMode" VARCHAR(60) NOT NULL,
    "legalName" VARCHAR(220) NOT NULL,
    "publicPhone" VARCHAR(16),
    "privatePhone" VARCHAR(16) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(40) NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMPTZ(6),
    "reviewedAt" TIMESTAMPTZ(6),
    "reviewedByUserId" UUID,
    "reviewReason" TEXT,
    "appealStatus" VARCHAR(40),
    "appealReason" TEXT,
    "appealedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderApplication_pkey" PRIMARY KEY ("providerId"),
    CONSTRAINT "ProviderApplication_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProviderApplication_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProviderApplication_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ProviderApplication_owner_status_idx" ON "ProviderApplication"("ownerUserId", "status");
CREATE INDEX "ProviderApplication_status_submitted_idx" ON "ProviderApplication"("status", "submittedAt");

CREATE TABLE "ProviderDocument" (
    "id" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "ownerUserId" UUID NOT NULL,
    "fileAssetId" UUID NOT NULL,
    "documentType" VARCHAR(80) NOT NULL,
    "expiresAt" TIMESTAMPTZ(6),
    "status" VARCHAR(40) NOT NULL DEFAULT 'PENDING_REVIEW',
    "reviewReason" TEXT,
    "reviewedAt" TIMESTAMPTZ(6),
    "reviewedByUserId" UUID,
    "appealStatus" VARCHAR(40),
    "appealReason" TEXT,
    "appealedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProviderDocument_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProviderDocument_fileAssetId_key" UNIQUE ("fileAssetId"),
    CONSTRAINT "ProviderDocument_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderOrganization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProviderDocument_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProviderDocument_fileAssetId_fkey" FOREIGN KEY ("fileAssetId") REFERENCES "FileAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProviderDocument_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ProviderDocument_provider_status_idx" ON "ProviderDocument"("providerId", "status");
CREATE INDEX "ProviderDocument_expiry_status_idx" ON "ProviderDocument"("expiresAt", "status");
