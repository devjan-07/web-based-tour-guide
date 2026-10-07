package com.voyara.tourguide.config;

import com.voyara.tourguide.accommodations.Accommodation;
import com.voyara.tourguide.accommodations.AccommodationRepository;
import com.voyara.tourguide.destinations.Destination;
import com.voyara.tourguide.destinations.DestinationRepository;
import com.voyara.tourguide.packages.TourPackage;
import com.voyara.tourguide.packages.TourPackageRepository;
import com.voyara.tourguide.tourguides.TourGuide;
import com.voyara.tourguide.tourguides.TourGuideRepository;
import com.voyara.tourguide.vehiclerental.Vehicle;
import com.voyara.tourguide.vehiclerental.VehicleRepository;
import com.voyara.tourguide.routes.Route;
import com.voyara.tourguide.routes.RouteRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.BiConsumer;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(100)
@RequiredArgsConstructor
public class DemoDataSeeder implements CommandLineRunner {
    private final DestinationRepository destinationRepository;
    private final TourPackageRepository tourPackageRepository;
    private final AccommodationRepository accommodationRepository;
    private final TourGuideRepository tourGuideRepository;
    private final VehicleRepository vehicleRepository;
    private final RouteRepository routeRepository;

    @Value("${app.demo-data.enabled:true}")
    private boolean enabled;

    @Override
    public void run(String... args) {
        if (!enabled) {
            return;
        }

        List<Destination> destinations = seedDestinations();
        seedRoutes(destinations);
        seedTourPackages();
        seedAccommodations(destinations);
        seedTourGuides();
        seedVehicles();
        seedPackageResources();
    }

    private List<Destination> seedDestinations() {
        List<Destination> destinations = List.of(
                destination("Sigiriya Rock Fortress", "Cultural", "History", "UNESCO",
                        "Ancient rock fortress with frescoes, water gardens, and panoramic plains.",
                        "https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1200&q=80",
                        4.8, 1240, "December to April", "Lion Rock, frescoes, mirror wall, royal gardens"),
                destination("Ella Highlands", "Nature", "Hiking", "Tea Country",
                        "Hill-country town known for tea estates, waterfalls, and rail viewpoints.",
                        "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80",
                        4.7, 980, "January to September", "Nine Arch Bridge, Little Adam's Peak, Ravana Falls"),
                destination("Mirissa Beach", "Beach", "Whale Watching", "Relaxation",
                        "South coast beach destination with whale watching and sunset viewpoints.",
                        "https://images.unsplash.com/photo-1586500036706-41963de24d8b?auto=format&fit=crop&w=1200&q=80",
                        4.6, 760, "November to April", "Coconut Tree Hill, whale watching, surfing"),
                destination("Kandy", "Culture", "City", "Heritage",
                        "Historic hill capital centered around the Temple of the Tooth and Kandy Lake.",
                        "https://images.unsplash.com/photo-1586089688878-28708d388c43?auto=format&fit=crop&w=1200&q=80",
                        4.5, 840, "December to April", "Temple of the Tooth, Kandy Lake, botanical gardens"),
                destination("Galle Fort", "Heritage", "Architecture", "Coast",
                        "UNESCO-listed colonial fort with ramparts, cafes, museums, and ocean views.",
                        "https://images.unsplash.com/photo-1580889240911-53df20d9bd62?auto=format&fit=crop&w=1200&q=80",
                        4.6, 690, "December to April", "Dutch Fort, lighthouse, ramparts, boutiques"),
                destination("Yala National Park", "Wildlife", "Safari", "Nature",
                        "Sri Lanka's famous wildlife park known for leopards, elephants, and birdlife.",
                        "https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1200&q=80",
                        4.7, 720, "February to July", "Leopard safari, elephants, lagoons, birdlife"),
                destination("Nuwara Eliya", "Tea Country", "Wellness", "Nature",
                        "Cool hill station with tea estates, gardens, waterfalls, and colonial charm.",
                        "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80",
                        4.5, 610, "February to April", "Tea estates, Gregory Lake, Horton Plains"),
                destination("Anuradhapura", "History", "Spiritual", "UNESCO",
                        "Ancient sacred city with stupas, monasteries, reservoirs, and pilgrimage sites.",
                        "https://images.unsplash.com/photo-1605649461784-edc5f43e7989?auto=format&fit=crop&w=1200&q=80",
                        4.6, 540, "May to September", "Ruwanwelisaya, Sri Maha Bodhi, ancient reservoirs"),
                destination("Trincomalee", "Beach", "Diving", "Family",
                        "East coast destination with clear beaches, temples, snorkeling, and diving.",
                        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
                        4.5, 430, "May to September", "Nilaveli, Pigeon Island, Koneswaram Temple"),
                destination("Polonnaruwa", "History", "Cycling", "UNESCO",
                        "Ancient capital with well-preserved ruins, stone carvings, and cycling routes.",
                        "https://images.unsplash.com/photo-1588250583782-c1c130badf35?auto=format&fit=crop&w=1200&q=80",
                        4.4, 380, "June to September", "Gal Vihara, royal palace ruins, cycling trails")
        );

        saveMissing(destinations, destinationRepository.findAll(), Destination::getName, destinationRepository::saveAll);
        return destinationRepository.findAll();
    }

