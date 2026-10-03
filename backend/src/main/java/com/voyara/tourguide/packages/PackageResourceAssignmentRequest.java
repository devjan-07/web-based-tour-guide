package com.voyara.tourguide.packages;

import java.util.List;

public record PackageResourceAssignmentRequest(
        List<Long> guideIds,
        List<Long> accommodationIds,
        List<Long> vehicleIds
) {
}
