-- Authentication and RBAC operational tables.
-- Secrets, OTP values and raw request metadata are never stored in plaintext.

CREATE TABLE "LoginCredential" (
    "userId" UUID NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "passwordAlgorithm" VARCHAR(40) NOT NULL DEFAULT 'scrypt-v1',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorRequired" BOOLEAN NOT NULL DEFAULT true,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMPTZ(6),
    "passwordChangedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginCredential_pkey" PRIMARY KEY ("userId"),
    CONSTRAINT "LoginCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "LoginCredential_lockedUntil_idx" ON "LoginCredential"("lockedUntil");

CREATE TABLE "OtpChallenge" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "mobileNormalized" VARCHAR(16) NOT NULL,
    "purpose" VARCHAR(40) NOT NULL,
    "codeHash" VARCHAR(128) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL,
    "expiresAt" TIMESTAMPTZ(6) NOT NULL,
    "resendAfter" TIMESTAMPTZ(6) NOT NULL,
    "consumedAt" TIMESTAMPTZ(6),
    "invalidatedAt" TIMESTAMPTZ(6),
    "requestedIpHash" VARCHAR(128),
    "userAgentSummary" VARCHAR(300),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OtpChallenge_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OtpChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "OtpChallenge_mobile_purpose_created_idx" ON "OtpChallenge"("mobileNormalized", "purpose", "createdAt" DESC);
CREATE INDEX "OtpChallenge_user_purpose_created_idx" ON "OtpChallenge"("userId", "purpose", "createdAt" DESC);
CREATE INDEX "OtpChallenge_expiry_idx" ON "OtpChallenge"("expiresAt", "consumedAt", "invalidatedAt");

CREATE TABLE "AuthRateLimit" (
    "keyHash" VARCHAR(128) NOT NULL,
    "action" VARCHAR(80) NOT NULL,
    "windowStartedAt" TIMESTAMPTZ(6) NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "blockedUntil" TIMESTAMPTZ(6),
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("keyHash", "action")
);

CREATE INDEX "AuthRateLimit_blockedUntil_idx" ON "AuthRateLimit"("blockedUntil");

ALTER TABLE "Session"
    ADD COLUMN "authMethod" VARCHAR(40) NOT NULL DEFAULT 'OTP',
    ADD COLUMN "idleExpiresAt" TIMESTAMPTZ(6),
    ADD COLUMN "revocationReason" VARCHAR(100);

UPDATE "Session"
SET "idleExpiresAt" = LEAST("expiresAt", "lastSeenAt" + INTERVAL '7 days')
WHERE "idleExpiresAt" IS NULL;

ALTER TABLE "Session"
    ALTER COLUMN "idleExpiresAt" SET NOT NULL;

CREATE INDEX "Session_token_active_idx" ON "Session"("tokenHash", "revokedAt", "expiresAt", "idleExpiresAt");
