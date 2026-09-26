package com.voyara.tourguide.destinations;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class LocationResolver {
    private static final String DEFAULT_GEOCODING_API =
            "https://geocoding-api.open-meteo.com/v1/search";

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String geocodingApi;
    private final Map<String, GeoCoordinates> coordinateCache = new ConcurrentHashMap<>();

    @Autowired
    public LocationResolver(ObjectMapper objectMapper) {
        this(HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build(), objectMapper, DEFAULT_GEOCODING_API);
    }

    LocationResolver(HttpClient httpClient, ObjectMapper objectMapper, String geocodingApi) {
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.geocodingApi = geocodingApi;
    }

    public GeoCoordinates resolve(Destination destination) {
        if (destination == null || destination.getName() == null || destination.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Location cannot be resolved because the destination has no name.");
        }

        String key = cacheKey(destination);
        GeoCoordinates cached = coordinateCache.get(key);
        if (cached != null) {
            return cached;
        }

        try {
            JsonNode location = geocode(destination);
            double latitude = location.path("latitude").asDouble(Double.NaN);
            double longitude = location.path("longitude").asDouble(Double.NaN);

            if (Double.isNaN(latitude) || Double.isNaN(longitude)
                    || latitude < -90 || latitude > 90
                    || longitude < -180 || longitude > 180) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Location provider returned invalid coordinates.");
            }

            GeoCoordinates coordinates = new GeoCoordinates(latitude, longitude, location.path("name").asText(destination.getName()));
            coordinateCache.put(key, coordinates);
            return coordinates;
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Location service is temporarily unavailable. Please try again later.", exception);
        } catch (IOException | RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Location service is temporarily unavailable. Please try again later.", exception);
        }
    }

    private JsonNode geocode(Destination destination) throws IOException, InterruptedException {
        String query = destination.getName();
        if (destination.getCountry() != null && !destination.getCountry().isBlank()) {
            query += ", " + destination.getCountry();
        }

        String url = geocodingApi
                + "?name=" + URLEncoder.encode(query, StandardCharsets.UTF_8)
                + "&count=1&language=en&format=json";

        JsonNode root = objectMapper.readTree(get(url));
        JsonNode results = root.path("results");

        if (!results.isArray() || results.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Location could not be found for " + destination.getName() + ".");
        }

        return results.get(0);
    }

    private String get(String url) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(8))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response =
                httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            HttpStatus status = response.statusCode() >= 500
                    ? HttpStatus.SERVICE_UNAVAILABLE
                    : HttpStatus.BAD_GATEWAY;
            String message = response.statusCode() >= 500
                    ? "Location service is temporarily unavailable. Please try again later."
                    : "Location provider returned HTTP " + response.statusCode() + ".";
            throw new ResponseStatusException(status, message);
        }

        return response.body();
    }

    private String cacheKey(Destination destination) {
        return (destination.getName().trim() + "|" +
                (destination.getCountry() == null ? "" : destination.getCountry().trim()))
                .toLowerCase();
    }
}
