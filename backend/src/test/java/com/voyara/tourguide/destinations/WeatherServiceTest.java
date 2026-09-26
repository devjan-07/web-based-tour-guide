package com.voyara.tourguide.destinations;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.voyara.tourguide.common.ResourceNotFoundException;
import java.net.http.HttpClient;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WeatherServiceTest {
    @Mock DestinationRepository destinationRepository;
    @Mock HttpClient httpClient;

    @Test
    void mapsKnownWeatherCodes() {
        assertEquals("Clear sky", WeatherService.weatherCondition(0));
        assertEquals("Partly cloudy", WeatherService.weatherCondition(2));
        assertEquals("Heavy rain", WeatherService.weatherCondition(65));
        assertEquals("Thunderstorm", WeatherService.weatherCondition(95));
    }

    @Test
    void rejectsUnknownDestination() {
        when(destinationRepository.findById(99L)).thenReturn(Optional.empty());

        WeatherService service = new WeatherService(
                destinationRepository,
                httpClient,
                new ObjectMapper(),
                "http://localhost/geocode",
                "http://localhost/forecast");

        ResourceNotFoundException error = assertThrows(ResourceNotFoundException.class,
                () -> service.forecastForDestination(99L));

        assertEquals("Destination not found with id: 99", error.getMessage());
    }
}