    private void seedRoutes(List<Destination> destinations) {
        List<Route> routes = List.of(
                route("Sigiriya Heritage Trail", "Sigiriya Rock Fortress", "Sigiriya Village", "Sigiriya Rock Fortress", 2.80, 15, "Scenic approach to the ancient rock fortress."),
                route("Sigiriya Village Loop", "Sigiriya Rock Fortress", "Sigiriya Rock Fortress", "Pidurangala Viewpoint", 4.50, 30, "Short scenic loop linking the fortress area with a panoramic viewpoint."),
                route("Ella Highlands Walk", "Ella Highlands", "Ella Town", "Nine Arch Bridge", 3.20, 45, "Scenic walking route through the tea-country hills."),
                route("Ella Peak Trail", "Ella Highlands", "Ella Town", "Little Adam's Peak", 2.90, 50, "Popular hill trail with wide valley views."),
                route("Mirissa Coastal Route", "Mirissa Beach", "Mirissa Beach", "Coconut Tree Hill", 2.40, 20, "Relaxed coastal route connecting the beach with the sunset viewpoint."),
                route("Galle Fort Walk", "Galle Fort", "Galle Railway Station", "Galle Fort", 2.00, 25, "Walking route into the historic fort area."),
                route("Yala Safari Route", "Yala National Park", "Yala Entrance", "Yala National Park", 12.00, 60, "Wildlife route through the national park area."),
                route("Kandy Heritage Route", "Kandy", "Kandy Lake", "Temple of the Tooth", 4.50, 30, "City route connecting Kandy's principal heritage sights."),
                route("Nuwara Eliya Tea Route", "Nuwara Eliya", "Nuwara Eliya Town", "Tea Estate Area", 8.00, 35, "Scenic route through the hill-country tea estates."),
                route("Anuradhapura Ancient City Route", "Anuradhapura", "Anuradhapura Railway Station", "Ancient City", 6.00, 35, "Route into the ancient city and major archaeological sites."),
                route("Trincomalee Coast Route", "Trincomalee", "Nilaveli", "Pigeon Island Boat Point", 14.00, 30, "Coastal route for beach and marine experiences."),
                route("Polonnaruwa Heritage Cycle", "Polonnaruwa", "Ancient City Entrance", "Gal Vihara", 5.50, 30, "Cycling route through the ancient city ruins.")
        );
        Map<String, Long> destinationIds = destinations.stream()
                .collect(Collectors.toMap(destination -> seedKey(destination.getName()), Destination::getId));
        List<Route> resolved = routes.stream()
                .filter(route -> destinationIds.containsKey(seedKey(route.getRouteName().split("::", 2)[0])))
                .map(route -> {
                    String destinationName = route.getRouteName().split("::", 2)[0];
                    route.setRouteName(route.getRouteName().split("::", 2)[1]);
                    route.setDestinationId(destinationIds.get(seedKey(destinationName)));
                    return route;
                }).toList();
        syncSeeded(resolved, routeRepository.findAll(), Route::getRouteName,
                (existing, seed) -> {
                    existing.setDestinationId(seed.getDestinationId());
                    existing.setStartLocation(seed.getStartLocation());
                    existing.setEndLocation(seed.getEndLocation());
                    existing.setDistanceKm(seed.getDistanceKm());
                    existing.setEstimatedDuration(seed.getEstimatedDuration());
                    existing.setDescription(seed.getDescription());
                    existing.setStatus(seed.getStatus());
                }, routeRepository::saveAll);
    }

