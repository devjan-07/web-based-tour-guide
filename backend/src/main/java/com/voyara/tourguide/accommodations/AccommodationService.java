package com.voyara.tourguide.accommodations;

import com.voyara.tourguide.common.ResourceNotFoundException;
import com.voyara.tourguide.bookings.BookingRepository;
import com.voyara.tourguide.destinations.Destination;
import com.voyara.tourguide.destinations.DestinationRepository;
import com.voyara.tourguide.users.AppUser;
import com.voyara.tourguide.users.AppUserRepository;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AccommodationService {
    private final AccommodationRepository repository;
    private final DestinationRepository destinationRepository;
    private final BookingRepository bookingRepository;
    private final AppUserRepository userRepository;

    public AccommodationService(AccommodationRepository repository, DestinationRepository destinationRepository,
                                BookingRepository bookingRepository, AppUserRepository userRepository) {
        this.repository = repository;
        this.destinationRepository = destinationRepository;
        this.bookingRepository = bookingRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Accommodation> findAll() {
        List<Accommodation> accommodations = repository.findAll();
        accommodations.forEach(this::initializeCollections);
        return accommodations;
    }

    @Transactional(readOnly = true)
    public List<Accommodation> findPublic() {
        List<Accommodation> accommodations = repository.findByStatusIgnoreCase("Active");
        accommodations.forEach(this::initializeCollections);
        return accommodations;
    }

    @Transactional(readOnly = true)
    public List<Accommodation> findByDestination(Long destinationId, String destination) {
        List<Accommodation> accommodations;
        if (destinationId != null) {
            accommodations = repository.findByDestinationId(destinationId);
        } else if (destination != null && !destination.isBlank()) {
            accommodations = findByDestinationName(destination);
        } else {
            accommodations = repository.findAll();
        }
        accommodations = accommodations.stream()
                .filter(item -> "Active".equalsIgnoreCase(item.getStatus()))
                .toList();
        accommodations.forEach(this::initializeCollections);
        return accommodations;
    }

    @Transactional(readOnly = true)
    public List<AccommodationRecommendation> recommend(
            Long destinationId,
            String destination,
            Integer travellers,
            Integer maxDailyBudget,
            String accommodationType,
            String preferences
    ) {
        int requestedTravellers = travellers == null ? 1 : Math.max(1, travellers);
        String requestedType = accommodationType == null ? "" : accommodationType.trim().toLowerCase(Locale.ROOT);
        List<String> requestedPreferences = preferences == null ? List.of() :
                java.util.Arrays.stream(preferences.split(","))
                        .map(String::trim)
                        .filter(item -> !item.isBlank())
                        .map(item -> item.toLowerCase(Locale.ROOT))
                        .toList();

        return findByDestination(destinationId, destination).stream()
                .filter(item -> item.getRooms() > 0)
                .map(item -> {
                    int score = 40;
                    List<String> reasons = new ArrayList<>();

                    if (requestedType.isBlank() || item.getType().toLowerCase(Locale.ROOT).contains(requestedType)) {
                        score += 15;
                        if (!requestedType.isBlank()) reasons.add("Stay type match");
                    }

                    if (item.getRooms() >= Math.max(1, (int) Math.ceil(requestedTravellers / 2.0))) {
                        score += 10;
                        reasons.add("Suitable room capacity");
                    }

                    if (maxDailyBudget != null && maxDailyBudget > 0) {
                        if (item.getPrice().doubleValue() <= maxDailyBudget) {
                            score += 15;
                            reasons.add("Within nightly budget");
                        } else {
                            score -= 20;
                            reasons.add("Above nightly budget");
                        }
                    }

                    if (!requestedPreferences.isEmpty()) {
                        long matched = requestedPreferences.stream()
                                .filter(pref -> item.getAmenities() != null && item.getAmenities().stream()
                                        .anyMatch(amenity -> amenity != null && amenity.toLowerCase(Locale.ROOT).contains(pref)))
                                .count();
                        if (matched > 0) {
                            score += (int) Math.min(15, matched * 5);
                            reasons.add(matched == 1 ? "Preference match" : "Multiple preference matches");
                        }
                    }

                    if (item.getRating() >= 4.5) {
                        score += 5;
                        reasons.add("Highly rated");
                    }

                    if (destination != null && !destination.isBlank()
                            && item.getLocation() != null
                            && item.getLocation().toLowerCase(Locale.ROOT).contains(destination.trim().toLowerCase(Locale.ROOT))) {
                        score += 10;
                        reasons.add("Location match");
                    }

                    return new AccommodationRecommendation(AccommodationResponse.from(item), Math.max(0, Math.min(score, 100)), reasons);
                })
                .sorted(Comparator.comparingInt(AccommodationRecommendation::suitabilityScore).reversed()
                        .thenComparing(a -> a.accommodation().rating(), Comparator.reverseOrder())
                        .thenComparing(a -> a.accommodation().price()))
                .limit(6)
                .toList();
    }

    @Transactional(readOnly = true)
    public Accommodation findById(Long id) {
        Accommodation accommodation = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Accommodation", id));
        initializeCollections(accommodation);
        return accommodation;
    }

    @Transactional(readOnly = true)
    public Accommodation findPublicById(Long id) {
        Accommodation accommodation = findById(id);
        if (!"Active".equalsIgnoreCase(accommodation.getStatus())) {
            throw new ResourceNotFoundException("Accommodation", id);
        }
        return accommodation;
    }

    @Transactional(readOnly = true)
    public List<Accommodation> findOwned(String email) {
        AppUser owner = requireUser(email);
        List<Accommodation> accommodations = repository.findByOwnerIdOrderByIdDesc(owner.getId());
        accommodations.forEach(this::initializeCollections);
        return accommodations;
    }

    @Transactional
    public Accommodation saveOwned(String email, Accommodation accommodation) {
        AppUser owner = requireUser(email);
        validateAccommodation(accommodation);
        accommodation.setId(null);
        accommodation.setOwner(owner);
        accommodation.setStatus("Pending Approval");
        accommodation.setRating(0.0);
        accommodation.setReviews(0);
        accommodation.setOccupancy(0);
        Accommodation saved = repository.save(accommodation);
        initializeCollections(saved);
        return saved;
    }

    @Transactional
    public Accommodation updateOwned(String email, Long id, Accommodation accommodation) {
        AppUser owner = requireUser(email);
        validateAccommodation(accommodation);
        Accommodation existing = requireOwned(owner.getId(), id);
        copyEditableFields(existing, accommodation);
        existing.setStatus("Pending Approval");
        initializeCollections(existing);
        return existing;
    }

    @Transactional
    public void deleteOwned(String email, Long id) {
        AppUser owner = requireUser(email);
        Accommodation accommodation = requireOwned(owner.getId(), id);
        accommodation.setStatus("Inactive");
    }

    @Transactional
    public Accommodation save(Accommodation accommodation) {
        validateAccommodation(accommodation);
        accommodation.setRating(0.0);
        accommodation.setReviews(0);
        Accommodation saved = repository.save(accommodation);
        initializeCollections(saved);
        return saved;
    }

    @Transactional
    public Accommodation update(Long id, Accommodation accommodation) {
        validateAccommodation(accommodation);
        Accommodation existing = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Accommodation", id));

        copyEditableFields(existing, accommodation);
        existing.setStatus(accommodation.getStatus());
        existing.setOccupancy(accommodation.getOccupancy());

        initializeCollections(existing);
        return existing;
    }

    @Transactional
    public void delete(Long id) {
        Accommodation accommodation = findById(id);
        accommodation.setStatus("Inactive");
    }

    @Transactional
    public Accommodation reassignOwner(Long id, Long ownerUserId) {
        Accommodation accommodation = findById(id);
        AppUser owner = userRepository.findById(ownerUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hotel partner account not found"));
        boolean hotelPartner = owner.getRoles().stream()
                .anyMatch(role -> "HOTEL_PARTNER".equalsIgnoreCase(role.getRoleName()));
        if (!hotelPartner) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected account is not a hotel partner");
        }
        accommodation.setOwner(owner);
        return accommodation;
    }

    private void initializeCollections(Accommodation accommodation) {
        if (accommodation.getAmenities() != null) {
            accommodation.getAmenities().size();
        }
    }

    private List<Accommodation> findByDestinationName(String destination) {
        String normalized = destination.trim();
        List<Destination> destinations = destinationRepository.findAll().stream()
                .filter(item -> item.getName() != null && item.getName().equalsIgnoreCase(normalized))
                .toList();
        if (!destinations.isEmpty()) {
            List<Long> destinationIds = destinations.stream().map(Destination::getId).toList();
            List<Accommodation> byStructuredDestination = repository.findAll().stream()
                    .filter(item -> item.getDestinationId() != null && destinationIds.contains(item.getDestinationId()))
                    .toList();
            if (!byStructuredDestination.isEmpty()) {
                return byStructuredDestination;
            }
        }
        return repository.findByLocationContainingIgnoreCase(normalized);
    }

    private void validateDestination(Long destinationId) {
        if (destinationId == null || !destinationRepository.existsById(destinationId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a valid destination");
        }
    }

    private void validateAccommodation(Accommodation accommodation) {
        validateDestination(accommodation.getDestinationId());
        if (accommodation.getPrice() == null || accommodation.getPrice().signum() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Price must be greater than zero");
        }
        if (accommodation.getRooms() < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Room count must be at least one");
        }
        if (accommodation.getOccupancy() < 0 || accommodation.getOccupancy() > accommodation.getRooms()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Occupancy must be between zero and the room count");
        }
    }

    private AppUser requireUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    private Accommodation requireOwned(Long ownerUserId, Long accommodationId) {
        Accommodation accommodation = repository.findById(accommodationId)
                .orElseThrow(() -> new ResourceNotFoundException("Accommodation", accommodationId));
        if (accommodation.getOwner() == null || !ownerUserId.equals(accommodation.getOwner().getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only manage your own accommodations");
        }
        return accommodation;
    }

    private void copyEditableFields(Accommodation target, Accommodation source) {
        target.setName(source.getName());
        target.setType(source.getType());
        target.setDestinationId(source.getDestinationId());
        target.setLocation(source.getLocation());
        target.setCountry(source.getCountry());
        target.setPrice(source.getPrice());
        target.setRooms(source.getRooms());
        target.setImage(source.getImage());
        target.getAmenities().clear();
        if (source.getAmenities() != null) {
            target.getAmenities().addAll(new ArrayList<>(source.getAmenities()));
        }
    }
}
