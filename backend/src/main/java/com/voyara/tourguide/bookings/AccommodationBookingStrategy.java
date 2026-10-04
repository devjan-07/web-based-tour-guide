package com.voyara.tourguide.bookings;

import com.voyara.tourguide.accommodations.Accommodation;
import com.voyara.tourguide.accommodations.AccommodationRepository;
import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

/**
 * Strategy Pattern: concrete strategy for ACCOMMODATION bookings.
 *
 * Where it is used:
 * BookingStrategyFactory selects this strategy when the booking type is
 * ACCOMMODATION.
 *
 * Why:
 * Accommodation bookings have booking-type-specific rules such as requiring
 * an accommodation, validating room type, checking room capacity and pricing
 * the requested rooms by the number of booking days.
 */
@Component
public class AccommodationBookingStrategy implements BookingStrategy {

    private final AccommodationRepository accommodationRepository;
    private final BookingRepository bookingRepository;

    public AccommodationBookingStrategy(
            AccommodationRepository accommodationRepository,
            BookingRepository bookingRepository
    ) {
        this.accommodationRepository = accommodationRepository;
        this.bookingRepository = bookingRepository;
    }

    @Override
    public BigDecimal apply(Booking candidate, String updatingId, boolean strictCustomerBooking) {
        if (!"ACCOMMODATION".equalsIgnoreCase(candidate.getBookingType())) {
            return BigDecimal.ZERO;
        }

        Accommodation accommodation = selectedAccommodation(candidate);

        if (accommodation == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "An accommodation booking requires a valid accommodation"
            );
        }

        if (!"Active".equalsIgnoreCase(accommodation.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Accommodation is not available for booking"
            );
        }

        if (strictCustomerBooking && (candidate.getRoomType() == null || candidate.getRoomType().isBlank())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Room type is required"
            );
        }

        int requestedRooms = candidate.getRooms() == null ? 1 : Math.max(1, candidate.getRooms());

        if (requestedRooms > accommodation.getRooms()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Requested rooms exceed available rooms at this accommodation"
            );
        }

        int bookedRooms = bookedAccommodationRooms(candidate, updatingId);
        if (bookedRooms + requestedRooms > accommodation.getRooms()) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "The selected accommodation does not have enough rooms for these dates"
            );
        }

        candidate.setAccommodation(accommodation.getName());

        int days = (int) Math.max(
                1,
                ChronoUnit.DAYS.between(candidate.getCheckIn(), candidate.getCheckOut())
        );

        return nonNull(accommodation.getPrice())
                .multiply(BigDecimal.valueOf(days))
                .multiply(BigDecimal.valueOf(requestedRooms));
    }

    private Accommodation selectedAccommodation(Booking booking) {
        if ("OWN".equalsIgnoreCase(booking.getAccommodationSelectionType())
                || booking.getAccommodationId() == null) {
            return null;
        }

        Accommodation accommodation = accommodationRepository.findById(booking.getAccommodationId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Selected accommodation was not found"
                ));

        booking.setAccommodationResource(accommodation);
        return accommodation;
    }

    private int bookedAccommodationRooms(Booking candidate, String updatingId) {
        return bookingRepository.findAll().stream()
                .filter(existing -> !java.util.Objects.equals(existing.getId(), updatingId))
                .filter(existing -> !"Cancelled".equalsIgnoreCase(existing.getStatus()))
                .filter(existing -> java.util.Objects.equals(
                        candidate.getAccommodationId(),
                        existing.getAccommodationId()))
                .filter(existing -> existing.getCheckIn() != null && existing.getCheckOut() != null)
                .filter(existing -> candidate.getCheckIn().isBefore(existing.getCheckOut())
                        && candidate.getCheckOut().isAfter(existing.getCheckIn()))
                .mapToInt(existing -> existing.getRooms() == null
                        ? 1
                        : Math.max(1, existing.getRooms()))
                .sum();
    }

    private BigDecimal nonNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
