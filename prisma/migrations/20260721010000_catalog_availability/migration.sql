-- Catalog quotes and shared availability calendar foundations.

CREATE TYPE "ScheduleOwnerType" AS ENUM ('PROFESSIONAL', 'BRANCH');
CREATE TYPE "ScheduleExceptionKind" AS ENUM ('CLOSED', 'AVAILABLE');

ALTER TABLE "ServiceOffering"
    ADD CONSTRAINT "ServiceOffering_price_min_check" CHECK ("priceMinToman" IS NULL OR "priceMinToman" >= 0),
    ADD CONSTRAINT "ServiceOffering_price_max_check" CHECK ("priceMaxToman" IS NULL OR "priceMaxToman" >= 0),
    ADD CONSTRAINT "ServiceOffering_price_range_check" CHECK (
        "priceMinToman" IS NULL OR "priceMaxToman" IS NULL OR "priceMaxToman" >= "priceMinToman"
    ),
    ADD CONSTRAINT "ServiceOffering_base_duration_check" CHECK ("baseDurationMinute" BETWEEN 5 AND 720),
    ADD CONSTRAINT "ServiceOffering_preparation_check" CHECK ("preparationMinute" BETWEEN 0 AND 180),
    ADD CONSTRAINT "ServiceOffering_cleanup_check" CHECK ("cleanupMinute" BETWEEN 0 AND 180),
    ADD CONSTRAINT "ServiceOffering_buffer_before_check" CHECK ("bufferBeforeMinute" BETWEEN 0 AND 180),
    ADD CONSTRAINT "ServiceOffering_buffer_after_check" CHECK ("bufferAfterMinute" BETWEEN 0 AND 180),
    ADD CONSTRAINT "ServiceOffering_version_check" CHECK ("version" > 0),
    ADD CONSTRAINT "ServiceOffering_published_active_check" CHECK (NOT "published" OR "active");

CREATE TABLE "ServiceQuote" (
    "id" UUID NOT NULL,
    "offeringId" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "customerUserId" UUID,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceToman" BIGINT NOT NULL,
    "totalToman" BIGINT NOT NULL,
    "durationMinute" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceQuote_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ServiceQuote_quantity_check" CHECK ("quantity" BETWEEN 1 AND 20),
    CONSTRAINT "ServiceQuote_unit_price_check" CHECK ("unitPriceToman" >= 0),
    CONSTRAINT "ServiceQuote_total_check" CHECK ("totalToman" >= 0),
    CONSTRAINT "ServiceQuote_duration_check" CHECK ("durationMinute" BETWEEN 1 AND 1440),
    CONSTRAINT "ServiceQuote_expiry_check" CHECK ("expiresAt" > "createdAt"),
    CONSTRAINT "ServiceQuote_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "ServiceOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceQuote_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ServiceQuote_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "ServiceQuote_offering_expiry_idx" ON "ServiceQuote"("offeringId", "expiresAt");
CREATE INDEX "ServiceQuote_customer_created_idx" ON "ServiceQuote"("customerUserId", "createdAt");

CREATE TABLE "WeeklyScheduleRule" (
    "id" UUID NOT NULL,
    "ownerType" "ScheduleOwnerType" NOT NULL,
    "ownerId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "timezone" VARCHAR(80) NOT NULL DEFAULT 'Asia/Tehran',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyScheduleRule_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WeeklyScheduleRule_day_check" CHECK ("dayOfWeek" BETWEEN 0 AND 6),
    CONSTRAINT "WeeklyScheduleRule_start_check" CHECK ("startMinute" BETWEEN 0 AND 1439),
    CONSTRAINT "WeeklyScheduleRule_end_check" CHECK ("endMinute" BETWEEN 1 AND 1440),
    CONSTRAINT "WeeklyScheduleRule_window_check" CHECK ("startMinute" < "endMinute"),
    CONSTRAINT "WeeklyScheduleRule_version_check" CHECK ("version" > 0),
    CONSTRAINT "WeeklyScheduleRule_owner_window_key" UNIQUE ("ownerType", "ownerId", "dayOfWeek", "startMinute", "endMinute")
);

CREATE INDEX "WeeklyScheduleRule_owner_day_idx" ON "WeeklyScheduleRule"("ownerType", "ownerId", "dayOfWeek", "active");

CREATE TABLE "ScheduleException" (
    "id" UUID NOT NULL,
    "ownerType" "ScheduleOwnerType" NOT NULL,
    "ownerId" UUID NOT NULL,
    "kind" "ScheduleExceptionKind" NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6) NOT NULL,
    "reason" VARCHAR(500),
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleException_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ScheduleException_range_check" CHECK ("startsAt" < "endsAt"),
    CONSTRAINT "ScheduleException_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "ScheduleException_owner_range_idx" ON "ScheduleException"("ownerType", "ownerId", "startsAt", "endsAt");
CREATE INDEX "ScheduleException_creator_idx" ON "ScheduleException"("createdBy", "createdAt");
