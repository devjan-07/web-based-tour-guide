package com.voyara.tourguide.packages;

import com.voyara.tourguide.accommodations.Accommodation;
import com.voyara.tourguide.tourguides.TourGuide;
import com.voyara.tourguide.vehiclerental.Vehicle;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
public class TourPackage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String name;

    private String category;

    @ElementCollection
    private List<String> destinations = new ArrayList<>();

    private int duration;
    private BigDecimal price = BigDecimal.ZERO;
    private int maxGroup;
    private String difficulty = "Easy";
    private String status = "Draft";
    private double rating;
    private int reviews;
    private int bookings;
    private String image;
    @jakarta.persistence.Column(name = "included_items")
    private String included;
    private String description;

    /**
     * Resources that may fulfil this package. A package deliberately keeps a
     * pool of eligible resources rather than one permanently assigned resource.
     * The actual resource is selected at booking time according to availability.
     */
    @ManyToMany
    @JoinTable(name = "tour_package_guides",
            joinColumns = @JoinColumn(name = "package_id"),
            inverseJoinColumns = @JoinColumn(name = "guide_id"))
    private List<TourGuide> eligibleGuides = new ArrayList<>();

    @ManyToMany
    @JoinTable(name = "tour_package_accommodations",
            joinColumns = @JoinColumn(name = "package_id"),
            inverseJoinColumns = @JoinColumn(name = "accommodation_id"))
    private List<Accommodation> eligibleAccommodations = new ArrayList<>();

    @ManyToMany
    @JoinTable(name = "tour_package_vehicles",
            joinColumns = @JoinColumn(name = "package_id"),
            inverseJoinColumns = @JoinColumn(name = "vehicle_id"))
    private List<Vehicle> eligibleVehicles = new ArrayList<>();
}
