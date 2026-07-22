-- Provider decision workflow and efficient manual-approval expiry scans.

CREATE INDEX "Booking_status_approval_deadline_idx"
    ON "Booking"("status", "approvalDeadlineAt", "id");
