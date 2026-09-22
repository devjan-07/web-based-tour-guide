package com.voyara.tourguide.packages;

import com.voyara.tourguide.common.ResourceNotFoundException;
import com.voyara.tourguide.bookings.BookingRepository;
import com.voyara.tourguide.destinations.Destination;
import com.voyara.tourguide.destinations.DestinationRepository;
import com.voyara.tourguide.routes.Route;
import com.voyara.tourguide.routes.RouteRepository;
import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class TourPackageService {
    private final TourPackageRepository repository;
    private final BookingRepository bookingRepository;
    private final DestinationRepository destinationRepository;
    private final RouteRepository routeRepository;

    public TourPackageService(TourPackageRepository repository, BookingRepository bookingRepository,
            DestinationRepository destinationRepository, RouteRepository routeRepository) {
        this.repository = repository;
        this.bookingRepository = bookingRepository;
        this.destinationRepository = destinationRepository;
        this.routeRepository = routeRepository;
    }

    @Transactional(readOnly = true)
    public List<TourPackage> findAll() {
        List<TourPackage> packages = repository.findAll();
        packages.forEach(this::initializeCollections);
        return packages;
    }

    @Transactional(readOnly = true)
    public TourPackage findById(Long id) {
        TourPackage tourPackage = repository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Package", id));
        initializeCollections(tourPackage);
        return tourPackage;
    }

    @Transactional
    public TourPackage save(TourPackage tourPackage) {
        clearUnsupportedRatings(tourPackage);
        TourPackage saved = repository.save(tourPackage);
        initializeCollections(saved);
        return saved;
    }

    @Transactional
    public TourPackage update(Long id, TourPackage tourPackage) {
        TourPackage existing = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Package", id));
        existing.setName(tourPackage.getName());
        existing.setCategory(tourPackage.getCategory());
        existing.setDuration(tourPackage.getDuration());
        existing.setPrice(tourPackage.getPrice());
        existing.setMaxGroup(tourPackage.getMaxGroup());
        existing.setDifficulty(tourPackage.getDifficulty());
        existing.setStatus(tourPackage.getStatus());
        clearUnsupportedRatings(existing);
        existing.setBookings(tourPackage.getBookings());
        existing.setImage(tourPackage.getImage());
        existing.setIncluded(tourPackage.getIncluded());
        existing.setDescription(tourPackage.getDescription());
        existing.getDestinations().clear();
        if (tourPackage.getDestinations() != null) {
            existing.getDestinations().addAll(new ArrayList<>(tourPackage.getDestinations()));
        }
        initializeCollections(existing);
        return existing;
    }

    @Transactional(readOnly = true)
    public List<Route> routesForPackage(Long id) {
        TourPackage tourPackage = findById(id);
        List<String> destinationNames = tourPackage.getDestinations() == null ? List.of() : tourPackage.getDestinations();
        if (destinationNames.isEmpty()) return List.of();
        List<Route> routes = new ArrayList<>();
        for (Destination destination : destinationRepository.findAll()) {
            boolean included = destinationNames.stream().anyMatch(name -> name != null && name.trim().equalsIgnoreCase(destination.getName()));
            if (included) routes.addAll(routeRepository.findByDestinationIdAndStatusIgnoreCase(destination.getId(), "ACTIVE"));
        }
        return routes;
    }

    @Transactional
    public void delete(Long id) {
        TourPackage tourPackage = findById(id);
        if (bookingRepository.existsByTourPackageId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "This package is referenced by existing bookings. Archive it instead.");
        }
        repository.delete(tourPackage);
    }

    private void initializeCollections(TourPackage tourPackage) {
        if (tourPackage.getDestinations() != null) {
            tourPackage.getDestinations().size();
        }
    }

    private void clearUnsupportedRatings(TourPackage tourPackage) {
        tourPackage.setRating(0);
        tourPackage.setReviews(0);
    }
}
