package com.voyara.tourguide.bookings;

import java.util.List;
import java.util.Collection;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookingRepository extends JpaRepository<Booking, String> {
    List<Booking> findByEmailIgnoreCaseOrderByCreatedAtDesc(String email);

    List<Booking> findByTouristIdOrderByCreatedAtDesc(Long touristId);

    List<Booking> findByTouristIsNullAndEmailIgnoreCase(String email);

    List<Booking> findByTouristId(Long touristId);

    List<Booking> findByAccommodationResourceOwnerIdOrderByCreatedAtDesc(Long ownerUserId);
    List<Booking> findByVehicleResourceOwnerIdOrderByCreatedAtDesc(Long ownerUserId);

    boolean existsByTourPackageId(Long packageId);

    boolean existsByTourGuideId(Long guideId);

    boolean existsByAccommodationResourceId(Long accommodationId);

    boolean existsByVehicleResourceId(Long vehicleId);
}
