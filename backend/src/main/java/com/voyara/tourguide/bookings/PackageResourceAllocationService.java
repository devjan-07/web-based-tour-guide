package com.voyara.tourguide.bookings;

import com.voyara.tourguide.accommodations.Accommodation;
import com.voyara.tourguide.packages.TourPackage;
import com.voyara.tourguide.tourguides.TourGuide;
import com.voyara.tourguide.vehiclerental.Vehicle;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PackageResourceAllocationService {
    private final BookingRepository bookingRepository;

    public PackageResourceAllocationService(BookingRepository bookingRepository) {
        this.bookingRepository = bookingRepository;
    }

    @Transactional
    public void allocate(TourPackage tourPackage, Booking booking, String updatingId) {
        String included = tourPackage.getIncluded() == null
                ? ""
                : tourPackage.getIncluded().toLowerCase(Locale.ROOT);

        if (requiresGuide(included)) {
            allocateGuide(tourPackage, booking, updatingId);
        }
        if (requiresAccommodation(included)) {
            allocateAccommodation(tourPackage, booking, updatingId);
        }
        if (requiresVehicle(included)) {
            allocateVehicle(tourPackage, booking, updatingId);
        }
    }

    /**
     * Calculates the same date-aware assignment that the booking flow will use,
     * but does not persist a booking or reserve a resource. The final booking
     * flow must call allocate() again so availability is re-checked at commit time.
     */
    @Transactional(readOnly = true)
    public PackageResourceAllocationPreview preview(TourPackage tourPackage, Booking booking, String updatingId) {
        allocate(tourPackage, booking, updatingId);

        List<PackageResourceAllocationPreview.ResourceOption> guideOptions =
                tourPackage.getEligibleGuides().stream()
                        .filter(guide -> "Available".equalsIgnoreCase(guide.getStatus()))
                        .filter(guide -> isGuideAvailable(guide, booking, updatingId))
                        .sorted(Comparator.comparingInt((TourGuide guide) -> guideScore(guide, tourPackage, booking)).reversed()
                                .thenComparing(TourGuide::getId))
                        .map(this::guideOption)
                        .toList();

        List<PackageResourceAllocationPreview.ResourceOption> accommodationOptions =
                tourPackage.getEligibleAccommodations().stream()
                        .filter(accommodation -> "Active".equalsIgnoreCase(accommodation.getStatus()))
                        .filter(accommodation -> isAccommodationAvailable(accommodation, booking, updatingId))
                        .sorted(Comparator.comparingInt((Accommodation accommodation) ->
                                        accommodationScore(accommodation, tourPackage)).reversed()
                                .thenComparing(Accommodation::getId))
                        .map(this::accommodationOption)
                        .toList();

        List<PackageResourceAllocationPreview.ResourceOption> vehicleOptions =
                tourPackage.getEligibleVehicles().stream()
                        .filter(vehicle -> "Available".equalsIgnoreCase(vehicle.getStatus()))
                        .filter(vehicle -> booking.getGuests() <= vehicle.getCapacity())
                        .filter(vehicle -> isVehicleAvailable(vehicle, booking, updatingId))
                        .sorted(Comparator.comparingInt((Vehicle vehicle) ->
                                        vehicleScore(vehicle, tourPackage, booking)).reversed()
                                .thenComparing(Vehicle::getId))
                        .map(this::vehicleOption)
                        .toList();

        return new PackageResourceAllocationPreview(
                tourPackage.getId(),
                tourPackage.getName(),
                findGuideOption(tourPackage, booking.getGuideId()),
                findAccommodationOption(tourPackage, booking.getAccommodationId()),
                findVehicleOption(tourPackage, booking.getVehicleId()),
                guideOptions,
                accommodationOptions,
                vehicleOptions
        );
    }

    private PackageResourceAllocationPreview.ResourceOption findGuideOption(TourPackage tourPackage, Long id) {
        if (id == null) {
            return null;
        }
        return tourPackage.getEligibleGuides().stream()
                .filter(item -> Objects.equals(item.getId(), id))
                .findFirst()
                .map(this::guideOption)
                .orElse(null);
    }

    private PackageResourceAllocationPreview.ResourceOption findAccommodationOption(TourPackage tourPackage, Long id) {
        if (id == null) {
            return null;
        }
        return tourPackage.getEligibleAccommodations().stream()
                .filter(item -> Objects.equals(item.getId(), id))
                .findFirst()
                .map(this::accommodationOption)
                .orElse(null);
    }

    private PackageResourceAllocationPreview.ResourceOption findVehicleOption(TourPackage tourPackage, Long id) {
        if (id == null) {
            return null;
        }
        return tourPackage.getEligibleVehicles().stream()
                .filter(item -> Objects.equals(item.getId(), id))
                .findFirst()
                .map(this::vehicleOption)
                .orElse(null);
    }

    private PackageResourceAllocationPreview.ResourceOption guideOption(TourGuide guide) {
        return new PackageResourceAllocationPreview.ResourceOption(
                guide.getId(),
                guide.getName(),
                guide.getLocation(),
                guide.getProfilePhoto(),
                "Guide",
                guide.getRating(),
                guide.getReviews(),
                guide.getPricePerDay(),
                null,
                null,
                guide.getExperience(),
                copyList(guide.getSpecialties()),
                copyList(guide.getLanguages()),
                null,
                null,
                null,
                null
        );
    }

    private PackageResourceAllocationPreview.ResourceOption accommodationOption(Accommodation accommodation) {
        return new PackageResourceAllocationPreview.ResourceOption(
                accommodation.getId(),
                accommodation.getName(),
                accommodation.getLocation(),
                accommodation.getImage(),
                accommodation.getType(),
                accommodation.getRating(),
                accommodation.getReviews(),
                null,
                accommodation.getPrice(),
                null,
                null,
                null,
                null,
                copyList(accommodation.getAmenities()),
                null,
                null,
                null
        );
    }

    private PackageResourceAllocationPreview.ResourceOption vehicleOption(Vehicle vehicle) {
        return new PackageResourceAllocationPreview.ResourceOption(
                vehicle.getId(),
                vehicle.getName(),
                vehicle.getLocation(),
                vehicle.getImage(),
                vehicle.getType(),
                vehicle.getRating(),
                vehicle.getReviews(),
                vehicle.getPricePerDay(),
                null,
                vehicle.getCapacity(),
                null,
                null,
                null,
                null,
                vehicle.getTransmission(),
                vehicle.getFuel(),
                copyList(vehicle.getFeatures())
        );
    }

    private <T> List<T> copyList(List<T> values) {
        return values == null ? List.of() : List.copyOf(values);
    }

    private void allocateGuide(TourPackage tourPackage, Booking booking, String updatingId) {
        if ("OWN".equalsIgnoreCase(booking.getGuideSelectionType())) {
            return;
        }

        if (booking.getGuideId() != null) {
            TourGuide selected = tourPackage.getEligibleGuides().stream()
                    .filter(guide -> Objects.equals(guide.getId(), booking.getGuideId()))
                    .findFirst()
                    .orElseThrow(() -> conflict("The selected guide is not eligible for this package"));
            if (!isGuideAvailable(selected, booking, updatingId)) {
                throw conflict("The selected guide is unavailable for the requested dates");
            }
            booking.setGuideSelectionType("VOYARA");
            return;
        }

        TourGuide allocated = tourPackage.getEligibleGuides().stream()
                .filter(guide -> "Available".equalsIgnoreCase(guide.getStatus()))
                .filter(guide -> isGuideAvailable(guide, booking, updatingId))
                .sorted(Comparator.comparingInt((TourGuide guide) -> guideScore(guide, tourPackage, booking)).reversed()
                        .thenComparing(TourGuide::getId))
                .findFirst()
                .orElseThrow(() -> conflict(
                        "No eligible tour guide is available for this package on the requested dates"));

        booking.setGuideId(allocated.getId());
        booking.setGuideSelectionType("VOYARA");
    }

    private void allocateAccommodation(TourPackage tourPackage, Booking booking, String updatingId) {
        if ("OWN".equalsIgnoreCase(booking.getAccommodationSelectionType())) {
            return;
        }

        if (booking.getAccommodationId() != null) {
            Accommodation selected = tourPackage.getEligibleAccommodations().stream()
                    .filter(accommodation -> Objects.equals(accommodation.getId(), booking.getAccommodationId()))
                    .findFirst()
                    .orElseThrow(() -> conflict("The selected accommodation is not eligible for this package"));
            if (!isAccommodationAvailable(selected, booking, updatingId)) {
                throw conflict("The selected accommodation does not have enough rooms for the requested dates");
            }
            booking.setAccommodationSelectionType("VOYARA");
            return;
        }

        Accommodation allocated = tourPackage.getEligibleAccommodations().stream()
                .filter(accommodation -> "Active".equalsIgnoreCase(accommodation.getStatus()))
                .filter(accommodation -> isAccommodationAvailable(accommodation, booking, updatingId))
                .sorted(Comparator.comparingInt((Accommodation accommodation) ->
                                accommodationScore(accommodation, tourPackage)).reversed()
                        .thenComparing(Accommodation::getId))
                .findFirst()
                .orElseThrow(() -> conflict(
                        "No eligible accommodation has enough rooms for this package on the requested dates"));

        booking.setAccommodationId(allocated.getId());
        booking.setAccommodationSelectionType("VOYARA");
    }

    private void allocateVehicle(TourPackage tourPackage, Booking booking, String updatingId) {
        if ("OWN".equalsIgnoreCase(booking.getVehicleSelectionType())) {
            return;
        }

        if (booking.getVehicleId() != null) {
            Vehicle selected = tourPackage.getEligibleVehicles().stream()
                    .filter(vehicle -> Objects.equals(vehicle.getId(), booking.getVehicleId()))
                    .findFirst()
                    .orElseThrow(() -> conflict("The selected vehicle is not eligible for this package"));
            if (!isVehicleAvailable(selected, booking, updatingId)) {
                throw conflict("The selected vehicle is unavailable for the requested dates");
            }
            if (booking.getGuests() > selected.getCapacity()) {
                throw conflict("The selected vehicle cannot accommodate the requested number of guests");
            }
            booking.setVehicleSelectionType("VOYARA");
            return;
        }

        Vehicle allocated = tourPackage.getEligibleVehicles().stream()
                .filter(vehicle -> "Available".equalsIgnoreCase(vehicle.getStatus()))
                .filter(vehicle -> booking.getGuests() <= vehicle.getCapacity())
                .filter(vehicle -> isVehicleAvailable(vehicle, booking, updatingId))
                .sorted(Comparator.comparingInt((Vehicle vehicle) ->
                                vehicleScore(vehicle, tourPackage, booking)).reversed()
                        .thenComparing(Vehicle::getId))
                .findFirst()
                .orElseThrow(() -> conflict(
                        "No eligible vehicle with sufficient capacity is available for this package on the requested dates"));

        booking.setVehicleId(allocated.getId());
        booking.setVehicleSelectionType("VOYARA");
    }

    private boolean isGuideAvailable(TourGuide guide, Booking booking, String updatingId) {
        return bookingRepository.findAll().stream()
                .filter(existing -> !Objects.equals(existing.getId(), updatingId))
                .filter(this::isActiveBooking)
                .filter(existing -> overlaps(existing, booking))
                .noneMatch(existing -> Objects.equals(existing.getGuideId(), guide.getId()));
    }

    private boolean isVehicleAvailable(Vehicle vehicle, Booking booking, String updatingId) {
        return bookingRepository.findAll().stream()
                .filter(existing -> !Objects.equals(existing.getId(), updatingId))
                .filter(this::isActiveBooking)
                .filter(existing -> overlaps(existing, booking))
                .noneMatch(existing -> Objects.equals(existing.getVehicleId(), vehicle.getId()));
    }

    private boolean isAccommodationAvailable(Accommodation accommodation, Booking booking, String updatingId) {
        int requestedRooms = booking.getRooms() == null ? 1 : Math.max(1, booking.getRooms());
        if (requestedRooms > accommodation.getRooms()) {
            return false;
        }

        int bookedRooms = bookingRepository.findAll().stream()
                .filter(existing -> !Objects.equals(existing.getId(), updatingId))
                .filter(this::isActiveBooking)
                .filter(existing -> overlaps(existing, booking))
                .filter(existing -> Objects.equals(existing.getAccommodationId(), accommodation.getId()))
                .mapToInt(existing -> existing.getRooms() == null ? 1 : Math.max(1, existing.getRooms()))
                .sum();

        return bookedRooms + requestedRooms <= accommodation.getRooms();
    }

    private boolean isActiveBooking(Booking booking) {
        return !"Cancelled".equalsIgnoreCase(booking.getStatus())
                && booking.getCheckIn() != null
                && booking.getCheckOut() != null;
    }

    private boolean overlaps(Booking first, Booking second) {
        return second.getCheckIn().isBefore(first.getCheckOut())
                && second.getCheckOut().isAfter(first.getCheckIn());
    }

    private int guideScore(TourGuide guide, TourPackage tourPackage, Booking booking) {
        int score = 0;
        String destination = String.join(" ", tourPackage.getDestinations()).toLowerCase(Locale.ROOT);
        String language = booking.getLanguagePreference() == null
                ? ""
                : booking.getLanguagePreference().toLowerCase(Locale.ROOT);

        if (!language.isBlank() && guide.getLanguages().stream()
                .anyMatch(value -> value != null && value.equalsIgnoreCase(language))) {
            score += 40;
        }
        if (guide.getLocation() != null && destination.contains(guide.getLocation().toLowerCase(Locale.ROOT))) {
            score += 25;
        }
        if (tourPackage.getCategory() != null && guide.getSpecialties().stream()
                .anyMatch(value -> value != null
                        && value.toLowerCase(Locale.ROOT).contains(tourPackage.getCategory().toLowerCase(Locale.ROOT)))) {
            score += 20;
        }
        score += Math.round((float) guide.getRating() * 5);
        score += Math.min(10, guide.getExperience());
        return score;
    }

    private int accommodationScore(Accommodation accommodation, TourPackage tourPackage) {
        int score = 0;
        String destinations = String.join(" ", tourPackage.getDestinations()).toLowerCase(Locale.ROOT);
        String location = accommodation.getLocation() == null
                ? ""
                : accommodation.getLocation().toLowerCase(Locale.ROOT);

        if (!location.isBlank() && destinations.contains(location)) {
            score += 60;
        }
        score += Math.round((float) accommodation.getRating() * 5);
        return score;
    }

    private int vehicleScore(Vehicle vehicle, TourPackage tourPackage, Booking booking) {
        int score = 0;
        String destinations = String.join(" ", tourPackage.getDestinations()).toLowerCase(Locale.ROOT);
        String location = vehicle.getLocation() == null
                ? ""
                : vehicle.getLocation().toLowerCase(Locale.ROOT);

        if (!location.isBlank() && destinations.contains(location)) {
            score += 35;
        }
        if (vehicle.getCapacity() >= booking.getGuests()) {
            score += 25;
        }
        score += Math.round((float) vehicle.getRating() * 5);
        return score;
    }

    private boolean requiresGuide(String included) {
        return included.contains("guide") || included.contains("naturalist");
    }

    private boolean requiresAccommodation(String included) {
        return included.contains("hotel")
                || included.contains("accommodation")
                || included.contains("lodge")
                || included.contains("stay")
                || included.contains("villa")
                || included.contains("bungalow")
                || included.contains("inn");
    }

    private boolean requiresVehicle(String included) {
        return included.contains("transport")
                || included.contains("transfer")
                || included.contains("private van")
                || included.contains("safari jeep");
    }

    private ResponseStatusException conflict(String message) {
        return new ResponseStatusException(HttpStatus.CONFLICT, message);
    }
}
