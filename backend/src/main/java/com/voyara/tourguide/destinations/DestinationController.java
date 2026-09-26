package com.voyara.tourguide.destinations;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/destinations")
public class DestinationController {
    private final DestinationService service;
    private final WeatherService weatherService;
    private final GeoSpatialService geoSpatialService;

    public DestinationController(DestinationService service, WeatherService weatherService,
                                 GeoSpatialService geoSpatialService) {
        this.service = service;
        this.weatherService = weatherService;
        this.geoSpatialService = geoSpatialService;
    }

    @GetMapping
    public List<Destination> all() {
        return service.findAll();
    }

    @GetMapping("/nearby")
    public List<NearbyDestination> nearby(
            @RequestParam double latitude,
            @RequestParam double longitude,
            @RequestParam double radiusKm) {
        return geoSpatialService.findNearby(latitude, longitude, radiusKm);
    }

    @GetMapping("/{id}/similar")
    public List<DestinationRecommendation> similar(@PathVariable Long id) {
        return service.similarDestinations(id);
    }

    @GetMapping("/{id}/weather")
    public WeatherForecast weather(@PathVariable Long id) {
        return weatherService.forecastForDestination(id);
    }

    @GetMapping("/{id}")
    public Destination one(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Destination create(@Valid @RequestBody Destination destination) {
        return service.save(destination);
    }

    @PutMapping("/{id}")
    public Destination update(@PathVariable Long id, @Valid @RequestBody Destination destination) {
        return service.update(id, destination);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