    private Route route(String routeName, String destination, String start, String end, double distanceKm,
                        int durationMinutes, String description) {
        Route route = new Route();
        route.setRouteName(destination + "::" + routeName);
        route.setStartLocation(start);
        route.setEndLocation(end);
        route.setDistanceKm(distanceKm);
        route.setEstimatedDuration(durationMinutes);
        route.setDescription(description);
        route.setStatus("ACTIVE");
        return route;
    }

    private void seedPackageResources() {
        // Refresh the package map after seeding so newly-created demo packages are always available.
        List<TourPackage> seededPackages = tourPackageRepository.findAll();
        Map<String, TourPackage> packages = seededPackages.stream()
                .collect(Collectors.toMap(TourPackage::getName, Function.identity(), (first, second) -> first));
        Map<String, TourGuide> guides = tourGuideRepository.findAll().stream()
                .collect(Collectors.toMap(TourGuide::getName, Function.identity(), (first, second) -> first));
        Map<String, Accommodation> accommodations = accommodationRepository.findAll().stream()
                .collect(Collectors.toMap(Accommodation::getName, Function.identity(), (first, second) -> first));
        Map<String, Vehicle> vehicles = vehicleRepository.findAll().stream()
                .collect(Collectors.toMap(Vehicle::getName, Function.identity(), (first, second) -> first));

        assignPackageResources(packages, guides, accommodations, vehicles,
                "Sri Lanka Cultural Triangle",
                List.of("Tharindu Jayasuriya", "Ruwini De Silva", "Ishara Wijesinghe"),
                List.of("Sigiriya Garden Lodge", "Anuradhapura Heritage Stay", "Polonnaruwa Ruins Guesthouse"),
                List.of("Toyota Hiace Van", "Toyota KDH High Roof", "Toyota Coaster Bus"));

        assignPackageResources(packages, guides, accommodations, vehicles,
                "Ella Highlands Escape",
                List.of("Nethmi Fernando", "Sanjaya Bandara"),
                List.of("Ella Tea Valley Villa", "Nuwara Eliya Tea Bungalow"),
                List.of("Mitsubishi Montero SUV", "Honda Vezel SUV", "Toyota Hiace Van"));

        assignPackageResources(packages, guides, accommodations, vehicles,
                "South Coast Beach Break",
                List.of("Kasun Silva", "Hiruni Samarasinghe"),
                List.of("Mirissa Bay Resort", "Galle Fort Heritage Inn"),
                List.of("Suzuki Wagon R", "Nissan Caravan", "Toyota KDH High Roof"));

        assignPackageResources(packages, guides, accommodations, vehicles,
                "Kandy Heritage Weekend",
                List.of("Amal Perera"),
                List.of("Kandy Lake Boutique Hotel"),
                List.of("Toyota Hiace Van", "Toyota Coaster Bus"));

        assignPackageResources(packages, guides, accommodations, vehicles,
                "Yala Safari Adventure",
                List.of("Dilan Madushanka"),
                List.of("Yala Safari Camp"),
                List.of("Mitsubishi Montero SUV", "Toyota Hiace Van"));

        assignPackageResources(packages, guides, accommodations, vehicles,
                "Tea Country Wellness Route",
                List.of("Nethmi Fernando", "Sanjaya Bandara"),
                List.of("Nuwara Eliya Tea Bungalow", "Ella Tea Valley Villa"),
                List.of("Mitsubishi Montero SUV", "Honda Vezel SUV"));

        assignPackageResources(packages, guides, accommodations, vehicles,
                "East Coast Snorkel Trip",
                List.of("Mohan Raj"),
                List.of("Trinco Coral Beach Hotel"),
                List.of("Nissan Caravan", "Honda Vezel SUV"));

        assignPackageResources(packages, guides, accommodations, vehicles,
                "Ancient Cities Cycling Tour",
                List.of("Ruwini De Silva", "Ishara Wijesinghe"),
                List.of("Anuradhapura Heritage Stay", "Polonnaruwa Ruins Guesthouse"),
                List.of("Tuk Tuk City Ride", "Toyota Hiace Van", "Toyota Coaster Bus"));

        assignPackageResources(packages, guides, accommodations, vehicles,
                "Galle Food and Fort Walk",
                List.of("Hiruni Samarasinghe"),
                List.of("Galle Fort Heritage Inn"),
                List.of("Suzuki Wagon R", "Nissan Caravan"));

        assignPackageResources(packages, guides, accommodations, vehicles,
                "Sri Lanka Family Highlights",
                List.of("Amal Perera", "Nethmi Fernando", "Kasun Silva"),
                List.of("Kandy Lake Boutique Hotel", "Sigiriya Garden Lodge", "Mirissa Bay Resort"),
                List.of("Toyota Hiace Van", "Toyota KDH High Roof", "Toyota Coaster Bus", "Luxury Mercedes Vito"));
    }

