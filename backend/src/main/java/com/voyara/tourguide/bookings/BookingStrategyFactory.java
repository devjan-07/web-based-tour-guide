package com.voyara.tourguide.bookings;

import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * Factory Pattern: creates/selects the BookingStrategy for a booking type.
 *
 * Where it is used:
 * BookingService asks this factory for the strategy instead of directly
 * constructing or selecting concrete strategy classes.
 *
 * Why:
 * The booking workflow supports multiple booking types. Centralising the
 * mapping between booking type and strategy keeps that selection logic out
 * of BookingService and makes the strategy set easier to extend.
 *
 * Benefit:
 * The client (BookingService) depends on the BookingStrategy abstraction
 * rather than concrete strategy implementations.
 */
@Component
public class BookingStrategyFactory {

    private final Map<String, BookingStrategy> strategies = new java.util.HashMap<>();

    public BookingStrategyFactory(List<BookingStrategy> strategyList) {
        for (BookingStrategy strategy : strategyList) {
            if (strategy instanceof PackageBookingStrategy) {
                strategies.put("PACKAGE", strategy);
            } else if (strategy instanceof AccommodationBookingStrategy) {
                strategies.put("ACCOMMODATION", strategy);
            } else if (strategy instanceof VehicleBookingStrategy) {
                strategies.put("VEHICLE", strategy);
            }
        }
    }

    /**
     * Returns the strategy for the supplied booking type.
     *
     * @param bookingType normalized booking type
     * @return matching strategy
     */
    public BookingStrategy getStrategy(String bookingType) {
        BookingStrategy strategy = strategies.get(bookingType);

        if (strategy == null) {
            return new NoOpBookingStrategy();
        }

        return strategy;
    }

    /**
     * Temporary no-op strategy for booking types that have not yet been
     * extracted into concrete strategies. This keeps unsupported strategy
     * selections unchanged while patterns are introduced incrementally.
     */
    private static final class NoOpBookingStrategy implements BookingStrategy {

        @Override
        public java.math.BigDecimal apply(Booking candidate, String updatingId, boolean strictCustomerBooking) {
            return java.math.BigDecimal.ZERO;
        }
    }
}
