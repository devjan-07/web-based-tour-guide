package com.voyara.tourguide.bookings;

import com.voyara.tourguide.vehiclerental.Vehicle;
import com.voyara.tourguide.vehiclerental.VehicleRepository;
import java.math.BigDecimal;
import java.time.temporal.ChronoUnit;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Strategy Pattern: concrete strategy for VEHICLE bookings.
 *
 * Where it is used:
 * BookingStrategyFactory selects this strategy when the booking type is
 * VEHICLE.
 *
 * Why:
 * Vehicle bookings have booking-type-specific rules such as vehicle lookup,
 * availability, passenger-capacity validation, pickup/return requirements
 * and vehicle pricing. These rules vary from package and accommodation
 * booking algorithms and are therefore encapsulated in this strategy.
 */
@Component
public class VehicleBookingStrategy implements BookingStrategy {

    private final VehicleRepository vehicleRepository;

    public VehicleBookingStrategy(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    @Override
    public BigDecimal apply(Booking candidate, String updatingId, boolean strictCustomerBooking) {
        if (!"VEHICLE".equalsIgnoreCase(candidate.getBookingType())) {
            return BigDecimal.ZERO;
        }

        Vehicle vehicle = selectedVehicle(candidate);

        if (vehicle == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A vehicle booking requires a valid vehicle"
            );
        }

        if (!"Available".equalsIgnoreCase(vehicle.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Vehicle is not available for booking"
            );
        }

        if (candidate.getGuests() > vehicle.getCapacity()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Passenger count exceeds the selected vehicle capacity"
            );
        }

        if (strictCustomerBooking) {
            requireText(candidate.getPickupLocation(), "Pickup location is required");
            requireText(candidate.getPickupTime(), "Pickup time is required");
            requireText(candidate.getReturnLocation(), "Return location is required");
            requireText(candidate.getReturnTime(), "Return time is required");
        }

        candidate.setVehicle(label(vehicle.getName(), vehicle.getBrand(), vehicle.getModel()));
        candidate.setDestination(candidate.getPickupLocation());

        int days = (int) Math.max(
                1,
                ChronoUnit.DAYS.between(candidate.getCheckIn(), candidate.getCheckOut())
        );

        return nonNull(vehicle.getPricePerDay())
                .multiply(BigDecimal.valueOf(days));
    }

    private Vehicle selectedVehicle(Booking booking) {
        if ("OWN".equalsIgnoreCase(booking.getVehicleSelectionType())
                || booking.getVehicleId() == null) {
            return null;
        }

        Vehicle vehicle = vehicleRepository.findById(booking.getVehicleId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Selected vehicle was not found"
                ));

        booking.setVehicleResource(vehicle);
        return vehicle;
    }

    private void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private BigDecimal nonNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String label(String... values) {
        return String.join(" · ",
                java.util.Arrays.stream(values)
                        .filter(value -> value != null && !value.isBlank())
                        .toList());
    }
}
