-- Transactional booking holds with idempotency, TTL and resource overlap protection.

CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TYPE "BookingHoldStatus" AS ENUM ('ACTIVE', 'CONSUMED', 'EXPIRED', 'RELEASED');

CREATE TABLE "BookingHold" (
    "id" UUID NOT NULL,
    "customerUserId" UUID NOT NULL,
    "quoteId" UUID NOT NULL,
    "offeringId" UUID NOT NULL,
    "providerId" UUID NOT NULL,
    "branchId" UUID,
    "professionalId" UUID,
    "resourceType" "ScheduleOwnerType" NOT NULL,
    "resourceId" UUID NOT NULL,
    "startsAt" TIMESTAMPTZ(6) NOT NULL,
    "endsAt" TIMESTAMPTZ(6) NOT NULL,
    "occupiedFrom" TIMESTAMPTZ(6) NOT NULL,
    "occupiedUntil" TIMESTAMPTZ(6) NOT NULL,
    "status" "BookingHoldStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "idempotencyKey" VARCHAR(160) NOT NULL,
    "requestHash" VARCHAR(128) NOT NULL,
    "snapshot" JSONB NOT NULL,
    "consumedBookingId" UUID,
    "releasedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingHold_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "BookingHold_customer_idempotency_key" UNIQUE ("customerUserId", "idempotencyKey"),
    CONSTRAINT "BookingHold_service_range_check" CHECK ("startsAt" < "endsAt"),
    CONSTRAINT "BookingHold_occupied_range_check" CHECK ("occupiedFrom" < "occupiedUntil"),
    CONSTRAINT "BookingHold_service_inside_occupied_check" CHECK (
        "occupiedFrom" <= "startsAt" AND "endsAt" <= "occupiedUntil"
    ),
    CONSTRAINT "BookingHold_expiry_check" CHECK ("expiresAt" > "createdAt"),
    CONSTRAINT "BookingHold_resource_target_check" CHECK (
        ("resourceType" = 'PROFESSIONAL' AND "professionalId" = "resourceId") OR
        ("resourceType" = 'BRANCH' AND "branchId" = "resourceId")
    ),
    CONSTRAINT "BookingHold_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BookingHold_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "ServiceQuote"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BookingHold_offeringId_fkey" FOREIGN KEY ("offeringId") REFERENCES "ServiceOffering"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BookingHold_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderOrganization"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BookingHold_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BookingHold_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "ProfessionalProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "BookingHold_consumedBookingId_fkey" FOREIGN KEY ("consumedBookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

ALTER TABLE "BookingHold"
    ADD CONSTRAINT "BookingHold_active_resource_overlap_excl"
    EXCLUDE USING gist (
        "resourceType" WITH =,
        "resourceId" WITH =,
        tstzrange("occupiedFrom", "occupiedUntil", '[)') WITH &&
    ) WHERE ("status" = 'ACTIVE');

CREATE INDEX "BookingHold_resource_status_expiry_idx"
    ON "BookingHold"("resourceType", "resourceId", "status", "expiresAt");
CREATE INDEX "BookingHold_customer_status_created_idx"
    ON "BookingHold"("customerUserId", "status", "createdAt");
CREATE INDEX "BookingHold_quote_created_idx"
    ON "BookingHold"("quoteId", "createdAt");
