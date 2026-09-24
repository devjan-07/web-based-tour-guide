import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  BedDouble,
  Car,
  Compass,
  Fuel,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Users,
  X,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import {
  accommodationSearchApi,
  destinationsApi,
  packagesApi,
  publicVehiclesApi,
  type Accommodation,
  type Destination,
  type TourPackage,
  type Vehicle,
} from "../lib/api";

const categories = ["All", "Beaches", "Culture", "Nature", "Adventure", "Food", "Wildlife", "Wellness"];

function formatLkr(value: number) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

function matches(value: string | undefined, query: string) {
  return (value || "").toLowerCase().includes(query.trim().toLowerCase());
}

export default function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      destinationsApi.list(),
      packagesApi.list(),
      accommodationSearchApi.list(),
      publicVehiclesApi.list(),
    ])
      .then(([destinationData, packageData, accommodationData, vehicleData]) => {
        setDestinations(destinationData);
        setPackages(packageData);
        setAccommodations(accommodationData);
        setVehicles(vehicleData);
      })
      .finally(() => setLoading(false));
  }, []);

  const sriLankanDestinations = useMemo(
    () => destinations.filter((item) => item.country?.trim().toLowerCase() === "sri lanka"),
    [destinations],
  );

  const destinationNames = useMemo(
    () => new Set(sriLankanDestinations.map((item) => item.name.trim().toLowerCase())),
    [sriLankanDestinations],
  );

  const sriLankanPackages = useMemo(
    () =>
      packages.filter((item) =>
        item.destinations.some(
          (destination) =>
            destinationNames.has(destination.trim().toLowerCase()) ||
            destination.toLowerCase().includes("sri lanka"),
        ),
      ),
    [packages, destinationNames],
  );

  const filteredDestinations = useMemo(
    () =>
      sriLankanDestinations.filter((item) => {
        const textMatch =
          !query ||
          matches(item.name, query) ||
          matches(item.location, query) ||
          matches(item.description, query) ||
          (item.categories || []).some((tag) => matches(tag, query));
        const categoryMatch =
          category === "All" ||
          (item.categories || []).some((tag) =>
            tag.toLowerCase().includes(category.toLowerCase()),
          );
        return textMatch && categoryMatch;
      }),
    [sriLankanDestinations, query, category],
  );

  const filteredPackages = useMemo(
    () =>
      sriLankanPackages.filter((item) => {
        const textMatch =
          !query ||
          matches(item.name, query) ||
          item.destinations.some((destination) => matches(destination, query)) ||
          matches(item.category, query) ||
          matches(item.description, query);
        const categoryMatch =
          category === "All" || matches(item.category, category);
        return textMatch && categoryMatch;
      }),
    [sriLankanPackages, query, category],
  );

  const filteredAccommodations = useMemo(
    () =>
      accommodations.filter((item) => {
        if (item.status !== "Active" || item.country?.trim().toLowerCase() !== "sri lanka") return false;
        const textMatch =
          !query ||
          matches(item.name, query) ||
          matches(item.location, query) ||
          matches(item.type, query) ||
          (item.amenities || []).some((amenity) => matches(amenity, query));
        const categoryMatch =
          category === "All" ||
          category === "Wellness" && (item.amenities || []).some((a) => /spa|wellness/i.test(a));
        return textMatch && categoryMatch;
      }),
    [accommodations, query, category],
  );

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter((item) => {
        if (item.status !== "Available") return false;
        const textMatch =
          !query ||
          matches(item.name, query) ||
          matches(item.brand, query) ||
          matches(item.model, query) ||
          matches(item.type, query) ||
          matches(item.location, query) ||
          (item.features || []).some((feature) => matches(feature, query));
        return textMatch;
      }),
    [vehicles, query],
  );

  const resultCount =
    filteredDestinations.length +
    filteredPackages.length +
    filteredAccommodations.length +
    filteredVehicles.length;

  const updateFilters = (nextQuery: string, nextCategory: string) => {
    setQuery(nextQuery);
    setCategory(nextCategory);
    const next = new URLSearchParams();
    if (nextQuery.trim()) next.set("q", nextQuery.trim());
    if (nextCategory !== "All") next.set("category", nextCategory);
    setSearchParams(next);
  };

  const clear = () => updateFilters("", "All");

  return (
    <div className="min-h-screen bg-[#f7f5ef]">
      <Navbar />

      <header className="relative overflow-hidden bg-[#12372f] pb-14 pt-36 text-white md:pb-20 md:pt-44">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[#d9b77a]/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="max-w-3xl"
          >
            <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-[#d9b77a]">
              <Compass className="h-4 w-4" />
              Explore Sri Lanka
            </p>
            <h1 className="text-5xl font-black tracking-[-0.045em] md:text-7xl">
              Find the place
              <span className="block text-white/45">you will remember.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-white/65 md:text-base">
              Discover real destinations, journeys, places to stay and transport available through Voyara.
            </p>
          </motion.div>

          <motion.form
            onSubmit={(event) => {
              event.preventDefault();
              updateFilters(query, category);
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12 }}
            className="mt-10 flex max-w-4xl flex-col gap-3 rounded-[1.5rem] border border-white/10 bg-white/10 p-3 backdrop-blur-xl md:flex-row"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-xl bg-white px-4 py-3">
              <Search className="h-5 w-5 shrink-0 text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search Galle, Ella, beaches, wildlife..."
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none"
              />
              {query && (
                <button type="button" onClick={() => updateFilters("", category)} className="text-gray-400 hover:text-gray-700">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={category}
              onChange={(event) => updateFilters(query, event.target.value)}
              className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-gray-800 outline-none"
            >
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
            <button
              type="submit"
              className="rounded-xl bg-[#d9b77a] px-6 py-3 text-sm font-black text-[#12372f] transition hover:bg-[#e6ca96]"
            >
              Explore
            </button>
          </motion.form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 md:py-14">
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <SlidersHorizontal className="h-4 w-4 text-emerald-700" />
            {loading ? "Finding experiences..." : `${resultCount} options available`}
          </div>
          {(query || category !== "All") && (
            <button onClick={clear} className="text-sm font-semibold text-gray-600 underline">
              Clear filters
            </button>
          )}
        </div>

        {filteredDestinations.length > 0 && (
          <section className="mb-16">
            <SectionHeading eyebrow="Places" title="Start with a destination" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {filteredDestinations.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.5, delay: index * 0.04 }}
                >
                  <Link to={`/destinations/${item.id}`} className="group block overflow-hidden rounded-[1.5rem] bg-white shadow-sm">
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">{item.country}</p>
                        <h3 className="mt-1 text-xl font-black">{item.name}</h3>
                        <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold opacity-80">Discover <ArrowUpRight className="h-3.5 w-3.5" /></span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {filteredPackages.length > 0 && (
          <section className="mb-16">
            <SectionHeading eyebrow="Journeys" title="Experiences worth building a trip around" />
            <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filteredPackages.map((item) => (
                <Link
                  key={item.id}
                  to={`/packages/${item.id}`}
                  className="group min-w-[82vw] snap-start overflow-hidden rounded-[1.75rem] bg-white shadow-sm sm:min-w-[58vw] lg:min-w-[42vw]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">{item.category || "Journey"}</span>
                        <span className="text-xs font-semibold text-white/70">{item.duration} days</span>
                      </div>
                      <h3 className="mt-4 text-2xl font-black">{item.name}</h3>
                      <div className="mt-4 flex items-end justify-between gap-4">
                        <span className="text-lg font-black">{formatLkr(item.price)} <small className="font-normal text-white/60">/ person</small></span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-900">View journey <ArrowUpRight className="h-3.5 w-3.5" /></span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {filteredAccommodations.length > 0 && (
          <section className="mb-16">
            <SectionHeading eyebrow="Stays" title="A place to slow down" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {filteredAccommodations.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-sm">
                  <div className="relative h-48">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold">{item.type}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-black text-gray-900">{item.name}</h3>
                    <p className="mt-1 text-xs text-gray-500">{item.location}, {item.country}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-black">{formatLkr(item.price)} <small className="font-medium text-gray-400">/night</small></span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold"><Star className="h-3.5 w-3.5 fill-current text-amber-500" />{Number(item.rating || 0).toFixed(1)}</span>
                    </div>
                    <Link to={`/tourist/accommodations/${item.id}/book`} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#12372f] px-4 py-2.5 text-sm font-bold text-white">
                      <BedDouble className="h-4 w-4" /> Book stay
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {filteredVehicles.length > 0 && (
          <section className="mb-16">
            <SectionHeading eyebrow="Transport" title="Move through the island your way" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {filteredVehicles.map((item) => (
                <article key={item.id} className="overflow-hidden rounded-[1.5rem] border border-gray-200 bg-white shadow-sm">
                  <div className="relative h-48">
                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold">{item.type}</span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-black text-gray-900">{item.name}</h3>
                    <p className="mt-1 text-xs text-gray-500">{item.brand} · {item.model} · {item.location}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-black">{formatLkr(item.pricePerDay)} <small className="font-medium text-gray-400">/day</small></span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold"><Users className="h-3.5 w-3.5" />{item.capacity}</span>
                    </div>
                    <div className="mt-3 flex gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1"><Fuel className="h-3.5 w-3.5" />{item.fuel}</span>
                      <span>{item.transmission}</span>
                    </div>
                    <Link to={`/tourist/vehicles/${item.id}/book`} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#12372f] px-4 py-2.5 text-sm font-bold text-white">
                      <Car className="h-4 w-4" /> Book vehicle
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {!loading && resultCount === 0 && (
          <div className="rounded-[2rem] border border-gray-200 bg-white px-6 py-20 text-center">
            <Search className="mx-auto h-10 w-10 text-gray-300" />
            <h2 className="mt-4 text-2xl font-black text-gray-900">Nothing matched that search.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              Try a destination name, experience category or a broader search term.
            </p>
            <button onClick={clear} className="mt-5 rounded-xl bg-[#12372f] px-5 py-2.5 text-sm font-bold text-white">
              Reset explore
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function SectionHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-7">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#b48a43]">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">{title}</h2>
    </div>
  );
}
