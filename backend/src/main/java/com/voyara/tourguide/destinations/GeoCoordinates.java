package com.voyara.tourguide.destinations;

public record GeoCoordinates(
        double latitude,
        double longitude,
        String locationName
) {
}
