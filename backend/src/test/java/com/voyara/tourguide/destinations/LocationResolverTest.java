package com.voyara.tourguide.destinations;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.http.HttpClient;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LocationResolverTest {
    @Mock HttpClient httpClient;
    @Mock HttpResponse<String> httpResponse;

    @Test
    void cachesResolvedCoordinatesDuringApplicationRuntime() throws Exception {
        when(httpResponse.statusCode()).thenReturn(200);
        when(httpResponse.body()).thenReturn("""
                {"results":[{"name":"Kandy","latitude":7.2906,"longitude":80.6337}]}
                """);
        when(httpClient.<String>send(any(), any())).thenReturn(httpResponse);

        LocationResolver resolver = new LocationResolver(httpClient, new ObjectMapper(), "http://localhost/geocode");

        Destination destination = new Destination();
        destination.setName("Kandy");
        destination.setCountry("Sri Lanka");

        GeoCoordinates first = resolver.resolve(destination);
        GeoCoordinates second = resolver.resolve(destination);

        assertEquals(7.2906, first.latitude(), 0.0001);
        assertEquals(80.6337, first.longitude(), 0.0001);
        assertEquals("Kandy", first.locationName());
        assertEquals(first, second);
        verify(httpClient, times(1)).send(any(), any());
    }
}
