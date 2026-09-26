package com.voyara.tourguide.destinations;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

import com.voyara.tourguide.accommodations.AccommodationRepository;
import com.voyara.tourguide.packages.TourPackageRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DestinationServiceTest {
    @Mock DestinationRepository repository;
    @Mock AccommodationRepository accommodationRepository;
    @Mock TourPackageRepository packageRepository;

    private DestinationService service;

    @BeforeEach
    void setUp() {
        service = new DestinationService(repository, accommodationRepository, packageRepository);
    }

    @Test
    void updatePreservesBestTimeToVisitInformation() {
        Destination existing = destination(1L, "Ella", "Active", List.of("Nature"));
        existing.setBestSeason("December - April");

        Destination request = destination(null, "Ella Highlands", "Active", List.of("Nature", "Hiking"));
        request.setBestSeason("January - March");

        when(repository.findById(1L)).thenReturn(Optional.of(existing));

        Destination updated = service.update(1L, request);

        assertEquals("January - March", updated.getBestSeason());
        assertEquals("Ella Highlands", updated.getName());
        assertEquals(List.of("Nature", "Hiking"), updated.getCategories());
    }

    @Test
    void similarDestinationsUsesActiveTravelStyleMatches() {
        Destination source = destination(1L, "Ella", "Active", List.of("Nature", "Hiking"));
        source.setCountry("Sri Lanka");
        source.setContinent("Asia");

        Destination match = destination(2L, "Nuwara Eliya", "Active", List.of("Nature", "Hiking"));
        match.setCountry("Sri Lanka");
        match.setContinent("Asia");
        match.setRating(4.6);

        Destination inactive = destination(3L, "Hidden Place", "Draft", List.of("Nature", "Hiking"));
        inactive.setCountry("Sri Lanka");
        inactive.setContinent("Asia");

        when(repository.findById(1L)).thenReturn(Optional.of(source));
        when(repository.findAll()).thenReturn(List.of(source, match, inactive));

        List<DestinationRecommendation> recommendations = service.similarDestinations(1L);

        assertEquals(1, recommendations.size());
        assertEquals(2L, recommendations.get(0).destination().getId());
        assertTrue(recommendations.get(0).suitabilityScore() > 0);
        assertTrue(recommendations.get(0).reasons().contains("Multiple travel style matches"));
    }

    private Destination destination(Long id, String name, String status, List<String> categories) {
        Destination value = new Destination();
        value.setId(id);
        value.setName(name);
        value.setStatus(status);
        value.setCategories(categories);
        return value;
    }
}
