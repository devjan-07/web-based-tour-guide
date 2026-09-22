package com.voyara.tourguide.routes;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RouteRepository extends JpaRepository<Route, Long> {
    List<Route> findByDestinationId(Long destinationId);
    List<Route> findByDestinationIdAndStatusIgnoreCase(Long destinationId, String status);
}