    private void assignPackageResources(
            Map<String, TourPackage> packages,
            Map<String, TourGuide> guides,
            Map<String, Accommodation> accommodations,
            Map<String, Vehicle> vehicles,
            String packageName,
            List<String> guideNames,
            List<String> accommodationNames,
            List<String> vehicleNames) {

        TourPackage tourPackage = required(packages, packageName, "package");
        tourPackage.setEligibleGuides(guideNames.stream()
                .map(name -> required(guides, name, "guide"))
                .toList());
        tourPackage.setEligibleAccommodations(accommodationNames.stream()
                .map(name -> required(accommodations, name, "accommodation"))
                .toList());
        tourPackage.setEligibleVehicles(vehicleNames.stream()
                .map(name -> required(vehicles, name, "vehicle"))
                .toList());

        tourPackageRepository.save(tourPackage);
    }

    private <T> T required(Map<String, T> values, String key, String type) {
        T value = values.get(key);
        if (value == null) {
            throw new IllegalStateException(
                    "Demo data is missing " + type + ": " + key
                            + ". Check that the corresponding demo seeding method runs before package resources are assigned.");
        }
        return value;
    }

    private void seedTourPackages() {
        List<TourPackage> tourPackages = List.of(
                tourPackage("Sri Lanka Cultural Triangle", "Cultural", List.of("Sigiriya Rock Fortress", "Anuradhapura", "Polonnaruwa"), 5, "145000.00", 12, "Easy", 4.8, 312, 86, "Guide, hotel, breakfast, attraction tickets, private transport"),
                tourPackage("Ella Highlands Escape", "Nature", List.of("Ella Highlands", "Nuwara Eliya"), 4, "108000.00", 10, "Moderate", 4.7, 228, 64, "Guide, accommodation, breakfast, hikes, station transfers"),
                tourPackage("South Coast Beach Break", "Beach", List.of("Mirissa Beach", "Galle Fort"), 3, "87000.00", 8, "Easy", 4.6, 175, 52, "Hotel, breakfast, coastal transport, whale watching support"),
                tourPackage("Kandy Heritage Weekend", "Cultural", List.of("Kandy"), 2, "54000.00", 8, "Easy", 4.5, 121, 39, "Guide, hotel, breakfast, city transfers"),
                tourPackage("Yala Safari Adventure", "Wildlife", List.of("Yala National Park"), 3, "126000.00", 6, "Moderate", 4.8, 204, 58, "Safari jeep, naturalist guide, lodge stay, breakfast"),
                tourPackage("Tea Country Wellness Route", "Wellness", List.of("Nuwara Eliya", "Ella Highlands"), 4, "117000.00", 10, "Easy", 4.6, 148, 42, "Tea estate visits, wellness stay, breakfast, private transport"),
                tourPackage("East Coast Snorkel Trip", "Water Sports", List.of("Trincomalee"), 4, "132000.00", 8, "Moderate", 4.5, 97, 31, "Beach stay, snorkeling support, breakfast, transport"),
                tourPackage("Ancient Cities Cycling Tour", "Adventure", List.of("Anuradhapura", "Polonnaruwa"), 4, "105000.00", 12, "Moderate", 4.4, 88, 27, "Bicycles, guide, hotel, breakfast, site tickets"),
                tourPackage("Galle Food and Fort Walk", "Food", List.of("Galle Fort"), 2, "63000.00", 8, "Easy", 4.7, 134, 45, "Food tasting, guide, boutique stay, breakfast"),
                tourPackage("Sri Lanka Family Highlights", "Family", List.of("Kandy", "Sigiriya Rock Fortress", "Mirissa Beach"), 7, "228000.00", 14, "Easy", 4.8, 256, 73, "Guide, family hotels, breakfast, private van, attraction tickets")
        );

        syncSeeded(tourPackages, tourPackageRepository.findAll(), TourPackage::getName,
                (existing, seed) -> {
                    existing.setPrice(seed.getPrice());
                    existing.setImage(seed.getImage());
                    existing.setIncluded(seed.getIncluded());
                    existing.setDescription(seed.getDescription());
                }, tourPackageRepository::saveAll);
    }

