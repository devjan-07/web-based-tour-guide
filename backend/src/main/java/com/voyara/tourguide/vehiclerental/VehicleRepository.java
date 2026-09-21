package com.voyara.tourguide.vehiclerental;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    List<Vehicle> findByStatusIgnoreCase(String status);
    List<Vehicle> findByOwnerIdOrderByIdDesc(Long ownerUserId);
    boolean existsByPlateIgnoreCase(String plate);
    boolean existsByPlateIgnoreCaseAndIdNot(String plate, Long id);
}
