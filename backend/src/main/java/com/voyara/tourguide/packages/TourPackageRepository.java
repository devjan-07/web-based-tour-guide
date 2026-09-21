package com.voyara.tourguide.packages;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TourPackageRepository extends JpaRepository<TourPackage, Long> {
    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM TourPackage p JOIN p.destinations d WHERE LOWER(d) = LOWER(:destinationName)")
    boolean existsByDestinationName(@Param("destinationName") String destinationName);
}
