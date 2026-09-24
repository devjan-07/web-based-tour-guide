package com.voyara.tourguide.bookings;

import java.util.List;

public record TripReadiness(
        String bookingId,
        int completionPercent,
        String status,
        String nextAction,
        List<String> completed,
        List<String> pending
) {}
