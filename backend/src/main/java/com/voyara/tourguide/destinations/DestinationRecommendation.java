package com.voyara.tourguide.destinations;

import java.util.List;

public record DestinationRecommendation(
        Destination destination,
        int suitabilityScore,
        List<String> reasons
) {}