    private void seedAccommodations(List<Destination> destinations) {
        List<Accommodation> accommodations = List.of(
                accommodation("Sigiriya Garden Lodge", "Hotel", "Sigiriya", "28500.00", 22, 0, 0, List.of("WiFi", "Pool", "Breakfast", "Garden View"), destinationId(destinations, "Sigiriya Rock Fortress")),
                accommodation("Ella Tea Valley Villa", "Villa", "Ella", "36000.00", 12, 0, 0, List.of("WiFi", "Mountain View", "Breakfast", "Tea Estate Walks"), destinationId(destinations, "Ella Highlands")),
                accommodation("Mirissa Bay Resort", "Resort", "Mirissa", "43500.00", 35, 0, 0, List.of("Pool", "Beach Access", "Breakfast", "Whale Watching Desk"), destinationId(destinations, "Mirissa Beach")),
                accommodation("Kandy Lake Boutique Hotel", "Hotel", "Kandy", "28500.00", 28, 0, 0, List.of("WiFi", "Breakfast", "Lake View", "Airport Transfer"), destinationId(destinations, "Kandy")),
                accommodation("Galle Fort Heritage Inn", "Hotel", "Galle", "39000.00", 18, 0, 0, List.of("WiFi", "Breakfast", "Fort Walks", "Restaurant"), destinationId(destinations, "Galle Fort")),
                accommodation("Yala Safari Camp", "Resort", "Yala", "48000.00", 16, 0, 0, List.of("Safari Desk", "Breakfast", "Nature Views", "Parking"), destinationId(destinations, "Yala National Park")),
                accommodation("Nuwara Eliya Tea Bungalow", "Villa", "Nuwara Eliya", "40500.00", 14, 0, 0, List.of("Tea Estate", "Fireplace", "Breakfast", "Garden"), destinationId(destinations, "Nuwara Eliya")),
                accommodation("Anuradhapura Heritage Stay", "Hotel", "Anuradhapura", "25500.00", 24, 0, 0, List.of("WiFi", "Breakfast", "Bike Rental", "Parking"), destinationId(destinations, "Anuradhapura")),
                accommodation("Trinco Coral Beach Hotel", "Resort", "Trincomalee", "45000.00", 30, 0, 0, List.of("Beach Access", "Pool", "Diving Desk", "Breakfast"), destinationId(destinations, "Trincomalee")),
                accommodation("Polonnaruwa Ruins Guesthouse", "Hostel", "Polonnaruwa", "21000.00", 20, 0, 0, List.of("WiFi", "Bike Rental", "Breakfast", "Garden"), destinationId(destinations, "Polonnaruwa"))
        );

        syncSeeded(accommodations, accommodationRepository.findAll(), Accommodation::getName,
                (existing, seed) -> existing.setPrice(seed.getPrice()), accommodationRepository::saveAll);
    }

