package com.voyara.tourguide.destinations;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.voyara.tourguide.common.ResourceNotFoundException;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WeatherService {
    private static final String GEOCODING_API = "https://geocoding-api.open-meteo.com/v1/search";
    private static final String FORECAST_API = "https://api.open-meteo.com/v1/forecast";
    private static final String SOURCE = "Open-Meteo";

    private final DestinationRepository destinationRepository;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String geocodingApi;
    private final String forecastApi;

    public WeatherService(DestinationRepository destinationRepository, ObjectMapper objectMapper) {
        this(destinationRepository, HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build(), objectMapper, GEOCODING_API, FORECAST_API);
    }

    WeatherService(DestinationRepository destinationRepository, HttpClient httpClient,
            ObjectMapper objectMapper, String geocodingApi, String forecastApi) {
        this.destinationRepository = destinationRepository;
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.geocodingApi = geocodingApi;
        this.forecastApi = forecastApi;
    }

    @Transactional(readOnly = true)
    public WeatherForecast forecastForDestination(Long destinationId) {
        Destination destination = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new ResourceNotFoundException("Destination", destinationId));

        if (destination.getName() == null || destination.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Weather cannot be resolved because the destination has no name.");
        }

        try {
            JsonNode location = geocode(destination);
            double latitude = location.path("latitude").asDouble(Double.NaN);
            double longitude = location.path("longitude").asDouble(Double.NaN);

            if (Double.isNaN(latitude) || Double.isNaN(longitude)) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Weather provider returned an invalid location.");
            }

            String forecastUrl = forecastUrl(latitude, longitude);
            JsonNode weather = objectMapper.readTree(get(forecastUrl));
            JsonNode current = weather.path("current");
            JsonNode daily = weather.path("daily");

            if (!current.has("temperature_2m") || !current.has("weather_code")
                    || !daily.has("time") || !daily.path("time").isArray()) {
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                        "Weather provider returned an incomplete forecast.");
            }

            List<WeatherDay> days = parseDailyForecast(daily);

            return new WeatherForecast(
                    destination.getId(),
                    destination.getName(),
                    location.path("name").asText(destination.getName()),
                    latitude,
                    longitude,
                    weather.path("timezone").asText("auto"),
                    current.path("temperature_2m").asDouble(),
                    current.path("weather_code").asInt(),
                    weatherCondition(current.path("weather_code").asInt()),
                    days,
                    SOURCE
            );
        } catch (ResponseStatusException exception) {
            throw exception;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Weather provider request was interrupted.", exception);
        } catch (IOException | RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Weather information is temporarily unavailable.", exception);
        }
    }

    private JsonNode geocode(Destination destination) throws IOException, InterruptedException {
        String query = destination.getName();
        if (destination.getCountry() != null && !destination.getCountry().isBlank()) {
            query += ", " + destination.getCountry();
        }

        String url = geocodingApi
                + "?name=" + encode(query)
                + "&count=1&language=en&format=json";

        JsonNode root = objectMapper.readTree(get(url));
        JsonNode results = root.path("results");
        if (!results.isArray() || results.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                    "Weather location could not be found for " + destination.getName() + ".");
        }
        return results.get(0);
    }

    private String forecastUrl(double latitude, double longitude) {
        return forecastApi
                + "?latitude=" + latitude
                + "&longitude=" + longitude
                + "&current=temperature_2m,weather_code"
                + "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset"
                + "&forecast_days=7"
                + "&timezone=auto";
    }

    private List<WeatherDay> parseDailyForecast(JsonNode daily) {
        List<WeatherDay> days = new ArrayList<>();
        JsonNode times = daily.path("time");
        for (int index = 0; index < times.size(); index++) {
            days.add(new WeatherDay(
                    textAt(daily.path("time"), index),
                    numberAt(daily.path("temperature_2m_min"), index),
                    numberAt(daily.path("temperature_2m_max"), index),
                    intAt(daily.path("precipitation_probability_max"), index),
                    intAt(daily.path("weather_code"), index),
                    weatherCondition(intAt(daily.path("weather_code"), index)),
                    textAt(daily.path("sunrise"), index),
                    textAt(daily.path("sunset"), index)
            ));
        }
        return days;
    }

    private String get(String url) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(8))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "Weather provider returned HTTP " + response.statusCode() + ".");
        }
        return response.body();
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private String textAt(JsonNode array, int index) {
        return index < array.size() ? array.get(index).asText() : "";
    }

    private double numberAt(JsonNode array, int index) {
        return index < array.size() && !array.get(index).isNull() ? array.get(index).asDouble() : 0;
    }

    private int intAt(JsonNode array, int index) {
        return index < array.size() && !array.get(index).isNull() ? array.get(index).asInt() : 0;
    }

    static String weatherCondition(int code) {
        return switch (code) {
            case 0 -> "Clear sky";
            case 1 -> "Mainly clear";
            case 2 -> "Partly cloudy";
            case 3 -> "Overcast";
            case 45 -> "Fog";
            case 48 -> "Depositing rime fog";
            case 51 -> "Light drizzle";
            case 53 -> "Moderate drizzle";
            case 55 -> "Dense drizzle";
            case 56 -> "Light freezing drizzle";
            case 57 -> "Dense freezing drizzle";
            case 61 -> "Slight rain";
            case 63 -> "Moderate rain";
            case 65 -> "Heavy rain";
            case 66 -> "Light freezing rain";
            case 67 -> "Heavy freezing rain";
            case 71 -> "Slight snowfall";
            case 73 -> "Moderate snowfall";
            case 75 -> "Heavy snowfall";
            case 77 -> "Snow grains";
            case 80 -> "Slight rain showers";
            case 81 -> "Moderate rain showers";
            case 82 -> "Violent rain showers";
            case 85 -> "Slight snow showers";
            case 86 -> "Heavy snow showers";
            case 95 -> "Thunderstorm";
            case 96 -> "Thunderstorm with slight hail";
            case 97 -> "Heavy thunderstorm";
            case 99 -> "Thunderstorm with heavy hail";
            default -> "Unknown weather";
        };
    }
}
