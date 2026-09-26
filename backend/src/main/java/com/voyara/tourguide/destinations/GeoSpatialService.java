package com.voyara.tourguide.destinations;

import java.util.Comparator;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GeoSpatialService {
    private static final double EARTH_RADIUS_KM = 6371.0088;

    private final DestinationRepository destinationRepository;
    private final LocationResolver locationResolver;

    public GeoSpatialService(DestinationRepository destinationRepository, LocationResolver locationResolver) {
        this.destinationRepository = destinationRepository;
        this.locationResolver = locationResolver;
    }

    @Transactional(readOnly = true)
    public List<NearbyDestination> findNearby(double latitude, double longitude, double radiusKm) {
        validateSearch(latitude, longitude, radiusKm);

        return destinationRepository.findAll().stream()
                .filter(destination -> "Active".equalsIgnoreCase(destination.getStatus()))
                .map(destination -> toNearbyDestination(destination, latitude, longitude))
                .filter(java.util.Objects::nonNull)
                .filter(result -> result.distanceKm() <= radiusKm)
                .sorted(Comparator.comparingDouble(NearbyDestination::distanceKm))
                .toList();
    }

    private NearbyDestination toNearbyDestination(Destination destination,
                                                   double searchLatitude,
                                                   double searchLongitude) {
        try {
            GeoCoordinates coordinates = locationResolver.resolve(destination);
            if (destination.getCategories() != null) {
                destination.getCategories().size();
            }
            double distanceKm = distanceKm(searchLatitude, searchLongitude,
                    coordinates.latitude(), coordinates.longitude());
            return new NearbyDestination(destination, round(distanceKm),
                    coordinates.latitude(), coordinates.longitude());
        } catch (ResponseStatusException exception) {
            if (exception.getStatusCode() == HttpStatus.NOT_FOUND) {
                return null;
            }
            throw exception;
        }
    }

    static double distanceKm(double latitude1, double longitude1,
                             double latitude2, double longitude2) {
        double latitudeDelta = Math.toRadians(latitude2 - latitude1);
        double longitudeDelta = Math.toRadians(longitude2 - longitude1);
        double a = Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2)
                + Math.cos(Math.toRadians(latitude1)) * Math.cos(Math.toRadians(latitude2))
                * Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);
        double centralAngle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * centralAngle;
    }

    private void validateSearch(double latitude, double longitude, double radiusKm) {
        if (!Double.isFinite(latitude) || latitude < -90 || latitude > 90) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Latitude must be between -90 and 90.");
        }
        if (!Double.isFinite(longitude) || longitude < -180 || longitude > 180) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Longitude must be between -180 and 180.");
        }
        if (!Double.isFinite(radiusKm) || radiusKm <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Radius must be greater than 0 km.");
        }
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
