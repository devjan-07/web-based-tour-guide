package com.voyara.tourguide.bookings;

import com.voyara.tourguide.packages.TourPackage;
import com.voyara.tourguide.packages.TourPackageRepository;
import java.math.BigDecimal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Strategy Pattern: concrete strategy for PACKAGE bookings.
 *
 * Where it is used:
 * BookingStrategyFactory will select this strategy when the booking type
 * is PACKAGE.
 *
 * Why:
 * Package bookings have rules that differ from other booking types:
 * package lookup, package availability, maximum group validation,
 * package-resource allocation, destination preparation and package pricing.
 *
 * Benefit:
 * These package-specific rules are encapsulated here rather than being
 * mixed into BookingService's common booking workflow.
 */
@Component
public class PackageBookingStrategy implements BookingStrategy {

    private final TourPackageRepository packageRepository;
    private final PackageResourceAllocationService packageResourceAllocationService;

    public PackageBookingStrategy(
            TourPackageRepository packageRepository,
            PackageResourceAllocationService packageResourceAllocationService
    ) {
        this.packageRepository = packageRepository;
        this.packageResourceAllocationService = packageResourceAllocationService;
    }

    @Override
    public BigDecimal apply(Booking candidate, String updatingId, boolean strictCustomerBooking) {
        if (!"PACKAGE".equalsIgnoreCase(candidate.getBookingType())) {
            return BigDecimal.ZERO;
        }

        TourPackage tourPackage = selectedPackage(candidate);

        if (tourPackage == null) {
            if (strictCustomerBooking) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "A package booking requires a valid package"
                );
            }
            return BigDecimal.ZERO;
        }

        validateActive(tourPackage);

        if (tourPackage.getMaxGroup() > 0
                && candidate.getGuests() > tourPackage.getMaxGroup()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Guest count exceeds the selected package maximum group size"
            );
        }

        candidate.setPkg(tourPackage.getName());

        if (candidate.getDestination() == null || candidate.getDestination().isBlank()) {
            candidate.setDestination(String.join(", ", tourPackage.getDestinations()));
        }

        packageResourceAllocationService.allocate(tourPackage, candidate, updatingId);

        return nonNull(tourPackage.getPrice())
                .multiply(BigDecimal.valueOf(candidate.getGuests()));
    }

    private TourPackage selectedPackage(Booking booking) {
        if (booking.getPackageId() == null) {
            return null;
        }

        TourPackage tourPackage = packageRepository.findById(booking.getPackageId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Selected package was not found"
                ));

        booking.setTourPackage(tourPackage);
        return tourPackage;
    }

    private void validateActive(TourPackage tourPackage) {
        if (!"Active".equalsIgnoreCase(tourPackage.getStatus())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Package is not available for booking"
            );
        }
    }

    private BigDecimal nonNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
