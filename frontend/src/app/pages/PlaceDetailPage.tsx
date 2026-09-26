import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, CalendarDays, CheckCircle, Clock, CreditCard, HelpCircle, MapPin, ShieldCheck, Tag, Users, Star, Sparkles, SlidersHorizontal } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { destinationsApi, guidesApi, packagesApi, type Destination, type DestinationRecommendation, type GuideRecommendation, type TourPackage, type Route } from "../lib/api";
import { addTripItem } from "../lib/tripPlanner";

type DetailMode = "destination" | "package";

type DetailItem =
  | { mode: "destination"; data: Destination }
  | { mode: "package"; data: TourPackage };

export function DestinationDetailPage() {
  return <PlaceDetailPage mode="destination" />;
}

export function PackageDetailPage() {
  return <PlaceDetailPage mode="package" />;
}

function PlaceDetailPage({ mode }: { mode: DetailMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [item, setItem] = useState<DetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [packageRoutes, setPackageRoutes] = useState<Route[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [guideRecommendations, setGuideRecommendations] = useState<GuideRecommendation[]>([]);
  const [similarDestinations, setSimilarDestinations] = useState<DestinationRecommendation[]>([]);
  const [savedToTrip, setSavedToTrip] = useState(false);
  const isTourist = isAuthenticated && user?.roles.includes("TOURIST");

  useEffect(() => {
    const numericId = Number(id);
    if (!id || Number.isNaN(numericId)) {
      setError("This place could not be found.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    setPackageRoutes([]);
    setGuideRecommendations([]);
    setSimilarDestinations([]);
    setSavedToTrip(false);

    const request = mode === "destination"
      ? destinationsApi.get(numericId).then((data) => ({ mode: "destination" as const, data }))
      : packagesApi.get(numericId).then((data) => ({ mode: "package" as const, data }));

    request
      .then((data) => {
        if (data.mode === "destination") {
          const destination = data.data;
          guidesApi.recommendations({
            location: destination.country,
            specialty: destination.categories?.[0],
          }).then((guides) => { if (!cancelled) setGuideRecommendations(guides); }).catch(() => { if (!cancelled) setGuideRecommendations([]); });
          destinationsApi.similar(destination.id)
            .then((destinations) => { if (!cancelled) setSimilarDestinations(destinations); })
            .catch(() => { if (!cancelled) setSimilarDestinations([]); });
        }
        if (data.mode === "package") {
          setRoutesLoading(true);
          packagesApi.routes(data.data.id)
            .then((routes) => { if (!cancelled) setPackageRoutes(routes); })
            .catch(() => { if (!cancelled) setPackageRoutes([]); })
            .finally(() => { if (!cancelled) setRoutesLoading(false); });
        }
        if (!cancelled) setItem(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "This place could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, mode]);

  const detail = useMemo(() => item ? toDetail(item) : null, [item]);
  const bookingPath = detail && item?.mode === "package"
    ? `/book?packageId=${item.data.id}`
    : detail
      ? `/book?destination=${encodeURIComponent(detail.title)}${item?.mode === "destination" ? `&destinationId=${item.data.id}` : ""}`
      : "/book";
  const loginPath = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          to={mode === "destination" ? "/explore?tab=destinations" : "/explore?tab=tours"}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {mode === "destination" ? "destinations" : "tour packages"}
        </Link>

        {loading && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-500">
            Loading details...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-8">
            <p className="font-bold text-rose-700">Could not load this place</p>
            <p className="mt-1 text-sm text-rose-600">{error}</p>
          </div>
        )}

        {!loading && detail && (
          <article className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm">
            <div className="relative min-h-[420px] overflow-hidden md:min-h-[500px]">
              <img
                src={detail.image || "https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=1200"}
                alt={detail.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0.08) 58%, rgba(0,0,0,0.18))" }} />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-10">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide backdrop-blur">
                    {detail.typeLabel}
                  </span>
                  {detail.status && (
                    <span className="rounded-full bg-emerald-500 px-3 py-1 text-xs font-bold text-white">
                      {detail.status}
                    </span>
                  )}
                </div>
                <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">{detail.title}</h1>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/90">
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {detail.location}</span>
                  {item?.mode === "package" && <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> {detail.durationLabel}</span>}
                  {item?.mode === "package" && detail.priceLabel && <span className="font-semibold">{detail.priceLabel}</span>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 p-5 sm:p-6 md:grid-cols-[1fr_340px] md:p-8">
              <section>
                <div className="mb-6 flex flex-wrap gap-2">
                  {detail.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mb-8 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">Location</p>
                    <p className="mt-1 text-sm font-bold text-gray-800">{detail.location}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{item?.mode === "package" ? "Duration" : "Season"}</p>
                    <p className="mt-1 text-sm font-bold text-gray-800">{item?.mode === "package" ? detail.durationLabel : detail.seasonLabel}</p>
                  </div>
                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">{item?.mode === "package" ? "Group size" : "Travel styles"}</p>
                    <p className="mt-1 text-sm font-bold text-gray-800">{item?.mode === "package" ? detail.groupLabel : `${detail.tags.length || 0} categories`}</p>
                  </div>
                </div>

                {item?.mode === "destination" && (
                  <div className="mb-8 rounded-2xl border border-rose-100 bg-rose-50/60 p-5">
                    <div className="flex items-start gap-3">
                      <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                      <div className="w-full">
                        <h2 className="text-lg font-bold text-gray-900">Perfect for</h2>
                        <p className="mt-1 text-sm text-gray-600">
                          A quick travel-style guide based on this destination's existing categories and travel data.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {getTravelSignals(item.data).map((signal) => (
                            <span key={signal} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
                              {signal}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {item?.mode === "destination" && similarDestinations.length > 0 && (
                  <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">You may also like</h2>
                        <p className="mt-1 text-sm text-gray-500">Destinations with similar travel styles and regional characteristics.</p>
                      </div>
                      <Link to="/explore?tab=destinations" className="hidden text-sm font-semibold text-rose-600 hover:text-rose-700 sm:inline">
                        Explore all
                      </Link>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {similarDestinations.slice(0, 3).map(({ destination, suitabilityScore, reasons }) => (
                        <Link
                          key={destination.id}
                          to={`/destinations/${destination.id}`}
                          className="group overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 transition hover:-translate-y-0.5 hover:border-gray-300 hover:bg-white"
                        >
                          <div className="h-36 overflow-hidden bg-gray-100">
                            <img
                              src={destination.image || "https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=600"}
                              alt={destination.name}
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          </div>
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-bold text-gray-900">{destination.name}</p>
                                <p className="mt-1 text-xs text-gray-500">{destination.country}</p>
                              </div>
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">{suitabilityScore}% match</span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {reasons.slice(0, 2).map((reason) => (
                                <span key={reason} className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-gray-600">{reason}</span>
                              ))}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {item?.mode === "destination" && guideRecommendations.length > 0 && (
                  <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Guides that may suit this trip</h2>
                        <p className="mt-1 text-sm text-gray-500">Availability-aware matches based on this destination and its categories.</p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {guideRecommendations.slice(0, 4).map(({ guide, suitabilityScore, reasons }) => (
                        <div key={guide.id} className="rounded-xl bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-gray-900">{guide.name}</p>
                              <p className="mt-1 text-xs text-gray-500">{guide.location}{guide.country ? `, ${guide.country}` : ""}</p>
                            </div>
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{suitabilityScore}% fit</span>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {reasons.slice(0, 3).map((reason) => (
                              <span key={reason} className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600">{reason}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {item?.mode === "package" && (
                  <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                    <div className="flex items-start gap-3">
                      <SlidersHorizontal className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Package fit</h2>
                        <p className="mt-1 text-sm text-gray-600">A quick guide to who this package may suit, using its existing package information.</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {getPackageSignals(item.data).map((signal) => (
                            <span key={signal} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">{signal}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <h2 className="text-xl font-bold text-gray-900">About this experience</h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">{detail.description}</p>

                {detail.included.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-xl font-bold text-gray-900">Included</h2>
                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {detail.included.map((value) => (
                        <div key={value} className="flex items-start gap-2 rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {item?.mode === "package" && (
                  <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <h2 className="text-xl font-bold text-gray-900">Routes included in this package</h2>
                    {routesLoading && <p className="mt-3 text-sm text-gray-500">Loading route details...</p>}
                    {!routesLoading && packageRoutes.length === 0 && <p className="mt-3 text-sm text-gray-500">No active route details are linked to this package's destinations yet.</p>}
                    {!routesLoading && packageRoutes.length > 0 && (
                      <div className="mt-5 space-y-3">
                        {packageRoutes.map((route) => (
                          <div key={route.id} className="rounded-xl bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="font-semibold text-gray-900">{route.routeName}</p>
                              <span className="text-xs font-semibold text-gray-500">{route.distanceKm ? `${route.distanceKm} km` : "Distance not specified"}</span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600">{route.startLocation} → {route.endLocation}</p>
                            {route.estimatedDuration && <p className="mt-1 text-xs text-gray-500">Estimated duration: {route.estimatedDuration} minutes</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {item?.mode === "package" && (
                  <div className="mt-8 rounded-2xl border border-rose-100 bg-rose-50 p-5">
                    <div className="flex items-start gap-3">
                      <Star className="mt-0.5 h-5 w-5 text-rose-500" />
                      <div>
                        <h2 className="text-lg font-bold text-gray-900">Plan this package</h2>
                        <p className="mt-1 text-sm leading-6 text-gray-600">
                          Select your dates, group size, guide, accommodation, and vehicle during booking. Voyara validates availability before confirming the request.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  <h2 className="text-xl font-bold text-gray-900">How booking works</h2>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {[
                      { icon: CalendarDays, title: "Request dates", text: "Choose your travel dates and group size." },
                      { icon: ShieldCheck, title: "Availability checked", text: "Voyara checks guide, stay, and transport availability when you book." },
                      { icon: CreditCard, title: "Pay when ready", text: "Payment opens as soon as the booking is created." },
                    ].map(({ icon: Icon, title, text }) => (
                      <div key={title} className="rounded-2xl bg-gray-50 p-4">
                        <Icon className="h-5 w-5 text-rose-500" />
                        <p className="mt-3 text-sm font-bold text-gray-900">{title}</p>
                        <p className="mt-1 text-xs leading-5 text-gray-500">{text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <aside className="h-fit rounded-[1.5rem] border border-gray-200 bg-gray-50 p-5 shadow-sm md:sticky md:top-24">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400">Your trip</p>
                    <h2 className="mt-1 text-xl font-extrabold text-gray-900">Plan this {item?.mode === "package" ? "package" : "destination"}</h2>
                  </div>
                  {item?.mode === "package" && <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-700">{detail.priceLabel}</span>}
                </div>
                <div className="mt-4 space-y-3">
                  {detail.facts.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-start gap-3 rounded-xl bg-white p-3">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                        <p className="mt-0.5 text-sm font-semibold text-gray-800">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {isTourist && (
                  <>
                    <button
                      onClick={() => {
                        if (!item) return;
                        const next = addTripItem({
                          type: item.mode,
                          id: item.data.id,
                          title: detail.title,
                          subtitle: detail.location,
                          destination: detail.location,
                          day: 1,
                        });
                        setSavedToTrip(next.some((tripItem) => tripItem.type === item.mode && tripItem.id === item.data.id));
                      }}
                      className="mt-5 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-100"
                    >
                      {savedToTrip ? "Added to My Trip" : "Add to My Trip"}
                    </button>
                    {item.mode === "package" && (
                      <Link
                        to={`/tourist/packages/${item.data.id}/customize`}
                        className="mt-3 flex w-full items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        Customize this package
                      </Link>
                    )}
                    <button
                      onClick={() => navigate(bookingPath)}
                      className="mt-3 w-full rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:opacity-90"
                      style={{ background: "linear-gradient(135deg, #FF385C, #E31C5F)" }}
                    >
                      Book this trip
                    </button>
                  </>
                )}
                {!isAuthenticated && (
                  <Link
                    to={loginPath}
                    className="mt-5 flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ background: "linear-gradient(135deg, #FF385C, #E31C5F)" }}
                  >
                    Log in to book
                  </Link>
                )}
                {!isTourist && isAuthenticated && (
                  <div className="mt-5 rounded-xl bg-white p-4 text-sm text-gray-500">
                    Tourist accounts can create trip bookings from this page.
                  </div>
                )}
                <Link to="/help" className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100">
                  <HelpCircle className="h-4 w-4" /> Need help?
                </Link>
                <p className="mt-4 text-center text-[11px] leading-5 text-gray-400">
                  {item?.mode === "package" ? "Your final booking total is calculated by the booking service after availability is checked." : "Choose your dates and trip details after selecting this destination."}
                </p>
              </aside>
            </div>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}

function toDetail(item: DetailItem) {
  if (item.mode === "destination") {
    const data = item.data;
    return {
      typeLabel: "Destination",
      title: data.name,
      location: [data.name, data.country].filter(Boolean).join(", "),
      image: data.image,
      status: data.status,
      tags: data.categories || [],
      description: data.description || "Explore this Sri Lankan destination with Voyara's curated travel planning details.",
      included: splitList(data.highlights),
      seasonLabel: data.bestSeason || "Year round",
      durationLabel: "",
      groupLabel: "",
      priceLabel: "",
      facts: [
        { icon: MapPin, label: "Country", value: data.country || "Sri Lanka" },
        { icon: Tag, label: "Best season", value: data.bestSeason || "Year round" },
      ],
    };
  }

  const data = item.data;
  return {
    typeLabel: "Tour Package",
    title: data.name,
    location: data.destinations.join(", "),
    image: data.image,
    status: data.status,
    tags: [data.category, data.difficulty].filter(Boolean),
    description: data.description || "Review this package's travel details before deciding whether to book.",
    included: splitList(data.included),
    seasonLabel: "",
    durationLabel: `${Number(data.duration || 0)} day${Number(data.duration || 0) === 1 ? "" : "s"}`,
    groupLabel: `Up to ${Number(data.maxGroup || 0)} people`,
    priceLabel: `LKR ${Number(data.price || 0).toLocaleString()} / person`,
    facts: [
      { icon: Clock, label: "Duration", value: `${Number(data.duration || 0)} day${Number(data.duration || 0) === 1 ? "" : "s"}` },
      { icon: Users, label: "Group size", value: `Up to ${Number(data.maxGroup || 0)} people` },
      { icon: Tag, label: "Price", value: `LKR ${Number(data.price || 0).toLocaleString()} / person` },
      { icon: CalendarDays, label: "Difficulty", value: data.difficulty || "Easy" },
    ],
  };
}

function getPackageSignals(pkg: TourPackage) {
  const signals: string[] = [];
  const category = (pkg.category || "").toLowerCase();
  const difficulty = (pkg.difficulty || "").toLowerCase();

  if (category.includes("family")) signals.push("Family-friendly");
  if (category.includes("adventure") || difficulty === "challenging") signals.push("Adventure seekers");
  if (category.includes("culture") || category.includes("heritage")) signals.push("Culture & heritage");
  if (category.includes("nature") || category.includes("wildlife")) signals.push("Nature lovers");
  if (difficulty === "easy") signals.push("Relaxed pace");
  if (Number(pkg.maxGroup) >= 6) signals.push("Suitable for groups");
  else if (Number(pkg.maxGroup) > 0 && Number(pkg.maxGroup) <= 2) signals.push("Small-group experience");

  if (signals.length === 0) signals.push("Flexible travel");
  return Array.from(new Set(signals)).slice(0, 4);
}

function getTravelSignals(destination: Destination) {
  const values = new Set((destination.categories || []).map((value) => value.toLowerCase()));
  const signals: string[] = [];

  const add = (label: string, matches: string[]) => {
    if (matches.some((match) => Array.from(values).some((value) => value.includes(match)))) {
      signals.push(label);
    }
  };

  add("Nature & scenery", ["nature", "wildlife", "mountain", "beach", "water", "scenic"]);
  add("Adventure", ["adventure", "hiking", "trek", "safari", "water sport", "surf"]);
  add("Culture & heritage", ["culture", "heritage", "history", "temple", "spiritual", "architecture"]);
  add("Food experiences", ["food", "culinary", "cuisine"]);
  add("Photography", ["photography", "photo", "scenic"]);
  add("Relaxation", ["wellness", "relax", "beach", "spa"]);

  if (signals.length === 0) signals.push("Flexible travel");
  return Array.from(new Set(signals)).slice(0, 4);
}

function splitList(value?: string) {
  if (!value) return [];
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
