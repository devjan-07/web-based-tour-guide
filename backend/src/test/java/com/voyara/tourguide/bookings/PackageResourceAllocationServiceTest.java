package com.voyara.tourguide.bookings;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.voyara.tourguide.accommodations.Accommodation;
import com.voyara.tourguide.packages.TourPackage;
import com.voyara.tourguide.tourguides.TourGuide;
import com.voyara.tourguide.vehiclerental.Vehicle;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class PackageResourceAllocationServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    private PackageResourceAllocationService service;

    @BeforeEach
    void setUp() {
        service = new PackageResourceAllocationService(bookingRepository);
        when(bookingRepository.findAll()).thenReturn(List.of());
    }

    @Test
    void allocatesAvailableIncludedResources() {
        TourPackage tourPackage = packageWithAllIncludedServices();
        Booking booking = booking("English", 3, 1);

        TourGuide guide = guide(10L, "Nethmi Fernando", "Ella");
        Accommodation accommodation = accommodation(20L, "Ella Tea Valley Villa", "Ella", 12);
        Vehicle vehicle = vehicle(30L, "Mitsubishi Montero SUV", 6, "Ella");

        tourPackage.setEligibleGuides(List.of(guide));
        tourPackage.setEligibleAccommodations(List.of(accommodation));
        tourPackage.setEligibleVehicles(List.of(vehicle));

        service.allocate(tourPackage, booking, null);

        assertEquals(10L, booking.getGuideId());
        assertEquals(20L, booking.getAccommodationId());
        assertEquals(30L, booking.getVehicleId());
        assertEquals("VOYARA", booking.getGuideSelectionType());
        assertEquals("VOYARA", booking.getAccommodationSelectionType());
        assertEquals("VOYARA", booking.getVehicleSelectionType());
    }

    @Test
    void skipsBookedGuideAndUsesAnotherEligibleGuide() {
        TourPackage tourPackage = packageWithAllIncludedServices();
        Booking booking = booking("English", 2, 1);

        TourGuide bookedGuide = guide(10L, "Nethmi Fernando", "Ella");
        TourGuide availableGuide = guide(11L, "Sanjaya Bandara", "Nuwara Eliya");
        Accommodation accommodation = accommodation(20L, "Ella Tea Valley Villa", "Ella", 12);
        Vehicle vehicle = vehicle(30L, "Honda Vezel SUV", 5, "Nuwara Eliya");

        Booking existing = booking("English", 2, 1);
        existing.setId("EXISTING");
        existing.setGuideId(10L);
        existing.setCheckIn(LocalDate.of(2026, 10, 10));
        existing.setCheckOut(LocalDate.of(2026, 10, 14));
        existing.setStatus("Pending");

        when(bookingRepository.findAll()).thenReturn(List.of(existing));

        tourPackage.setEligibleGuides(List.of(bookedGuide, availableGuide));
        tourPackage.setEligibleAccommodations(List.of(accommodation));
        tourPackage.setEligibleVehicles(List.of(vehicle));

        service.allocate(tourPackage, booking, null);

        assertEquals(11L, booking.getGuideId());
    }

    @Test
    void rejectsWhenNoEligibleVehicleCanCarryTheGroup() {
        TourPackage tourPackage = packageWithAllIncludedServices();
        Booking booking = booking("English", 8, 1);

        tourPackage.setEligibleGuides(List.of(guide(10L, "Nethmi Fernando", "Ella")));
        tourPackage.setEligibleAccommodations(List.of(accommodation(20L, "Ella Tea Valley Villa", "Ella", 12)));
        tourPackage.setEligibleVehicles(List.of(vehicle(30L, "Toyota Axio Sedan", 4, "Colombo")));

        assertThrows(ResponseStatusException.class,
                () -> service.allocate(tourPackage, booking, null));
    }

    private TourPackage packageWithAllIncludedServices() {
        TourPackage tourPackage = new TourPackage();
        tourPackage.setId(1L);
        tourPackage.setName("Ella Highlands Escape");
        tourPackage.setCategory("Nature");
        tourPackage.setDestinations(List.of("Ella Highlands", "Nuwara Eliya"));
        tourPackage.setIncluded("Guide, accommodation, breakfast, private transport");
        return tourPackage;
    }

    private Booking booking(String language, int guests, int rooms) {
        Booking booking = new Booking();
        booking.setId("TEST");
        booking.setBookingType("PACKAGE");
        booking.setLanguagePreference(language);
        booking.setGuests(guests);
        booking.setRooms(rooms);
        booking.setCheckIn(LocalDate.of(2026, 10, 10));
        booking.setCheckOut(LocalDate.of(2026, 10, 14));
        booking.setStatus("Pending");
        booking.setPayment("Pending");
        return booking;
    }

    private TourGuide guide(Long id, String name, String location) {
        TourGuide guide = new TourGuide();
        guide.setId(id);
        guide.setName(name);
        guide.setLocation(location);
        guide.setStatus("Available");
        guide.setLanguages(List.of("English"));
        guide.setSpecialties(List.of("Nature", "Hiking"));
        guide.setRating(4.7);
        guide.setExperience(7);
        guide.setPricePerDay(BigDecimal.valueOf(18000));
        return guide;
    }

    private Accommodation accommodation(Long id, String name, String location, int rooms) {
        Accommodation accommodation = new Accommodation();
        accommodation.setId(id);
        accommodation.setName(name);
        accommodation.setLocation(location);
        accommodation.setRooms(rooms);
        accommodation.setStatus("Active");
        accommodation.setRating(4.6);
        accommodation.setPrice(BigDecimal.valueOf(36000));
        return accommodation;
    }

    private Vehicle vehicle(Long id, String name, int capacity, String location) {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(id);
        vehicle.setName(name);
        vehicle.setCapacity(capacity);
        vehicle.setLocation(location);
        vehicle.setStatus("Available");
        vehicle.setRating(4.5);
        vehicle.setPricePerDay(BigDecimal.valueOf(25000));
        vehicle.setPlate("TEST-" + id);
        return vehicle;
    }
}
