package com.voyara.tourguide.vehiclerental;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {
    private final VehicleService service;

    public VehicleController(VehicleService service) {
        this.service = service;
    }

    @GetMapping
    public List<VehicleResponse> all() {
        return service.findPublic().stream().map(VehicleResponse::from).toList();
    }

    @GetMapping("/recommendations")
    public List<VehicleRecommendation> recommendations(
            @RequestParam(required = false) Integer passengers,
            @RequestParam(required = false) Integer luggage,
            @RequestParam(required = false) Boolean driverRequired,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer maxDailyBudget
    ) {
        return service.recommend(passengers, luggage, driverRequired, location, maxDailyBudget);
    }

    @GetMapping("/{id}")
    public VehicleResponse one(@PathVariable Long id) {
        return VehicleResponse.from(service.findPublicById(id));
    }
}
