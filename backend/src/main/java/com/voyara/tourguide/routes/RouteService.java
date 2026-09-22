package com.voyara.tourguide.routes;

import com.voyara.tourguide.common.ResourceNotFoundException;
import com.voyara.tourguide.destinations.DestinationRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RouteService {
    private final RouteRepository repository;
    private final DestinationRepository destinationRepository;

    public RouteService(RouteRepository repository, DestinationRepository destinationRepository) {
        this.repository = repository;
        this.destinationRepository = destinationRepository;
    }

    public List<Route> findAll() {
        return repository.findAll();
    }

    public List<Route> findActive() {
        return repository.findByStatusIgnoreCase("ACTIVE");
    }

    public Route findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Route", id));
    }

    public List<Route> findByDestination(Long destinationId) {
        if (!destinationRepository.existsById(destinationId)) {
            throw new ResourceNotFoundException("Destination", destinationId);
        }
        return repository.findByDestinationId(destinationId);
    }

    public Route save(Route route) {
        validate(route);
        route.setStatus(normalizeStatus(route.getStatus()));
        return repository.save(route);
    }

    public Route update(Long id, Route request) {
        Route existing = findById(id);
        validate(request);
        existing.setDestinationId(request.getDestinationId());
        existing.setRouteName(request.getRouteName());
        existing.setStartLocation(request.getStartLocation());
        existing.setEndLocation(request.getEndLocation());
        existing.setDistanceKm(request.getDistanceKm());
        existing.setEstimatedDuration(request.getEstimatedDuration());
        existing.setDescription(request.getDescription());
        existing.setStatus(normalizeStatus(request.getStatus()));
        return repository.save(existing);
    }

    public void delete(Long id) {
        Route route = findById(id);
        repository.delete(route);
    }

    private void validate(Route route) {
        if (route.getDestinationId() == null || !destinationRepository.existsById(route.getDestinationId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A valid destination is required for the route.");
        }
        if (route.getDistanceKm() != null && route.getDistanceKm() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Distance must be greater than zero.");
        }
        if (route.getEstimatedDuration() != null && route.getEstimatedDuration() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Estimated duration must be greater than zero.");
        }
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) return "ACTIVE";
        String normalized = status.trim().toUpperCase();
        if (!normalized.equals("ACTIVE") && !normalized.equals("INACTIVE")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Route status must be ACTIVE or INACTIVE.");
        }
        return normalized;
    }
}
