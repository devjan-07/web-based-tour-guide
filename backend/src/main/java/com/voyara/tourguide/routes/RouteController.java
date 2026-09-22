package com.voyara.tourguide.routes;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/routes")
public class RouteController {
    private final RouteService service;

    public RouteController(RouteService service) {
        this.service = service;
    }

    @GetMapping
    public List<Route> all() {
        return service.findAll();
    }

    @GetMapping("/active")
    public List<Route> active() {
        return service.findActive();
    }

    @GetMapping("/destination/{destinationId}")
    public List<Route> byDestination(@PathVariable Long destinationId) {
        return service.findByDestination(destinationId);
    }

    @GetMapping("/{id}")
    public Route one(@PathVariable Long id) {
        return service.findById(id);
    }

    @PostMapping
    public Route create(@Valid @RequestBody Route route) {
        return service.save(route);
    }

    @PutMapping("/{id}")
    public Route update(@PathVariable Long id, @Valid @RequestBody Route route) {
        return service.update(id, route);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
