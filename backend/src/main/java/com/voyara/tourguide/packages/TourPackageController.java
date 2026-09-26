package com.voyara.tourguide.packages;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/packages")
public class TourPackageController {
    private final TourPackageService service;

    public TourPackageController(TourPackageService service) {
        this.service = service;
    }

    @GetMapping
    public List<TourPackage> all()
    {
        return service.findAll();
    }

    @GetMapping("/filter")
    public List<TourPackage> filterByBudget(
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice) {
        return service.filterByBudget(minPrice, maxPrice);
    }

    @GetMapping("/{id}/routes")
    public List<com.voyara.tourguide.routes.Route> routes(@PathVariable Long id) {
        return service.routesForPackage(id);
    }

    @GetMapping("/{id}")
    public TourPackage one(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public TourPackage create(@Valid @RequestBody TourPackage tourPackage) {
        return service.save(tourPackage);
    }

    @PutMapping("/{id}")
    public TourPackage update(@PathVariable Long id, @Valid @RequestBody TourPackage tourPackage) {
        return service.update(id, tourPackage);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
