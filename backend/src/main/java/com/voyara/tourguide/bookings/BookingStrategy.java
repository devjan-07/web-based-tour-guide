package com.voyara.tourguide.bookings;

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
 * remains focused on coordinating the booking workflow.
 */
public interface BookingStrategy {

    /**
     * Validates the booking and calculates its total price.
     *
     * @param candidate the booking being validated/priced
     * @param updatingId existing booking ID when updating, otherwise null
     * @param strictCustomerBooking whether customer-facing validation applies
     */
    void validateAndPrice(Booking candidate, String updatingId, boolean strictCustomerBooking);
}
