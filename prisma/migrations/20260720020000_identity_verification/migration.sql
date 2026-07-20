-- Customer identity verification attempts and provider-neutral evidence.
-- National IDs are stored only as keyed HMAC plus encrypted ciphertext in SensitiveIdentity.

CREATE TABLE "IdentityVerificationAttempt" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "providerKey" VARCHAR(60) NOT NULL,
    "status" VARCHAR(40) NOT NULL,
    "nationalIdHmac" VARCHAR(128) NOT NULL,
    "mobileHmac" VARCHAR(128) NOT NULL,
    "nameFingerprint" VARCHAR(128) NOT NULL,
    "providerReference" VARCHAR(180),
    "decisionReasonCode" VARCHAR(100),
    "submittedAt" TIMESTAMPTZ(6) NOT NULL,
    "decidedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityVerificationAttempt_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "IdentityVerificationAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "IdentityVerificationAttempt_user_created_idx"
    ON "IdentityVerificationAttempt"("userId", "createdAt" DESC);

CREATE INDEX "IdentityVerificationAttempt_status_created_idx"
    ON "IdentityVerificationAttempt"("status", "createdAt" DESC);

CREATE INDEX "IdentityVerificationAttempt_national_hmac_idx"
    ON "IdentityVerificationAttempt"("nationalIdHmac");

CREATE UNIQUE INDEX "IdentityVerificationAttempt_provider_reference_key"
    ON "IdentityVerificationAttempt"("providerKey", "providerReference")
    WHERE "providerReference" IS NOT NULL;
