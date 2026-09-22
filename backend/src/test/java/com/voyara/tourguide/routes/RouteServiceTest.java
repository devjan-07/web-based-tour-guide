package com.voyara.tourguide.routes;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.voyara.tourguide.destinations.DestinationRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class RouteServiceTest {
    @Mock RouteRepository repository;
    @Mock DestinationRepository destinationRepository;

    private RouteService service;

    @BeforeEach
    void setUp() {
        service = new RouteService(repository, destinationRepository);
    }

    @Test
    void rejectsRouteForUnknownDestination() {
        Route route = validRoute();
        when(destinationRepository.existsById(99L)).thenReturn(false);

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.save(route));

        assertEquals(400, error.getStatusCode().value());
        verify(repository, never()).save(route);
    }

    @Test
    void normalizesDefaultStatusToActive() {
        Route route = validRoute();
        route.setStatus(null);
        when(destinationRepository.existsById(1L)).thenReturn(true);
        when(repository.save(route)).thenReturn(route);

        Route saved = service.save(route);

        assertEquals("ACTIVE", saved.getStatus());
    }

    @Test
    void rejectsInvalidStatus() {
        Route route = validRoute();
        route.setStatus("PUBLISHED");
        when(destinationRepository.existsById(1L)).thenReturn(true);

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.save(route));

        assertEquals(400, error.getStatusCode().value());
    }

    @Test
    void findsRoutesForDestination() {
        when(destinationRepository.existsById(1L)).thenReturn(true);
        Route route = validRoute();
        when(repository.findByDestinationId(1L)).thenReturn(List.of(route));

        assertEquals(List.of(route), service.findByDestination(1L));
        verify(repository).findByDestinationId(1L);
    }

    @Test
    void updatePreservesIdentity() {
        Route existing = validRoute();
        existing.setId(10L);
        Route request = validRoute();
        request.setRouteName("Updated Route");
        when(repository.findById(10L)).thenReturn(Optional.of(existing));
        when(destinationRepository.existsById(1L)).thenReturn(true);
        when(repository.save(existing)).thenReturn(existing);

        Route saved = service.update(10L, request);

        assertEquals(10L, saved.getId());
        assertEquals("Updated Route", saved.getRouteName());
    }

    private Route validRoute() {
        Route route = new Route();
        route.setDestinationId(1L);
        route.setRouteName("Kandy City Route");
        route.setStartLocation("Kandy Railway Station");
        route.setEndLocation("Temple of the Tooth");
        route.setDistanceKm(4.5);
        route.setEstimatedDuration(20);
        route.setStatus("ACTIVE");
        return route;
    }
}
