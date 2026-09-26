package com.voyara.tourguide.destinations;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.voyara.tourguide.common.ResourceNotFoundException;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WeatherService {
    private static final String FORECAST_API = "https://api.open-meteo.com/v1/forecast";
    private static final String SOURCE = "Open-Meteo";

    private final DestinationRepository destinationRepository;
    private final LocationResolver locationResolver;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final String forecastApi;

    @Autowired
    public WeatherService(DestinationRepository destinationRepository,
                          LocationResolver locationResolver,
                          ObjectMapper objectMapper) {
        this(destinationRepository, locationResolver, HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build(), objectMapper, FORECAST_API);
    }

    WeatherService(DestinationRepository destinationRepository, HttpClient httpClient,
                   ObjectMapper objectMapper, String geocodingApi, String forecastApi) {
        this(destinationRepository,
                new LocationResolver(httpClient, objectMapper, geocodingApi),
                httpClient, objectMapper, forecastApi);
    }

    private WeatherService(DestinationRepository destinationRepository,
                           LocationResolver locationResolver,
                           HttpClient httpClient,
                           ObjectMapper objectMapper,
                           String forecastApi) {
        this.destinationRepository = destinationRepository;
        this.locationResolver = locationResolver;
        this.httpClient = httpClient;
        this.objectMapper = objectMapper;
        this.forecastApi = forecastApi;
    }

    @Transactional(readOnly = true)
    public WeatherForecast forecastForDestination(Long destinationId) {
        Destination destination = destinationRepository.findById(destinationId)
                .orElseThrow(() -> new ResourceNotFoundException("Destination", destinationId));

        try {
            GeoCoordinates coordinates = locationResolver.resolve(destination);
            JsonNode weather = objectMapper.readTree(get(
                    forecastUrl(coordinates.latitude(), coordinates.longitude())));
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
                    coordinates.locationName(),
                    coordinates.latitude(),
                    coordinates.longitude(),
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
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Weather service is temporarily unavailable. Please try again later.", exception);
        } catch (IOException | RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Weather service is temporarily unavailable. Please try again later.", exception);
        }
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

        HttpResponse<String> response =
                httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            HttpStatus status = response.statusCode() >= 500
                    ? HttpStatus.SERVICE_UNAVAILABLE
                    : HttpStatus.BAD_GATEWAY;
            String message = response.statusCode() >= 500
                    ? "Weather service is temporarily unavailable. Please try again later."
                    : "Weather provider returned HTTP " + response.statusCode() + ".";
            throw new ResponseStatusException(status, message);
        }
        return response.body();
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
