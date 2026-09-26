package com.voyara.tourguide.packages;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.voyara.tourguide.bookings.BookingRepository;
import com.voyara.tourguide.destinations.DestinationRepository;
import com.voyara.tourguide.routes.RouteRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class TourPackageServiceTest {
    @Mock TourPackageRepository repository;
    @Mock BookingRepository bookingRepository;
    @Mock DestinationRepository destinationRepository;
    @Mock RouteRepository routeRepository;

    private TourPackageService service;

    @BeforeEach
    void setUp() {
        service = new TourPackageService(repository, bookingRepository, destinationRepository, routeRepository);
    }

    @Test
    void budgetFilterReturnsOnlyActivePackagesWithinMaximum() {
        TourPackage budget = packageOf(50000, "Active");
        TourPackage expensive = packageOf(90000, "Active");
        TourPackage draft = packageOf(30000, "Draft");
        when(repository.findAll()).thenReturn(List.of(expensive, draft, budget));

        List<TourPackage> result = service.filterByBudget(null, new BigDecimal("60000"));

        assertEquals(List.of(budget), result);
    }

    @Test
    void budgetFilterSupportsMinimumAndMaximum() {
        TourPackage low = packageOf(30000, "Active");
        TourPackage middle = packageOf(60000, "Active");
        TourPackage high = packageOf(90000, "Active");
        when(repository.findAll()).thenReturn(List.of(low, high, middle));

        List<TourPackage> result = service.filterByBudget(new BigDecimal("40000"), new BigDecimal("70000"));

        assertEquals(List.of(middle), result);
    }

    @Test
    void rejectsInvalidBudgetRange() {
        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.filterByBudget(new BigDecimal("70000"), new BigDecimal("40000")));

        assertEquals(400, error.getStatusCode().value());
        verify(repository, never()).findAll();
    }

    @Test
    void budgetResultsAreSortedByPrice() {
        TourPackage high = packageOf(90000, "Active");
        TourPackage low = packageOf(30000, "Active");
        when(repository.findAll()).thenReturn(List.of(high, low));

        assertEquals(List.of(low, high), service.filterByBudget(null, null));
    }

    private TourPackage packageOf(int price, String status) {
        TourPackage value = new TourPackage();
        value.setId((long) price);
        value.setName("Package " + price);
        value.setPrice(new BigDecimal(price));
        value.setStatus(status);
        value.setDestinations(List.of("Kandy"));
        return value;
    }
}
