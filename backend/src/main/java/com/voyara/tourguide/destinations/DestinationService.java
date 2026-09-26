package com.voyara.tourguide.destinations;

import com.voyara.tourguide.common.ResourceNotFoundException;
import com.voyara.tourguide.accommodations.AccommodationRepository;
import com.voyara.tourguide.packages.TourPackageRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DestinationService {
    private final DestinationRepository repository;
    private final AccommodationRepository accommodationRepository;
    private final TourPackageRepository packageRepository;

    public DestinationService(DestinationRepository repository, AccommodationRepository accommodationRepository,
                              TourPackageRepository packageRepository) {
        this.repository = repository;
        this.accommodationRepository = accommodationRepository;
        this.packageRepository = packageRepository;
    }

    @Transactional(readOnly = true)
    public List<Destination> findAll() {
        List<Destination> destinations = repository.findAll();
        destinations.forEach(this::initializeCollections);
        return destinations;
    }

    @Transactional(readOnly = true)
    public Destination findById(Long id) {
        Destination destination = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Destination", id));
        initializeCollections(destination);
        return destination;
    }


    @Transactional(readOnly = true)
    public List<DestinationRecommendation> similarDestinations(Long id) {
        Destination source = findById(id);
        List<String> sourceCategories = source.getCategories() == null ? List.of() : source.getCategories().stream()
                .filter(value -> value != null && !value.isBlank())
                .map(value -> value.trim().toLowerCase())
                .toList();

        return repository.findAll().stream()
                .filter(candidate -> candidate.getId() != null && !candidate.getId().equals(id))
                .filter(candidate -> "Active".equalsIgnoreCase(candidate.getStatus()))
                .map(candidate -> {
                    initializeCollections(candidate);
                    int score = 0;
                    List<String> reasons = new ArrayList<>();
                    List<String> candidateCategories = candidate.getCategories() == null ? List.of() : candidate.getCategories();

                    long categoryMatches = candidateCategories.stream()
                            .filter(value -> value != null)
                            .map(value -> value.trim().toLowerCase())
                            .filter(sourceCategories::contains)
                            .count();

                    if (categoryMatches > 0) {
                        score += (int) Math.min(60, categoryMatches * 25);
                        reasons.add(categoryMatches == 1 ? "Travel style match" : "Multiple travel style matches");
                    }

                    if (source.getCountry() != null && !source.getCountry().isBlank()
                            && source.getCountry().equalsIgnoreCase(candidate.getCountry())) {
                        score += 15;
                        reasons.add("Same country");
                    }

                    if (source.getContinent() != null && !source.getContinent().isBlank()
                            && source.getContinent().equalsIgnoreCase(candidate.getContinent())) {
                        score += 10;
                        reasons.add("Same region");
                    }

                    if (candidate.getRating() >= 4.5) {
                        score += 10;
                        reasons.add("Highly rated");
                    } else if (candidate.getRating() >= 4.0) {
                        score += 5;
                        reasons.add("Well rated");
                    }

                    if (reasons.isEmpty()) {
                        reasons.add("Nearby travel option");
                        score = 20;
                    }

                    return new DestinationRecommendation(candidate, Math.min(score, 100), reasons);
                })
                .sorted(java.util.Comparator.comparingInt(DestinationRecommendation::suitabilityScore).reversed()
                        .thenComparing(d -> d.destination().getRating(), java.util.Comparator.reverseOrder()))
                .limit(6)
                .toList();
    }

    @Transactional
    public Destination save(Destination destination) {
        clearUnsupportedRatings(destination);
        Destination saved = repository.save(destination);
        initializeCollections(saved);
        return saved;
    }

    @Transactional
    public Destination update(Long id, Destination destination) {
        Destination existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Destination", id));
        existing.setName(destination.getName());
        existing.setCountry(destination.getCountry());
        existing.setContinent(destination.getContinent());
        existing.setDescription(destination.getDescription());
        existing.setImage(destination.getImage());
        existing.setStatus(destination.getStatus());
        clearUnsupportedRatings(existing);
        existing.setBestSeason(destination.getBestSeason());
        existing.setHighlights(destination.getHighlights());
        existing.getCategories().clear();
        if (destination.getCategories() != null) {
            existing.getCategories().addAll(new ArrayList<>(destination.getCategories()));
        }
        initializeCollections(existing);
        return existing;
    }

    @Transactional
    public void delete(Long id) {
        Destination destination = findById(id);
        if (accommodationRepository.existsByDestinationId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This destination is used by accommodations. Hide it instead.");
        }
        if (packageRepository.existsByDestinationName(destination.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This destination is used by tour packages. Hide it instead.");
        }
        repository.delete(destination);
    }

    private void initializeCollections(Destination destination) {
        if (destination.getCategories() != null) {
            destination.getCategories().size();
        }
    }

    private void clearUnsupportedRatings(Destination destination) {
        destination.setRating(0);
        destination.setReviews(0);
    }
}
