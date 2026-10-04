package com.voyara.tourguide.bookings;

import com.voyara.tourguide.vehiclerental.Vehicle;
import com.voyara.tourguide.vehiclerental.VehicleRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class VehicleBookingStrategyTest {

    @Test
    void applyPricesVehicleBookingAndPreparesSelectedVehicle() {
        VehicleRepository vehicleRepository = mock(VehicleRepository.class);
        Vehicle vehicle = vehicle(1L, 4, new BigDecimal("100.00"));

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));

        Booking booking = validVehicleBooking(1L, 2);

        VehicleBookingStrategy strategy = new VehicleBookingStrategy(vehicleRepository);

        BigDecimal total = strategy.apply(booking, null, true);

        assertEquals(new BigDecimal("200.00"), total);
        assertEquals(vehicle, booking.getVehicleResource());
        assertEquals("Premium Sedan · Toyota · Corolla", booking.getVehicle());
        assertEquals("Colombo", booking.getDestination());
    }

    @Test
    void applyRejectsVehicleWhenGuestCountExceedsCapacity() {
        VehicleRepository vehicleRepository = mock(VehicleRepository.class);
        Vehicle vehicle = vehicle(1L, 2, new BigDecimal("100.00"));

        when(vehicleRepository.findById(1L)).thenReturn(Optional.of(vehicle));

        Booking booking = validVehicleBooking(1L, 3);

        VehicleBookingStrategy strategy = new VehicleBookingStrategy(vehicleRepository);

        assertThrows(ResponseStatusException.class,
                () -> strategy.apply(booking, null, true));
    }

    private Booking validVehicleBooking(Long vehicleId, int guests) {
        Booking booking = new Booking();
        booking.setBookingType("VEHICLE");
        booking.setVehicleId(vehicleId);
        booking.setGuests(guests);
        booking.setCheckIn(LocalDate.of(2026, 10, 10));
        booking.setCheckOut(LocalDate.of(2026, 10, 12));
        booking.setPickupLocation("Colombo");
        booking.setPickupTime("09:00");
        booking.setReturnLocation("Colombo");
        booking.setReturnTime("18:00");
        return booking;
    }

    private Vehicle vehicle(Long id, int capacity, BigDecimal pricePerDay) {
        Vehicle vehicle = new Vehicle();
        vehicle.setId(id);
        vehicle.setName("Premium Sedan");
        vehicle.setBrand("Toyota");
        vehicle.setModel("Corolla");
        vehicle.setCapacity(capacity);
        vehicle.setPricePerDay(pricePerDay);
        vehicle.setStatus("Available");
        return vehicle;
    }
}
