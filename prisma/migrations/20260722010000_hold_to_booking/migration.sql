-- Atomic conversion from a temporary hold to a persisted booking allocation.

ALTER TABLE "BookingHold"
    ADD CONSTRAINT "BookingHold_consumedBookingId_key" UNIQUE ("consumedBookingId");

ALTER TABLE "BookingHold"
    DROP CONSTRAINT "BookingHold_active_resource_overlap_excl";

-- A consumed hold remains the authoritative resource allocation for its Booking.
-- Keeping ACTIVE and CONSUMED in one exclusion constraint prevents a gap while
-- the conversion transaction creates Booking/BookingItem rows.
ALTER TABLE "BookingHold"
    ADD CONSTRAINT "BookingHold_allocated_resource_overlap_excl"
    EXCLUDE USING gist (
        "resourceType" WITH =,
        "resourceId" WITH =,
        tstzrange("occupiedFrom", "occupiedUntil", '[)') WITH &&
    ) WHERE ("status" IN ('ACTIVE', 'CONSUMED'));

ALTER TABLE "Booking"
    ADD CONSTRAINT "Booking_currency_check" CHECK ("currency" = 'TOMAN'),
    ADD CONSTRAINT "Booking_subtotal_check" CHECK ("subtotalToman" >= 0),
    ADD CONSTRAINT "Booking_discount_check" CHECK ("discountToman" >= 0 AND "discountToman" <= "subtotalToman"),
    ADD CONSTRAINT "Booking_travel_fee_check" CHECK ("travelFeeToman" >= 0),
    ADD CONSTRAINT "Booking_platform_fee_check" CHECK ("platformFeeToman" >= 0),
    ADD CONSTRAINT "Booking_total_check" CHECK (
        "totalToman" = "subtotalToman" - "discountToman" + "travelFeeToman" + "platformFeeToman"
    ),
    ADD CONSTRAINT "Booking_version_check" CHECK ("version" > 0);

ALTER TABLE "BookingItem"
    ADD CONSTRAINT "BookingItem_service_range_check" CHECK ("startsAt" < "endsAt"),
    ADD CONSTRAINT "BookingItem_occupied_range_check" CHECK ("occupiedFrom" < "occupiedUntil"),
    ADD CONSTRAINT "BookingItem_service_inside_occupied_check" CHECK (
        "occupiedFrom" <= "startsAt" AND "endsAt" <= "occupiedUntil"
    ),
    ADD CONSTRAINT "BookingItem_unit_price_check" CHECK ("unitPriceToman" >= 0),
    ADD CONSTRAINT "BookingItem_quantity_check" CHECK ("quantity" BETWEEN 1 AND 20),
    ADD CONSTRAINT "BookingItem_travel_before_check" CHECK ("travelBeforeMinute" >= 0),
    ADD CONSTRAINT "BookingItem_travel_after_check" CHECK ("travelAfterMinute" >= 0);

CREATE INDEX "BookingHold_consumed_booking_idx"
    ON "BookingHold"("consumedBookingId") WHERE "consumedBookingId" IS NOT NULL;
