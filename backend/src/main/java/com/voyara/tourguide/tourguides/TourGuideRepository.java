package com.voyara.tourguide.tourguides;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface TourGuideRepository extends JpaRepository<TourGuide, Long> {
    Optional<TourGuide> findByUserId(Long userId);
}
