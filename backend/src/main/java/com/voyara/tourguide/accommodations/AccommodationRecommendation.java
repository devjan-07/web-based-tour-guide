package com.voyara.tourguide.accommodations;

import java.util.List;

public record AccommodationRecommendation(
        AccommodationResponse accommodation,
        int suitabilityScore,
        List<String> reasons
) {}
