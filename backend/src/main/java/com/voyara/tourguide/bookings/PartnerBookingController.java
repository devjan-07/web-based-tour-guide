package com.voyara.tourguide.bookings;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stakeholder/accommodation-bookings")
@PreAuthorize("hasRole('HOTEL_PARTNER')")
public class PartnerBookingController {
    private final BookingService service;

    public PartnerBookingController(BookingService service) { this.service = service; }

    @GetMapping
    public List<Booking> all(Authentication authentication) {
        return service.findHotelPartnerBookings(authentication.getName());
    }

    @PatchMapping("/{id}/decision")
    public Booking decide(Authentication authentication, @PathVariable String id,
                          @Valid @RequestBody DecisionRequest request) {
        return service.decideHotelPartnerBooking(authentication.getName(), id, request.decision());
    }

    public record DecisionRequest(@Pattern(regexp = "CONFIRM|REJECT") String decision) {}
}
