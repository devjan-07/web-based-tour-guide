package com.voyara.tourguide.tourguides;

import java.util.List;

public record GuideRecommendation(
        TourGuide guide,
        int suitabilityScore,
        List<String> reasons
) {}
