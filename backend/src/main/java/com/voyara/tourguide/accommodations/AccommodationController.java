package com.voyara.tourguide.accommodations;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/accommodations")
public class AccommodationController {
    private final AccommodationService service;

    public AccommodationController(AccommodationService service) {
        this.service = service;
    }

    @GetMapping
    public List<AccommodationResponse> all(
            @RequestParam(required = false) Long destinationId,
            @RequestParam(required = false) String destination
    ) {
        if (destinationId != null || (destination != null && !destination.isBlank())) {
            return service.findByDestination(destinationId, destination).stream().map(AccommodationResponse::from).toList();
        }
        return service.findPublic().stream().map(AccommodationResponse::from).toList();
    }

    @GetMapping("/{id}")
    public AccommodationResponse one(@PathVariable Long id) {
        return AccommodationResponse.from(service.findPublicById(id));
    }
}