    private void seedTourGuides() {
        List<TourGuide> tourGuides = List.of(
                guide("Amal Perera", "AP", "#2563eb", "Kandy", List.of("Culture", "History", "Temple Tours"), List.of("English", "Sinhala"), "16500.00", 9, 0, 0),
                guide("Nethmi Fernando", "NF", "#16a34a", "Ella", List.of("Nature", "Hiking", "Tea Country"), List.of("English", "Sinhala", "Tamil"), "18000.00", 7, 0, 0),
                guide("Kasun Silva", "KS", "#dc2626", "Mirissa", List.of("Beach", "Wildlife", "Family Trips"), List.of("English", "Sinhala"), "15000.00", 6, 0, 0),
                guide("Tharindu Jayasuriya", "TJ", "#7c3aed", "Sigiriya", List.of("Archaeology", "Photography", "UNESCO"), List.of("English", "Sinhala"), "17400.00", 8, 0, 0),
                guide("Hiruni Samarasinghe", "HS", "#0891b2", "Galle", List.of("Food", "Architecture", "Walking Tours"), List.of("English", "Sinhala", "French"), "18600.00", 6, 0, 0),
                guide("Dilan Madushanka", "DM", "#ea580c", "Yala", List.of("Safari", "Wildlife", "Birding"), List.of("English", "Sinhala"), "21000.00", 10, 0, 0),
                guide("Sanjaya Bandara", "SB", "#0f766e", "Nuwara Eliya", List.of("Tea Estates", "Wellness", "Nature"), List.of("English", "Sinhala"), "17100.00", 8, 0, 0),
                guide("Ruwini De Silva", "RD", "#be123c", "Anuradhapura", List.of("Pilgrimage", "History", "Cycling"), List.of("English", "Sinhala"), "16200.00", 7, 0, 0),
                guide("Mohan Raj", "MR", "#0369a1", "Trincomalee", List.of("Snorkeling", "Temples", "Family Trips"), List.of("English", "Tamil", "Sinhala"), "19200.00", 9, 0, 0),
                guide("Ishara Wijesinghe", "IW", "#4d7c0f", "Polonnaruwa", List.of("Cycling", "Ancient Cities", "Culture"), List.of("English", "Sinhala"), "15900.00", 5, 0, 0)
        );

        syncSeeded(tourGuides, tourGuideRepository.findAll(), TourGuide::getName,
                (existing, seed) -> existing.setPricePerDay(seed.getPricePerDay()), tourGuideRepository::saveAll);
    }

