package com.voyara.tourguide.accommodations;

import jakarta.validation.constraints.NotNull;

public record AccommodationOwnerRequest(@NotNull Long ownerUserId) {}
