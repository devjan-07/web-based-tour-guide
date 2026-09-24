import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Link, useNavigate } from "react-router";
import {
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  Car,
  Compass,
  Heart,
  MapPin,
  Quote,
  Search,
  Star,
  Trees,
  Waves,
  Landmark,
  Mountain,
  UtensilsCrossed,
  Users,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { Footer } from "../components/Footer";
import { VoyAI } from "../components/VoyAI";
import { useAuth } from "../context/AuthContext";
import {
  accommodationSearchApi,
  destinationsApi,
  packagesApi,
  publicVehiclesApi,
  reviewsApi,
  type Accommodation,
  type Destination,
  type Review,
  type TourPackage,
  type Vehicle,
} from "../lib/api";

const categoryTagMap: Record<string, string[]> = {
  Beaches: ["Beach", "Beaches"],
  Cultural: ["Cultural", "Culture", "History", "Spiritual", "Heritage"],
  Hiking: ["Hiking", "Trek", "Trekking", "Adventure"],
  "Food & Drink": ["Food", "Culinary", "Food & Drink"],
  Nature: ["Nature", "Wildlife", "Forest"],
  Wildlife: ["Wildlife", "Nature"],
  Wellness: ["Wellness", "Spa"],
};

const journeyTypes = [
  { label: "Adventure", category: "Hiking", icon: Mountain, image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=85" },
  { label: "Culture", category: "Cultural", icon: Landmark, image: "https://images.unsplash.com/photo-1588598198321-9735fd524f31?auto=format&fit=crop&w=900&q=85" },
  { label: "Beach Escape", category: "Beaches", icon: Waves, image: "https://images.unsplash.com/photo-1544550285-f813152fb2fd?auto=format&fit=crop&w=900&q=85" },
  { label: "Wildlife", category: "Wildlife", icon: Trees, image: "https://images.unsplash.com/photo-1535338454770-8be927b5a00b?auto=format&fit=crop&w=900&q=85" },
  { label: "Food & Flavours", category: "Food & Drink", icon: UtensilsCrossed, image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=85" },
];

function formatLkr(value: number) {
  return `රු${Number(value || 0).toLocaleString()}`;
}

function imageOrFallback(image: string | undefined, fallback: string) {
  return image || fallback;
}

function normaliseReviews(value: Review[] | { reviews: Review[] } | unknown): Review[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object" && "reviews" in value && Array.isArray((value as { reviews: Review[] }).reviews)) {
    return (value as { reviews: Review[] }).reviews;
  }
  return [];
}

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [tourPackages, setTourPackages] = useState<TourPackage[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [travellerReviews, setTravellerReviews] = useState<Review[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    Promise.all([
      destinationsApi.list(),
      packagesApi.list(),
      accommodationSearchApi.list(),
      publicVehiclesApi.list(),
    ])
      .then(([destinationData, packageData, accommodationData, vehicleData]) => {
        setDestinations(destinationData);
        setTourPackages(packageData);
        setAccommodations(accommodationData);
        setVehicles(vehicleData);
      })
      .catch((error) => console.error("Failed to load landing page data", error));
  }, []);

  useEffect(() => {
    if (accommodations.length === 0) return;

    const candidates = accommodations
      .filter((item) => item.status === "Active")
      .slice(0, 4);

    Promise.all(
      candidates.map((item) =>
        reviewsApi
          .byTarget("ACCOMMODATION", item.id)
          .then((result) => normaliseReviews(result))
          .catch(() => [])
      )
    ).then((groups) => {
      const realReviews = groups
        .flat()
        .filter((review) => Boolean(review.comment?.trim()))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3);

      setTravellerReviews(realReviews);
    });
  }, [accommodations]);

  const localDestinations = useMemo(
    () => destinations.filter((d) => d.country?.trim().toLowerCase() === "sri lanka"),
    [destinations]
  );

  const localNames = useMemo(
    () => new Set(localDestinations.map((d) => d.name.trim().toLowerCase())),
    [localDestinations]
  );

  const localPackages = useMemo(
    () =>
      tourPackages.filter((tour) =>
        tour.destinations.some(
          (destination) =>
            localNames.has(destination.trim().toLowerCase()) ||
            destination.toLowerCase().includes("sri lanka")
        )
      ),
    [tourPackages, localNames]
  );

  const activeAccommodations = useMemo(
    () =>
      accommodations
        .filter(
          (item) =>
            item.status === "Active" &&
            item.country?.trim().toLowerCase() === "sri lanka"
        )
        .slice(0, 4),
    [accommodations]
  );

  const availableVehicles = useMemo(
    () => vehicles.filter((item) => item.status === "Available").slice(0, 4),
    [vehicles]
  );

  const filteredDestinations = useMemo(() => {
    let result = localDestinations;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((destination) =>
        [
          destination.name,
          destination.country,
          ...(destination.categories || []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }

    if (activeCategory) {
      const allowed = categoryTagMap[activeCategory] || [activeCategory];
      result = result.filter((destination) =>
        (destination.categories || []).some((tag) =>
          allowed.some((item) => tag.toLowerCase().includes(item.toLowerCase()))
        )
      );
    }

    return result;
  }, [localDestinations, searchQuery, activeCategory]);

  const filteredPackages = useMemo(() => {
    let result = localPackages;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((tour) =>
        [tour.name, ...(tour.destinations || []), tour.category || ""]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }

    return result;
  }, [localPackages, searchQuery]);

  const featuredDestinations = filteredDestinations.slice(0, 4);
  const featuredPackages = filteredPackages.slice(0, 3);

  const isFiltered = Boolean(searchQuery || activeCategory);
  const isTourist = isAuthenticated && user?.roles.includes("TOURIST");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveCategory("");
    window.setTimeout(() => {
      document.getElementById("destinations-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const chooseJourney = (category: string) => {
    setActiveCategory(category);
    setSearchQuery("");
    window.setTimeout(() => {
      document.getElementById("destinations-section")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setActiveCategory("");
  };

  const bookingLink = (target: string) =>
    isTourist ? target : `/login?redirect=${encodeURIComponent(target)}`;

  return (
    <div className="min-h-screen bg-[#f7f5ef] text-[#17372f]">
      <Navbar />
      <Hero
        onSearch={handleSearch}
        onClear={clearFilters}
        hasActiveFilter={isFiltered}
        onCategoryChange={chooseJourney}
      />

      {/* 01 — Explore */}
      <section id="destinations-section" className="scroll-mt-24 bg-[#f7f5ef] px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
            >
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-emerald-700">
                Explore
              </p>
              <h2 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.045em] md:text-6xl">
                Explore Sri Lanka
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                From mist-covered mountains to golden coastlines, discover places
                that give your journey a reason to begin.
              </p>
            </motion.div>

            <Link
              to="/explore"
              className="inline-flex items-center gap-2 text-sm font-bold text-emerald-800 transition hover:gap-3"
            >
              View all destinations <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {isFiltered && (
            <div className="mb-8 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-100 bg-white/75 p-4 shadow-sm">
              <Search className="h-4 w-4 text-emerald-700" />
              <span className="text-sm text-slate-600">
                {searchQuery
                  ? <>Showing results for <strong>"{searchQuery}"</strong></>
                  : <>Showing <strong>{activeCategory}</strong> journeys</>}
              </span>
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100"
              >
                Clear
              </button>
            </div>
          )}

          {featuredDestinations.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {featuredDestinations.map((destination, index) => (
                <motion.button
                  key={destination.id}
                  type="button"
                  onClick={() => navigate(`/destinations/${destination.id}`)}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.55, delay: index * 0.06 }}
                  className="group relative overflow-hidden rounded-[26px] text-left shadow-sm"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-slate-200">
                    <img
                      src={imageOrFallback(
                        destination.image,
                        "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=85"
                      )}
                      alt={destination.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">
                      {destination.country}
                    </p>
                    <div className="mt-1 flex items-end justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-semibold tracking-tight">
                          {destination.name}
                        </h3>
                        <p className="mt-1 text-xs text-white/70">
                          {(destination.categories || []).slice(0, 3).join(" · ") || "Discover the destination"}
                        </p>
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-900 transition duration-300 group-hover:-rotate-6">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="rounded-[26px] border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
              No destinations match this search yet.
            </div>
          )}
        </div>
      </section>

      {/* 02 — Choose your journey */}
      <section className="overflow-hidden bg-[#0d3b32] px-5 py-20 text-white sm:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-emerald-300">
                Choose your journey
              </p>
              <h2 className="text-4xl font-semibold leading-[1.02] tracking-[-0.04em] md:text-6xl">
                What kind of traveller are you?
              </h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-emerald-50/70 md:text-base">
                Start with the feeling you want from your trip. Voyara will take
                you from inspiration to places, experiences and bookable journeys.
              </p>
            </div>

            <div className="flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {journeyTypes.map((journey, index) => {
                const Icon = journey.icon;
                return (
                  <motion.button
                    key={journey.label}
                    type="button"
                    onClick={() => chooseJourney(journey.category)}
                    initial={{ opacity: 0, x: 24 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.06 }}
                    className="group relative min-w-[150px] snap-start overflow-hidden rounded-[22px] text-left sm:min-w-[175px]"
                  >
                    <div className="aspect-[3/4] overflow-hidden">
                      <img
                        src={journey.image}
                        alt={journey.label}
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <Icon className="mb-3 h-5 w-5 text-emerald-200" />
                      <h3 className="font-semibold">{journey.label}</h3>
                      <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-white/65">
                        Explore <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 03 — Curated packages */}
      <section id="journeys-section" className="scroll-mt-24 bg-[#f7f5ef] px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-emerald-700">
                Featured experiences
              </p>
              <h2 className="text-4xl font-semibold leading-[1.02] tracking-[-0.045em] md:text-6xl">
                Journeys worth taking
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                Real tour packages from Voyara, ready to explore when you are.
              </p>
            </div>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 rounded-full bg-[#0d3b32] px-5 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5"
            >
              View all journeys <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {featuredPackages.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {featuredPackages.map((tour, index) => (
                <motion.article
                  key={tour.id}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.55, delay: index * 0.07 }}
                  onClick={() => navigate(`/packages/${tour.id}`)}
                  className="group cursor-pointer overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img
                      src={imageOrFallback(
                        tour.image,
                        "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?auto=format&fit=crop&w=1000&q=85"
                      )}
                      alt={tour.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                    <span className="absolute left-4 top-4 rounded-full border border-white/25 bg-black/20 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                      {tour.category || "Journey"}
                    </span>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                      {(tour.destinations || []).join(" · ")}
                    </p>
                    <h3 className="mt-2 text-xl font-semibold text-slate-950">
                      {tour.name}
                    </h3>
                    <div className="mt-5 flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs text-slate-400">{tour.duration} days</p>
                        <p className="mt-1 text-lg font-bold text-[#0d3b32]">
                          From {formatLkr(tour.price)}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-bold text-slate-700">
                        Explore <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : (
            <div className="rounded-[26px] border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
              No tour packages are currently available.
            </div>
          )}
        </div>
      </section>

      {/* 04 — Stay + move */}
      <section id="stays-section" className="scroll-mt-24 bg-[#e9e4d7] px-5 py-20 sm:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-emerald-800">
              Build your journey
            </p>
            <h2 className="text-4xl font-semibold leading-tight tracking-[-0.04em] md:text-5xl">
              Everything you need for the journey.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Once you know where you are going, bring the practical pieces
              together — a place to stay and a way to move.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="overflow-hidden rounded-[30px] bg-white shadow-sm">
              <div className="relative aspect-[16/8] overflow-hidden">
                <img
                  src={imageOrFallback(
                    activeAccommodations[0]?.image,
                    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85"
                  )}
                  alt="Accommodation"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                <div className="absolute bottom-5 left-5 text-white">
                  <BedDouble className="mb-2 h-6 w-6" />
                  <h3 className="text-2xl font-semibold">Stay your way.</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm leading-6 text-slate-600">
                  Discover available stays across Sri Lanka, from places to slow
                  down after a long day to bases for your next adventure.
                </p>
                {activeAccommodations.length > 0 && (
                  <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
                    {activeAccommodations.slice(0, 3).map((item) => (
                      <div key={item.id} className="min-w-[190px] rounded-2xl bg-[#f7f5ef] p-3">
                        <p className="truncate text-sm font-bold text-slate-900">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{item.location}</p>
                        <p className="mt-2 text-sm font-bold text-emerald-800">
                          {formatLkr(item.price)} <span className="font-normal text-slate-400">/night</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <Link
                  to="/explore"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0d3b32] px-5 py-3 text-sm font-bold text-white"
                >
                  Explore stays <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div id="transport-section" className="scroll-mt-24 overflow-hidden rounded-[30px] bg-white shadow-sm">
              <div className="relative aspect-[16/8] overflow-hidden">
                <img
                  src={imageOrFallback(
                    availableVehicles[0]?.image,
                    "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=1200&q=85"
                  )}
                  alt="Vehicle and road"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                <div className="absolute bottom-5 left-5 text-white">
                  <Car className="mb-2 h-6 w-6" />
                  <h3 className="text-2xl font-semibold">Move freely.</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm leading-6 text-slate-600">
                  Choose from available vehicles and build transport into the
                  same journey instead of arranging it somewhere else.
                </p>
                {availableVehicles.length > 0 && (
                  <div className="mt-5 flex gap-3 overflow-x-auto pb-1">
                    {availableVehicles.slice(0, 3).map((item) => (
                      <div key={item.id} className="min-w-[190px] rounded-2xl bg-[#f7f5ef] p-3">
                        <p className="truncate text-sm font-bold text-slate-900">{item.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {[item.brand, item.model, item.location].filter(Boolean).join(" · ")}
                        </p>
                        <p className="mt-2 text-sm font-bold text-emerald-800">
                          {formatLkr(item.pricePerDay)} <span className="font-normal text-slate-400">/day</span>
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <Link
                  to="/explore"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#0d3b32] px-5 py-3 text-sm font-bold text-white"
                >
                  Explore transport <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 05 — Why Voyara */}
      <section className="overflow-hidden bg-[#0d3b32] px-5 py-20 text-white sm:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-emerald-300">
                Why Voyara
              </p>
              <h2 className="text-4xl font-semibold leading-[1.02] tracking-[-0.04em] md:text-6xl">
                Travel should feel simple.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-emerald-50/70">
                Voyara connects the parts of a trip that travellers normally
                have to search for separately.
              </p>
            </div>

            <div className="grid gap-0 divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {[
                {
                  icon: Compass,
                  title: "Discover",
                  text: "Find destinations, routes and experiences in one place.",
                },
                {
                  icon: Heart,
                  title: "Build",
                  text: "Bring packages, guides, stays and transport into your plan.",
                },
                {
                  icon: MapPin,
                  title: "Experience",
                  text: "Book and manage your journey from one connected platform.",
                },
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="px-0 py-7 sm:px-7 sm:py-2">
                  <Icon className="mb-5 h-7 w-7 text-emerald-300" />
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-emerald-50/65">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 06 — Traveller stories */}
      <section className="bg-[#f7f5ef] px-5 py-20 sm:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-emerald-700">
                Traveller stories
              </p>
              <h2 className="text-4xl font-semibold leading-[1.02] tracking-[-0.04em] md:text-5xl">
                Journeys told by the people who took them.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-500">
              Real feedback from the platform appears here as travellers share
              their experiences.
            </p>
          </div>

          {travellerReviews.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-3">
              {travellerReviews.map((review) => (
                <article key={review.id} className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
                  <Quote className="h-7 w-7 text-emerald-700/40" />
                  <p className="mt-5 text-base leading-7 text-slate-700">
                    “{review.comment}”
                  </p>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Voyara traveller</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: review.rating }).map((_, index) => (
                        <Star key={index} className="h-3.5 w-3.5 fill-emerald-600 text-emerald-600" />
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-3">
              {localDestinations.slice(0, 3).map((destination) => (
                <button
                  key={destination.id}
                  type="button"
                  onClick={() => navigate(`/destinations/${destination.id}`)}
                  className="group relative overflow-hidden rounded-[26px] text-left"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={imageOrFallback(
                        destination.image,
                        "https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=85"
                      )}
                      alt={destination.name}
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                  <div className="absolute bottom-0 p-5 text-white">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/65">Discover</p>
                    <h3 className="mt-1 text-2xl font-semibold">{destination.name}</h3>
                    <p className="mt-2 text-sm text-white/70">
                      {destination.description || "Open the destination and start building your journey."}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 07 — Final CTA */}
      <section className="relative overflow-hidden bg-slate-950 px-5 py-28 text-white sm:px-8 md:py-36">
        <div className="absolute inset-0">
          <img
            src={imageOrFallback(
              localDestinations[0]?.image,
              "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=85"
            )}
            alt=""
            className="h-full w-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/35" />
        </div>

        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-emerald-200">
              Your next journey
            </p>
            <h2 className="text-5xl font-semibold leading-[0.95] tracking-[-0.045em] md:text-7xl">
              Your next journey starts here.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/75">
              Choose a place. Find an experience. Build your journey.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/explore"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-slate-900 transition hover:-translate-y-0.5"
              >
                Start exploring <ArrowUpRight className="h-4 w-4" />
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/login?mode=signup"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/15"
                >
                  Create an account
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
      {isAuthenticated && <VoyAI />}
    </div>
  );
}
