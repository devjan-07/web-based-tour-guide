package com.voyara.tourguide.destinations;

public record NearbyDestination(
        Destination destination,
        double distanceKm,
        double latitude,
        double longitude
) {
}
