package com.voyara.tourguide.bookings;

import java.math.BigDecimal;
import java.util.List;

public record PackageResourceAllocationPreview(
        Long packageId,
        String packageName,
        ResourceOption guide,
        ResourceOption accommodation,
        ResourceOption vehicle,
        List<ResourceOption> guideOptions,
        List<ResourceOption> accommodationOptions,
        List<ResourceOption> vehicleOptions
) {
    public record ResourceOption(
            Long id,
            String name,
            String location,
            String image,
            String type,
            double rating,
            int reviews,
            BigDecimal pricePerDay,
            BigDecimal pricePerNight,
            Integer capacity,
            Integer experience,
            List<String> specialties,
            List<String> languages,
            List<String> amenities,
            String transmission,
            String fuel,
            List<String> features
    ) {}
}