    private void seedVehicles() {
        List<Vehicle> vehicles = List.of(
                vehicle("Toyota Axio Sedan", "Toyota", "Axio", 2021, "Car", 4, "13500.00", "Automatic", "Petrol", "Colombo", "WP CAA-4582"),
                vehicle("Toyota Hiace Van", "Toyota", "Hiace", 2020, "Van", 10, "25500.00", "Manual", "Diesel", "Kandy", "CP CAB-2194"),
                vehicle("Mitsubishi Montero SUV", "Mitsubishi", "Montero", 2019, "SUV", 6, "28500.00", "Automatic", "Diesel", "Ella", "UP CBB-9041"),
                vehicle("Toyota KDH High Roof", "Toyota", "KDH", 2022, "Van", 9, "27000.00", "Automatic", "Diesel", "Colombo", "WP KDH-7721"),
                vehicle("Suzuki Wagon R", "Suzuki", "Wagon R", 2021, "Car", 4, "11400.00", "Automatic", "Hybrid", "Galle", "SP CAR-3348"),
                vehicle("Nissan Caravan", "Nissan", "Caravan", 2019, "Van", 12, "24000.00", "Manual", "Diesel", "Mirissa", "SP VAN-4412"),
                vehicle("Toyota Coaster Bus", "Toyota", "Coaster", 2018, "Minibus", 24, "45000.00", "Manual", "Diesel", "Kandy", "CP BUS-1109"),
                vehicle("Honda Vezel SUV", "Honda", "Vezel", 2022, "SUV", 5, "22500.00", "Automatic", "Hybrid", "Nuwara Eliya", "CP SUV-8722"),
                vehicle("Tuk Tuk City Ride", "Bajaj", "RE", 2020, "Motorbike", 3, "7500.00", "Manual", "Petrol", "Anuradhapura", "NC TUK-5410"),
                vehicle("Luxury Mercedes Vito", "Mercedes-Benz", "Vito", 2021, "Luxury", 7, "54000.00", "Automatic", "Diesel", "Colombo", "WP VIP-9001")
        );

        syncSeeded(vehicles, vehicleRepository.findAll(), Vehicle::getPlate,
                (existing, seed) -> existing.setPricePerDay(seed.getPricePerDay()), vehicleRepository::saveAll);
    }

    private Destination destination(String name, String category1, String category2, String category3, String description,
                                    String image, double rating, int reviews, String bestSeason, String highlights) {
        Destination destination = new Destination();
        destination.setName(name);
        destination.setCountry("Sri Lanka");
        destination.setContinent("Asia");
        destination.setCategories(List.of(category1, category2, category3));
        destination.setDescription(description);
        destination.setImage(image);
        destination.setRating(0);
        destination.setReviews(0);
        destination.setBestSeason(bestSeason);
        destination.setHighlights(highlights);
        return destination;
    }

    private TourPackage tourPackage(String name, String category, List<String> destinations, int duration, String price,
                                    int maxGroup, String difficulty, double rating, int reviews, int bookings, String included) {
        TourPackage tourPackage = new TourPackage();
        tourPackage.setName(name);
        tourPackage.setCategory(category);
        tourPackage.setDestinations(destinations);
        tourPackage.setDuration(duration);
        tourPackage.setPrice(new BigDecimal(price));
        tourPackage.setMaxGroup(maxGroup);
        tourPackage.setDifficulty(difficulty);
        tourPackage.setStatus("Active");
        tourPackage.setRating(0);
        tourPackage.setReviews(0);
        tourPackage.setBookings(bookings);
        tourPackage.setImage(packageImage(name));
        tourPackage.setIncluded(included);
        tourPackage.setDescription("Curated Sri Lanka itinerary with Voyara-managed planning, local support, and staff confirmation.");
        return tourPackage;
    }

    private String packageImage(String name) {
        return switch (name) {
            case "Sri Lanka Cultural Triangle" -> "https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1200&q=80";
            case "Ella Highlands Escape" -> "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80";
            case "South Coast Beach Break" -> "https://images.unsplash.com/photo-1586500036706-41963de24d8b?auto=format&fit=crop&w=1200&q=80";
            case "Kandy Heritage Weekend" -> "https://images.unsplash.com/photo-1586089688878-28708d388c43?auto=format&fit=crop&w=1200&q=80";
            case "Yala Safari Adventure" -> "https://images.unsplash.com/photo-1549366021-9f761d450615?auto=format&fit=crop&w=1200&q=80";
            case "Tea Country Wellness Route" -> "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80";
            case "East Coast Snorkel Trip" -> "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80";
            case "Ancient Cities Cycling Tour" -> "https://images.unsplash.com/photo-1588250583782-c1c130badf35?auto=format&fit=crop&w=1200&q=80";
            case "Galle Food and Fort Walk" -> "https://images.unsplash.com/photo-1580889240911-53df20d9bd62?auto=format&fit=crop&w=1200&q=80";
            case "Sri Lanka Family Highlights" -> "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1200&q=80";
            default -> "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80";
        };
    }

