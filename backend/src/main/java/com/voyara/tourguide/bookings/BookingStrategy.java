package com.voyara.tourguide.bookings;

import java.math.BigDecimal;

/**
 * Strategy Pattern contract for booking-type-specific validation and pricing.
 *
 * Design Pattern: Strategy
 * Where it is used:
 * - BookingService will select a concrete BookingStrategy based on booking type.
 * - Concrete strategies will encapsulate the varying booking algorithms
 *   instead of keeping all booking-type-specific behaviour in BookingService.
 *
 * Why:
 * The project has different booking behaviours for PACKAGE, CUSTOM,
 * ACCOMMODATION and VEHICLE bookings. A common strategy contract allows
 * those algorithms to be changed independently while BookingService
 * remains focused on coordinating the common booking workflow.
 *
 * Design note:
 * The strategy returns only the booking-type-specific base-price contribution.
 * Common resource validation and resource-based pricing remain in BookingService
 * so existing guide, accommodation and vehicle allocation rules are not duplicated.
 */
public interface BookingStrategy {

    /**
     * Applies booking-type-specific validation/preparation and returns the
     * booking-type-specific base-price contribution.
     *
     * @param candidate the booking being validated/priced
     * @param updatingId existing booking ID when updating, otherwise null
     * @param strictCustomerBooking whether customer-facing validation applies
     * @return the base-price contribution for this booking type
     */
    BigDecimal apply(Booking candidate, String updatingId, boolean strictCustomerBooking);
}
