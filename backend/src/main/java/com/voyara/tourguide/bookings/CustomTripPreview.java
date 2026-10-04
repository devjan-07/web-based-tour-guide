package com.voyara.tourguide.bookings;

import java.math.BigDecimal;

public record CustomTripPreview(
        String bookingType,
        String destination,
        Long guideId,
        String guide,
        BigDecimal guidePricePerDay,
        Long accommodationId,
        String accommodation,
        BigDecimal accommodationPricePerNight,
        Long vehicleId,
        String vehicle,
        BigDecimal vehiclePricePerDay,
        int guests,
        int rooms,
        String checkIn,
        String checkOut,
        BigDecimal total
) {
}
