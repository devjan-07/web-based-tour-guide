package com.voyara.tourguide.accommodations;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.voyara.tourguide.bookings.BookingRepository;
import com.voyara.tourguide.destinations.DestinationRepository;
import com.voyara.tourguide.users.AppUser;
import com.voyara.tourguide.users.AppUserRepository;
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
class AccommodationServiceTest {
    @Mock AccommodationRepository repository;
    @Mock DestinationRepository destinationRepository;
    @Mock BookingRepository bookingRepository;
    @Mock AppUserRepository userRepository;
    AccommodationService service;

    @BeforeEach
    void setUp() {
        service = new AccommodationService(repository, destinationRepository, bookingRepository, userRepository);
    }

    @Test
    void partnerCannotUpdateAnotherPartnersProperty() {
        AppUser actor = user(1L, "a@voyara.com");
        Accommodation existing = validAccommodation();
        existing.setId(10L);
        existing.setOwner(user(2L, "b@voyara.com"));
        when(userRepository.findByEmailIgnoreCase(actor.getEmail())).thenReturn(Optional.of(actor));
        when(destinationRepository.existsById(5L)).thenReturn(true);
        when(repository.findById(10L)).thenReturn(Optional.of(existing));

        ResponseStatusException error = assertThrows(ResponseStatusException.class,
                () -> service.updateOwned(actor.getEmail(), 10L, validAccommodation()));
        assertEquals(403, error.getStatusCode().value());
    }

    @Test
    void publicCatalogRequestsOnlyActiveProperties() {
        Accommodation active = validAccommodation();
        active.setStatus("Active");
        when(repository.findByStatusIgnoreCase("Active")).thenReturn(List.of(active));
        assertEquals(List.of(active), service.findPublic());
        verify(repository).findByStatusIgnoreCase("Active");
    }

    @Test
    void partnerCannotSelfApproveProperty() {
        AppUser owner = user(1L, "partner@voyara.com");
        Accommodation request = validAccommodation();
        request.setStatus("Active");
        when(userRepository.findByEmailIgnoreCase(owner.getEmail())).thenReturn(Optional.of(owner));
        when(destinationRepository.existsById(5L)).thenReturn(true);
        when(repository.save(request)).thenReturn(request);
        assertEquals("Pending Approval", service.saveOwned(owner.getEmail(), request).getStatus());
    }

    @Test
    void invalidDestinationIsRejected() {
        Accommodation request = validAccommodation();
        when(destinationRepository.existsById(5L)).thenReturn(false);
        ResponseStatusException error = assertThrows(ResponseStatusException.class, () -> service.save(request));
        assertEquals(400, error.getStatusCode().value());
        verify(repository, never()).save(request);
    }

    @Test
    void deleteUsesLifecycleStateAndPreservesHistoricalRecord() {
        Accommodation existing = validAccommodation();
        existing.setId(10L);
        when(repository.findById(10L)).thenReturn(Optional.of(existing));
        service.delete(10L);
        assertEquals("Inactive", existing.getStatus());
        verify(repository, never()).delete(existing);
    }

    private Accommodation validAccommodation() {
        Accommodation value = new Accommodation();
        value.setName("Test Hotel");
        value.setType("Hotel");
        value.setDestinationId(5L);
        value.setLocation("Ella");
        value.setCountry("Sri Lanka");
        value.setPrice(new BigDecimal("100.00"));
        value.setRooms(10);
        value.setOccupancy(0);
        value.setImage("https://example.com/hotel.jpg");
        value.setAmenities(List.of());
        return value;
    }

    private AppUser user(Long id, String email) {
        AppUser value = new AppUser();
        value.setId(id);
        value.setEmail(email);
        return value;
    }
}
