package com.voyara.tourguide.routes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "Routes")
@Getter
@Setter
public class Route {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "RouteID")
    private Long id;

    @Positive
    @Column(name = "DestinationID", nullable = false)
    private Long destinationId;

    @NotBlank
    @Column(name = "RouteName", nullable = false)
    private String routeName;

    @NotBlank
    @Column(name = "StartLocation", nullable = false)
    private String startLocation;

    @NotBlank
    @Column(name = "EndLocation", nullable = false)
    private String endLocation;

    @Positive
    @Column(name = "DistanceKm")
    private Double distanceKm;

    @Positive
    @Column(name = "EstimatedDuration")
    private Integer estimatedDuration;

    @Column(name = "Description")
    private String description;

    @Column(name = "Status", nullable = false)
    private String status = "ACTIVE";
}
