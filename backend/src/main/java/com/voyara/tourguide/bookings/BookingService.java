package com.voyara.tourguide.bookings;

import com.voyara.tourguide.accommodations.Accommodation;
import com.voyara.tourguide.accommodations.AccommodationRepository;
import com.voyara.tourguide.common.ResourceNotFoundException;
import com.voyara.tourguide.notifications.NotificationService;
import com.voyara.tourguide.payments.PaymentRepository;
import com.voyara.tourguide.packages.TourPackage;
import com.voyara.tourguide.packages.TourPackageRepository;
import com.voyara.tourguide.reviews.ReviewRatingService;
import com.voyara.tourguide.reviews.ReviewRepository;
import com.voyara.tourguide.tourguides.TourGuide;
import com.voyara.tourguide.tourguides.TourGuideRepository;
import com.voyara.tourguide.users.AppUser;
import com.voyara.tourguide.users.AppUserRepository;
import com.voyara.tourguide.vehiclerental.Vehicle;
import com.voyara.tourguide.vehiclerental.VehicleRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BookingService {
    private final BookingRepository repository;
    private final AppUserRepository userRepository;
    private final TourPackageRepository packageRepository;
    private final TourGuideRepository guideRepository;
    private final AccommodationRepository accommodationRepository;
    private final VehicleRepository vehicleRepository;
    private final PaymentRepository paymentRepository;
    private final ReviewRepository reviewRepository;
    private final ReviewRatingService reviewRatingService;
    private final NotificationService notificationService;

    public BookingService(
            BookingRepository repository,
            AppUserRepository userRepository,
            TourPackageRepository packageRepository,
            TourGuideRepository guideRepository,
            AccommodationRepository accommodationRepository,
            VehicleRepository vehicleRepository,
            PaymentRepository paymentRepository,
            ReviewRepository reviewRepository,
            ReviewRatingService reviewRatingService,
            NotificationService notificationService
    ) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.packageRepository = packageRepository;
        this.guideRepository = guideRepository;
        this.accommodationRepository = accommodationRepository;
        this.vehicleRepository = vehicleRepository;
        this.paymentRepository = paymentRepository;
        this.reviewRepository = reviewRepository;
        this.reviewRatingService = reviewRatingService;
        this.notificationService = notificationService;
    }

    public List<Booking> findAll() {
        return repository.findAll();
    }

    public List<Booking> findByGuestEmail(String email) {
        return repository.findByEmailIgnoreCaseOrderByCreatedAtDesc(email);
    }

    @Transactional(readOnly = true)
    public List<Booking> findTouristBookings(String email) {
        AppUser tourist = findUser(email);
        return repository.findByTouristIdOrderByCreatedAtDesc(tourist.getId());
    }

    @Transactional(readOnly = true)
    public List<Booking> findHotelPartnerBookings(String email) {
        AppUser partner = findUser(email);
        return repository.findByAccommodationResourceOwnerIdOrderByCreatedAtDesc(partner.getId());
    }

    @Transactional
    public Booking decideHotelPartnerBooking(String email, String id, String decision) {
        AppUser partner = findUser(email);
        Booking booking = findById(id);
        if (booking.getAccommodationResource() == null || booking.getAccommodationResource().getOwner() == null
                || !partner.getId().equals(booking.getAccommodationResource().getOwner().getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found");
        }
        if (booking.getAccommodationProviderStatus() != null && !"Pending".equalsIgnoreCase(booking.getAccommodationProviderStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending bookings can be decided");
        }
        if ("CONFIRM".equalsIgnoreCase(decision)) {
            booking.setAccommodationProviderStatus("Confirmed");
        } else if ("REJECT".equalsIgnoreCase(decision)) {
            booking.setAccommodationProviderStatus("Rejected");
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Decision must be CONFIRM or REJECT");
        }
        updateOverallProviderDecision(booking);
        Booking saved = repository.save(booking);
        notificationService.notifyBookingUser(saved, "Accommodation booking updated",
                "Booking " + saved.getId() + " is now " + saved.getStatus() + ".", "BOOKING_STATUS");
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Booking> findTransportProviderBookings(String email) {
        return repository.findByVehicleResourceOwnerIdOrderByCreatedAtDesc(findUser(email).getId());
    }

    @Transactional
    public Booking decideTransportProviderBooking(String email, String id, String decision) {
        AppUser provider = findUser(email);
        Booking booking = findById(id);
        if (booking.getVehicleResource() == null || booking.getVehicleResource().getOwner() == null
                || !provider.getId().equals(booking.getVehicleResource().getOwner().getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found");
        }
        if (booking.getVehicleProviderStatus() != null && !"Pending".equalsIgnoreCase(booking.getVehicleProviderStatus())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only pending bookings can be decided");
        if ("CONFIRM".equalsIgnoreCase(decision)) booking.setVehicleProviderStatus("Confirmed");
        else if ("REJECT".equalsIgnoreCase(decision)) booking.setVehicleProviderStatus("Rejected");
        else throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Decision must be CONFIRM or REJECT");
        updateOverallProviderDecision(booking);
        Booking saved = repository.save(booking);
        notificationService.notifyBookingUser(saved, "Vehicle booking updated", "Booking " + saved.getId() + " is now " + saved.getStatus() + ".", "BOOKING_STATUS");
        return saved;
    }

    @Transactional(readOnly = true)
    public Booking findTouristBooking(String email, String id) {
        AppUser tourist = findUser(email);
        Booking booking = findById(id);
        if (booking.getTourist() == null || !booking.getTourist().getId().equals(tourist.getId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Booking not found");
        }
        return booking;
    }

    @Transactional
    public Booking cancelTouristBooking(String email, String id) {
        Booking booking = findTouristBooking(email, id);
        return cancelBookingRecord(booking, "Cancelled by tourist on " + LocalDate.now());
    }

    @Transactional
    public Booking cancelBooking(String id) {
        Booking booking = findById(id);
        return cancelBookingRecord(booking, "Cancelled on " + LocalDate.now());
    }

    private Booking cancelBookingRecord(Booking booking, String note) {
        if (!"Pending".equals(booking.getStatus()) && !"Confirmed".equals(booking.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This booking cannot be cancelled");
        }
        if ("Paid".equalsIgnoreCase(booking.getPayment())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Paid bookings cannot be cancelled without a refund process");
        }
        booking.setStatus("Cancelled");
        booking.setNotes(appendNote(booking.getNotes(), note));
        Booking saved = repository.save(booking);
        notificationService.notifyBookingUser(saved, "Booking cancelled",
                "Your booking " + saved.getId() + " has been cancelled.", "BOOKING_CANCELLED");
        notificationService.notifyAssignedGuide(saved, "Trip cancelled",
                "Assigned booking " + saved.getId() + " has been cancelled.", "BOOKING_CANCELLED");
        notificationService.notifyAdmins("Booking cancelled",
                saved.getId() + " for " + saved.getGuest() + " was cancelled.", "BOOKING_CANCELLED", saved.getId());
        return saved;
    }

    @Transactional
    public Booking createTouristBooking(String email, TouristBookingRequest request) {
        AppUser tourist = findUser(email);
        Booking booking = toBooking(request);
        booking.setTourist(tourist);
        booking.setGuest(tourist.getFullName());
        booking.setEmail(tourist.getEmail());
        booking.setStatus("Pending");
        booking.setPayment("Pending");
        Booking saved = createCustomerBooking(booking);
        notifyBookingCreated(saved);
        return saved;
    }

    @Transactional
    public Booking createTouristBooking(TouristBookingRequest request) {
        Booking booking = toBooking(request);
        booking.setGuest("Voyara Tourist");
        booking.setStatus("Pending");
        booking.setPayment("Pending");
        Booking saved = createCustomerBooking(booking);
        notifyBookingCreated(saved);
        return saved;
    }

    public Booking findById(String id) {
        return repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Booking", id));
    }

    @Transactional
    public Booking saveExisting(Booking booking) {
        return repository.save(booking);
    }

    public Booking create(Booking booking) {
        Booking saved = saveNewBooking(booking, false);
        notifyBookingCreated(saved);
        return saved;
    }

    private Booking createCustomerBooking(Booking booking) {
        return saveNewBooking(booking, true);
    }

    private Booking toBooking(TouristBookingRequest request) {
        Booking booking = new Booking();
        booking.setBookingType(request.bookingType());
        booking.setPackageId(request.packageId());
        booking.setLanguagePreference(request.languagePreference());
        booking.setDestination(request.destination());
        booking.setGuideSelectionType(request.guideSelectionType());
        booking.setGuideId(request.guideId());
        booking.setAccommodationSelectionType(request.accommodationSelectionType());
        booking.setAccommodationId(request.accommodationId());
        booking.setRoomType(request.roomType());
        booking.setVehicleSelectionType(request.vehicleSelectionType());
        booking.setVehicleId(request.vehicleId());
        booking.setPickupLocation(request.pickupLocation());
        booking.setPickupTime(request.pickupTime());
        booking.setReturnLocation(request.returnLocation());
        booking.setReturnTime(request.returnTime());
        booking.setDriverRequired(request.driverRequired());
        booking.setLuggageCount(request.luggageCount());
        booking.setCheckIn(request.checkIn());
        booking.setCheckOut(request.checkOut());
        booking.setGuests(request.guests() == null ? 1 : request.guests());
        booking.setRooms(request.rooms());
        booking.setNotes(request.notes());
        return booking;
    }

    private Booking saveNewBooking(Booking booking, boolean strictCustomerBooking) {
        if (booking.getId() == null || booking.getId().isBlank()) {
            booking.setId("BK-" + System.currentTimeMillis());
        }
        if (booking.getBookingType() == null || booking.getBookingType().isBlank()) {
            booking.setBookingType("PACKAGE");
        }
        if (booking.getCreatedAt() == null) {
            booking.setCreatedAt(LocalDate.now());
        }
        validateAndPriceBooking(booking, null, strictCustomerBooking);
        initializeProviderDecisions(booking);
        assignTouristByEmailIfPossible(booking);
        return repository.save(booking);
    }

    private void initializeProviderDecisions(Booking booking) {
        if (booking.getAccommodationResource() != null && booking.getAccommodationResource().getOwner() != null
                && booking.getAccommodationProviderStatus() == null) booking.setAccommodationProviderStatus("Pending");
        if (booking.getVehicleResource() != null && booking.getVehicleResource().getOwner() != null
                && booking.getVehicleProviderStatus() == null) booking.setVehicleProviderStatus("Pending");
    }

    private void updateOverallProviderDecision(Booking booking) {
        if ("Rejected".equalsIgnoreCase(booking.getAccommodationProviderStatus())
                || "Rejected".equalsIgnoreCase(booking.getVehicleProviderStatus())) {
            booking.setStatus("Cancelled");
            return;
        }
        boolean waitingForAccommodation = "Pending".equalsIgnoreCase(booking.getAccommodationProviderStatus());
        boolean waitingForVehicle = "Pending".equalsIgnoreCase(booking.getVehicleProviderStatus());
        booking.setStatus(waitingForAccommodation || waitingForVehicle ? "Pending" : "Confirmed");
    }

    public Booking update(String id, Booking booking) {
        Booking existing = findById(id);
        String previousStatus = existing.getStatus();
        String previousPayment = existing.getPayment();
        booking.setId(id);
        if (booking.getBookingType() == null || booking.getBookingType().isBlank()) {
            booking.setBookingType(existing.getBookingType() == null || existing.getBookingType().isBlank() ? "PACKAGE" : existing.getBookingType());
        }
        if (booking.getTourist() == null) {
            booking.setTourist(existing.getTourist());
        }
        validateAndPriceBooking(booking, id, false);
        assignTouristByEmailIfPossible(booking);
        Booking saved = repository.save(booking);
        reviewRatingService.reconcileAllResources();
        if (!Objects.equals(previousStatus, saved.getStatus())) {
            notificationService.notifyBookingUser(saved, "Booking status updated",
                    "Booking " + saved.getId() + " is now " + saved.getStatus() + ".", "BOOKING_STATUS");
            notificationService.notifyAssignedGuide(saved, "Trip status updated",
                    "Assigned booking " + saved.getId() + " is now " + saved.getStatus() + ".", "BOOKING_STATUS");
            notificationService.notifyAdmins("Booking status updated",
                    saved.getId() + " is now " + saved.getStatus() + ".", "BOOKING_STATUS", saved.getId());
        }
        if (!Objects.equals(previousPayment, saved.getPayment())) {
            notificationService.notifyBookingUser(saved, "Payment status updated",
                    "Payment for booking " + saved.getId() + " is now " + saved.getPayment() + ".", "PAYMENT_STATUS");
        }
        return saved;
    }

    @Transactional
    public void delete(String id) {
        Booking booking = findById(id);
        paymentRepository.findByBookingId(id).ifPresent(paymentRepository::delete);
        reviewRepository.deleteByBookingId(id);
        repository.delete(booking);
        reviewRatingService.reconcileAllResources();
    }

    @Transactional
    public void backfillTouristOwnershipFor(AppUser user) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }
        List<Booking> bookings = repository.findByTouristIsNullAndEmailIgnoreCase(user.getEmail());
        bookings.forEach(booking -> booking.setTourist(user));
        repository.saveAll(bookings);
    }

    private AppUser findUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    private void assignTouristByEmailIfPossible(Booking booking) {
        if (booking.getTourist() != null || booking.getEmail() == null || booking.getEmail().isBlank()) {
            return;
        }
        userRepository.findByEmailIgnoreCase(booking.getEmail()).ifPresent(booking::setTourist);
    }

    private String appendNote(String existing, String note) {
        if (existing == null || existing.isBlank()) {
            return note;
        }
        return existing + "\n" + note;
    }

    private void notifyBookingCreated(Booking booking) {
        notificationService.notifyBookingUser(booking, "Booking submitted",
                "Your booking " + booking.getId() + " was received and is pending confirmation.", "BOOKING_CREATED");
        notificationService.notifyAssignedGuide(booking, "New trip assignment",
                "You were assigned to booking " + booking.getId() + ".", "BOOKING_CREATED");
        notificationService.notifyAdmins("New booking received",
                booking.getId() + " was created for " + booking.getGuest() + ".", "BOOKING_CREATED", booking.getId());
    }

    private void validateAndPriceBooking(Booking candidate, String updatingId, boolean strictCustomerBooking) {
        normalizeBooking(candidate);
        if (candidate.getCheckIn() == null || candidate.getCheckOut() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Check-in and check-out dates are required");
        }
        if (strictCustomerBooking && candidate.getCheckIn().isBefore(LocalDate.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Check-in date cannot be in the past");
        }
        if (!candidate.getCheckOut().isAfter(candidate.getCheckIn())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Check-out date must be after check-in date");
        }
        validateBookingType(candidate.getBookingType());
        if ("Cancelled".equalsIgnoreCase(candidate.getStatus())) {
            return;
        }

        int days = bookingDays(candidate);
        BigDecimal total = BigDecimal.ZERO;
        boolean pricedFromResources = false;

        TourPackage tourPackage = selectedPackage(candidate);
        if (tourPackage != null) {
            validateActive("Package", tourPackage.getStatus(), "Active");
            if (tourPackage.getMaxGroup() > 0 && candidate.getGuests() > tourPackage.getMaxGroup()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Guest count exceeds the selected package maximum group size");
            }
            candidate.setPkg(tourPackage.getName());
            if (candidate.getDestination() == null || candidate.getDestination().isBlank()) {
                candidate.setDestination(String.join(", ", tourPackage.getDestinations()));
            }
            total = total.add(nonNull(tourPackage.getPrice()).multiply(BigDecimal.valueOf(candidate.getGuests())));
            pricedFromResources = true;
        } else if (strictCustomerBooking && "PACKAGE".equalsIgnoreCase(candidate.getBookingType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A package booking requires a valid package");
        }
        if (strictCustomerBooking && "CUSTOM".equalsIgnoreCase(candidate.getBookingType())) {
            requireText(candidate.getDestination(), "Destination is required");
        }

        TourGuide guide = selectedGuide(candidate);
        if (guide != null) {
            validateActive("Tour guide", guide.getStatus(), "Available");
            candidate.setGuide(label(guide.getName(), guide.getLocation()));
            total = total.add(nonNull(guide.getPricePerDay()).multiply(BigDecimal.valueOf(days)));
            pricedFromResources = true;
        }

        Accommodation accommodation = selectedAccommodation(candidate);
        if (accommodation != null) {
            validateActive("Accommodation", accommodation.getStatus(), "Active");
            if (strictCustomerBooking && "ACCOMMODATION".equalsIgnoreCase(candidate.getBookingType())) {
                requireText(candidate.getRoomType(), "Room type is required");
            }
            int requestedRooms = bookingRooms(candidate);
            if (requestedRooms > accommodation.getRooms()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requested rooms exceed available rooms at this accommodation");
            }
            int bookedRooms = bookedAccommodationRooms(candidate, updatingId);
            if (bookedRooms + requestedRooms > accommodation.getRooms()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "The selected accommodation does not have enough rooms for these dates");
            }
            candidate.setAccommodation(accommodation.getName());
            total = total.add(nonNull(accommodation.getPrice()).multiply(BigDecimal.valueOf(days)).multiply(BigDecimal.valueOf(requestedRooms)));
            pricedFromResources = true;
        } else if (strictCustomerBooking && "ACCOMMODATION".equalsIgnoreCase(candidate.getBookingType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "An accommodation booking requires a valid accommodation");
        }

        Vehicle vehicle = selectedVehicle(candidate);
        if (vehicle != null) {
            validateActive("Vehicle", vehicle.getStatus(), "Available");
            if (candidate.getGuests() > vehicle.getCapacity()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passenger count exceeds the selected vehicle capacity");
            }
            candidate.setVehicle(label(vehicle.getName(), vehicle.getBrand(), vehicle.getModel()));
            if ("VEHICLE".equalsIgnoreCase(candidate.getBookingType())) {
                candidate.setDestination(candidate.getPickupLocation());
            }
            total = total.add(nonNull(vehicle.getPricePerDay()).multiply(BigDecimal.valueOf(days)));
            pricedFromResources = true;
        } else if (strictCustomerBooking && "VEHICLE".equalsIgnoreCase(candidate.getBookingType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A vehicle booking requires a valid vehicle");
        }
        if (strictCustomerBooking && vehicle != null && (candidate.getPickupLocation() == null || candidate.getPickupLocation().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup location is required");
        }
        if (strictCustomerBooking && vehicle != null) {
            requireText(candidate.getPickupTime(), "Pickup time is required");
            requireText(candidate.getReturnLocation(), "Return location is required");
            requireText(candidate.getReturnTime(), "Return time is required");
        }

        if (strictCustomerBooking && "VEHICLE".equalsIgnoreCase(candidate.getBookingType()) && (candidate.getPickupLocation() == null || candidate.getPickupLocation().isBlank())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Pickup location is required");
        }
        if (strictCustomerBooking && "VEHICLE".equalsIgnoreCase(candidate.getBookingType())) {
            requireText(candidate.getPickupTime(), "Pickup time is required");
            requireText(candidate.getReturnLocation(), "Return location is required");
            requireText(candidate.getReturnTime(), "Return time is required");
        }

        List<Booking> existingBookings = repository.findAll();
        boolean conflict = existingBookings.stream()
                .filter(existing -> !Objects.equals(existing.getId(), updatingId))
                .filter(existing -> !"Cancelled".equalsIgnoreCase(existing.getStatus()))
                .filter(existing -> existing.getCheckIn() != null && existing.getCheckOut() != null)
                .filter(existing -> candidate.getCheckIn().isBefore(existing.getCheckOut())
                        && candidate.getCheckOut().isAfter(existing.getCheckIn()))
                .anyMatch(existing -> sameResource(
                                candidate.getGuideSelectionType(), candidate.getGuideId(), candidate.getGuide(),
                                existing.getGuideSelectionType(), existing.getGuideId(), existing.getGuide())
                        || sameResource(
                                candidate.getVehicleSelectionType(), candidate.getVehicleId(), candidate.getVehicle(),
                                existing.getVehicleSelectionType(), existing.getVehicleId(), existing.getVehicle()));

        if (conflict) {
            String message = "VEHICLE".equalsIgnoreCase(candidate.getBookingType())
                    ? "The selected vehicle is unavailable for these dates"
                    : "One of the selected guide or vehicle is unavailable for these dates";
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    message);
        }

        if (strictCustomerBooking || pricedFromResources) {
            candidate.setTotal(total);
        }
    }

    private void normalizeBooking(Booking booking) {
        if (booking.getGuests() < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Guest count must be at least 1");
        }
        if (booking.getRooms() == null || booking.getRooms() < 1) {
            booking.setRooms(1);
        }
        if (booking.getBookingType() != null) {
            booking.setBookingType(booking.getBookingType().trim().toUpperCase());
        }
        if (booking.getStatus() == null || booking.getStatus().isBlank()) {
            booking.setStatus("Pending");
        }
        if (booking.getPayment() == null || booking.getPayment().isBlank()) {
            booking.setPayment("Pending");
        }
        if ("VEHICLE".equalsIgnoreCase(booking.getBookingType()) && (booking.getPickupLocation() == null || booking.getPickupLocation().isBlank())) {
            booking.setPickupLocation(booking.getDestination());
        }
        if (booking.getReturnLocation() == null || booking.getReturnLocation().isBlank()) {
            booking.setReturnLocation(booking.getPickupLocation());
        }
        if (booking.getDriverRequired() == null) {
            booking.setDriverRequired(true);
        }
        if (booking.getLuggageCount() == null) {
            booking.setLuggageCount(0);
        }
        if (booking.getLuggageCount() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Luggage count cannot be negative");
        }
    }

    private TourPackage selectedPackage(Booking booking) {
        if (booking.getPackageId() == null) {
            return null;
        }
        TourPackage tourPackage = packageRepository.findById(booking.getPackageId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected package was not found"));
        booking.setTourPackage(tourPackage);
        return tourPackage;
    }

    private TourGuide selectedGuide(Booking booking) {
        if ("OWN".equalsIgnoreCase(booking.getGuideSelectionType()) || booking.getGuideId() == null) {
            return null;
        }
        TourGuide guide = guideRepository.findById(booking.getGuideId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected guide was not found"));
        booking.setTourGuide(guide);
        return guide;
    }

    private Accommodation selectedAccommodation(Booking booking) {
        if ("OWN".equalsIgnoreCase(booking.getAccommodationSelectionType()) || booking.getAccommodationId() == null) {
            return null;
        }
        Accommodation accommodation = accommodationRepository.findById(booking.getAccommodationId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected accommodation was not found"));
        booking.setAccommodationResource(accommodation);
        return accommodation;
    }

    private Vehicle selectedVehicle(Booking booking) {
        if ("OWN".equalsIgnoreCase(booking.getVehicleSelectionType()) || booking.getVehicleId() == null) {
            return null;
        }
        Vehicle vehicle = vehicleRepository.findById(booking.getVehicleId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected vehicle was not found"));
        booking.setVehicleResource(vehicle);
        return vehicle;
    }

    private void validateActive(String label, String actual, String expected) {
        if (!expected.equalsIgnoreCase(actual)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, label + " is not available for booking");
        }
    }

    private void validateBookingType(String bookingType) {
        if (!List.of("PACKAGE", "ACCOMMODATION", "VEHICLE", "CUSTOM").contains(bookingType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported booking type");
        }
    }

    private int bookedAccommodationRooms(Booking candidate, String updatingId) {
        return repository.findAll().stream()
                .filter(existing -> !Objects.equals(existing.getId(), updatingId))
                .filter(existing -> !"Cancelled".equalsIgnoreCase(existing.getStatus()))
                .filter(existing -> Objects.equals(candidate.getAccommodationId(), existing.getAccommodationId()))
                .filter(existing -> existing.getCheckIn() != null && existing.getCheckOut() != null)
                .filter(existing -> candidate.getCheckIn().isBefore(existing.getCheckOut())
                        && candidate.getCheckOut().isAfter(existing.getCheckIn()))
                .mapToInt(this::bookingRooms)
                .sum();
    }

    private int bookingRooms(Booking booking) {
        return booking.getRooms() == null ? 1 : Math.max(1, booking.getRooms());
    }

    private void requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
        }
    }

    private int bookingDays(Booking booking) {
        long days = ChronoUnit.DAYS.between(booking.getCheckIn(), booking.getCheckOut());
        return (int) Math.max(1, days);
    }

    private BigDecimal nonNull(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private String label(String... values) {
        return String.join(" · ", Arrays.stream(values)
                .filter(value -> value != null && !value.isBlank())
                .toList());
    }

    private boolean sameResource(
            String candidateType,
            Long candidateResourceId,
            String candidate,
            String existingType,
            Long existingResourceId,
            String existing
    ) {
        if ("OWN".equalsIgnoreCase(candidateType) || "OWN".equalsIgnoreCase(existingType)) {
            return false;
        }
        // Once either record has a resource ID, compare the canonical IDs only.
        // Falling back to display names here makes legacy bookings with missing
        // IDs collide with a newly selected resource by accident.
        if (candidateResourceId != null || existingResourceId != null) {
            return candidateResourceId != null && existingResourceId != null
                    && candidateResourceId.equals(existingResourceId);
        }
        return candidate != null && !candidate.isBlank() && existing != null
                && !existing.isBlank() && candidate.trim().equalsIgnoreCase(existing.trim());
    }
}