    private Accommodation accommodation(String name, String type, String location, String price, int rooms, double rating,
                                        int reviews, List<String> amenities, Long destinationId) {
        Accommodation accommodation = new Accommodation();
        accommodation.setName(name);
        accommodation.setType(type);
        accommodation.setDestinationId(destinationId);
        accommodation.setLocation(location);
        accommodation.setCountry("Sri Lanka");
        accommodation.setPrice(new BigDecimal(price));
        accommodation.setRooms(rooms);
        accommodation.setRating(rating);
        accommodation.setReviews(reviews);
        accommodation.setStatus("Active");
        accommodation.setAmenities(amenities);
        accommodation.setImage("https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80");
        return accommodation;
    }

    private TourGuide guide(String name, String initials, String color, String location, List<String> specialties,
                            List<String> languages, String price, int experience, double rating, int reviews) {
        TourGuide guide = new TourGuide();
        guide.setName(name);
        guide.setInitials(initials);
        guide.setColor(color);
        guide.setLocation(location);
        guide.setCountry("Sri Lanka");
        guide.setSpecialties(specialties);
        guide.setLanguages(languages);
        guide.setRating(rating);
        guide.setReviews(reviews);
        guide.setPricePerDay(new BigDecimal(price));
        guide.setExperience(experience);
        guide.setStatus("Available");
        guide.setBio("Licensed Voyara guide for " + location + " and nearby travel routes.");
        guide.setToursCompleted(80 + reviews);
        return guide;
    }

    private Vehicle vehicle(String name, String brand, String model, int year, String type, int capacity, String price,
                            String transmission, String fuel, String location, String plate) {
        Vehicle vehicle = new Vehicle();
        vehicle.setName(name);
        vehicle.setBrand(brand);
        vehicle.setModel(model);
        vehicle.setYear(year);
        vehicle.setType(type);
        vehicle.setCapacity(capacity);
        vehicle.setPricePerDay(new BigDecimal(price));
        vehicle.setStatus("Available");
        vehicle.setTransmission(transmission);
        vehicle.setFuel(fuel);
        vehicle.setFeatures(List.of("A/C", "Luggage Space", "Driver Available"));
        vehicle.setLocation(location);
        vehicle.setImage("https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=1200&q=80");
        vehicle.setMileage(20000 + capacity * 1500);
        vehicle.setPlate(plate);
        return vehicle;
    }

    private Long destinationId(List<Destination> destinations, String name) {
        return destinations.stream()
                .filter(destination -> destination.getName().equalsIgnoreCase(name))
                .map(Destination::getId)
                .findFirst()
                .orElse(null);
    }

    private <T> void saveMissing(List<T> seeds, List<T> existing, Function<T, String> keyExtractor,
                                 Consumer<List<T>> saveAll) {
        Set<String> existingKeys = existing.stream()
                .map(keyExtractor)
                .map(this::seedKey)
                .collect(Collectors.toSet());
        List<T> missing = seeds.stream()
                .filter(seed -> !existingKeys.contains(seedKey(keyExtractor.apply(seed))))
                .toList();
        if (!missing.isEmpty()) {
            saveAll.accept(missing);
        }
    }

    private <T> void syncSeeded(List<T> seeds, List<T> existing, Function<T, String> keyExtractor,
                                BiConsumer<T, T> updateExisting, Consumer<List<T>> saveAll) {
        Map<String, T> existingByKey = existing.stream()
                .collect(Collectors.toMap(item -> seedKey(keyExtractor.apply(item)), Function.identity(), (first, second) -> first));
        List<T> toSave = seeds.stream()
                .map(seed -> {
                    T existingItem = existingByKey.get(seedKey(keyExtractor.apply(seed)));
                    if (existingItem == null) {
                        return seed;
                    }
                    updateExisting.accept(existingItem, seed);
                    return existingItem;
                })
                .toList();
        if (!toSave.isEmpty()) {
            saveAll.accept(toSave);
        }
    }

    private String seedKey(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
