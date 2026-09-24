package com.voyara.tourguide.vehiclerental;

import java.util.List;

public record VehicleRecommendation(
        VehicleResponse vehicle,
        int suitabilityScore,
        List<String> reasons
) {}
