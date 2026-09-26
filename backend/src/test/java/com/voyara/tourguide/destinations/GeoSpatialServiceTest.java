package com.voyara.tourguide.destinations;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class GeoSpatialServiceTest {
    @Mock DestinationRepository destinationRepository;
    @Mock LocationResolver locationResolver;

    @Test
    void calculatesDistanceUsingHaversineFormula() {
        double distance = GeoSpatialService.distanceKm(0, 0, 0, 1);
        assertEquals(111.195, distance, 0.01);
    }

    @Test
    void returnsNearbyActiveDestinationsSortedByDistance() {
        Destination nearby = destination(1L, "Nearby", "Sri Lanka", "Active");
        Destination farAway = destination(2L, "Far Away", "Sri Lanka", "Active");
        Destination inactive = destination(3L, "Inactive", "Sri Lanka", "Inactive");

        when(destinationRepository.findAll()).thenReturn(List.of(farAway, inactive, nearby));
        when(locationResolver.resolve(farAway)).thenReturn(new GeoCoordinates(1.0, 1.0, "Far Away"));
        when(locationResolver.resolve(nearby)).thenReturn(new GeoCoordinates(0.1, 0.1, "Nearby"));

        GeoSpatialService service = new GeoSpatialService(destinationRepository, locationResolver);

        List<NearbyDestination> results = service.findNearby(0, 0, 100);

        assertEquals(1, results.size());
        assertEquals(1L, results.get(0).destination().getId());
        assertEquals(15.73, results.get(0).distanceKm(), 0.01);
    }

    @Test
    void ignoresDestinationsThatCannotBeGeocoded() {
        Destination unknown = destination(1L, "Unknown", "Sri Lanka", "Active");
        when(destinationRepository.findAll()).thenReturn(List.of(unknown));
        when(locationResolver.resolve(unknown)).thenThrow(
                new ResponseStatusException(HttpStatus.NOT_FOUND, "Location not found"));

        GeoSpatialService service = new GeoSpatialService(destinationRepository, locationResolver);

        assertEquals(List.of(), service.findNearby(0, 0, 100));
    }

    @Test
    void rejectsInvalidSearchCoordinates() {
        GeoSpatialService service = new GeoSpatialService(destinationRepository, locationResolver);

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.findNearby(91, 0, 10));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
    }

    private Destination destination(Long id, String name, String country, String status) {
        Destination destination = new Destination();
        destination.setId(id);
        destination.setName(name);
        destination.setCountry(country);
        destination.setStatus(status);
        return destination;
    }
}
