import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, BedDouble, Car, Compass, MapPin, Search, Star, Users, SlidersHorizontal } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { destinationsApi, packagesApi, accommodationSearchApi, publicVehiclesApi, type Destination, type TourPackage, type Accommodation, type Vehicle } from "../lib/api";

type Tab = "destinations" | "tours" | "stays" | "transport";

export default function ExplorePage() {
  const [tab, setTab] = useState<Tab>("destinations");
  const [query, setQuery] = useState("");
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [stays, setStays] = useState<Accommodation[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([destinationsApi.list(), packagesApi.list(), accommodationSearchApi.list(), publicVehiclesApi.list()])
      .then(([d, p, s, v]) => {
        setDestinations(d.filter(item => item.status !== "Hidden"));
        setPackages(p.filter(item => item.status === "Active"));
        setStays(s.filter(item => item.status === "Active"));
        setVehicles(v.filter(item => item.status === "Available"));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const q = query.trim().toLowerCase();
  const filteredDestinations = useMemo(() => destinations.filter(item =>
    !q || [item.name, item.country, item.continent, ...(item.categories || [])].join(" ").toLowerCase().includes(q)
  ), [destinations, q]);
  const filteredPackages = useMemo(() => packages.filter(item =>
    !q || [item.name, item.category, ...(item.destinations || [])].join(" ").toLowerCase().includes(q)
  ), [packages, q]);
  const filteredStays = useMemo(() => stays.filter(item =>
    !q || [item.name, item.type, item.location, item.country, ...(item.amenities || [])].join(" ").toLowerCase().includes(q)
  ), [stays, q]);
  const filteredVehicles = useMemo(() => vehicles.filter(item =>
    !q || [item.name, item.brand, item.model, item.type, item.location, ...(item.features || [])].join(" ").toLowerCase().includes(q)
  ), [vehicles, q]);

  const tabs = [
    { id: "destinations" as const, label: "Destinations", icon: Compass, count: filteredDestinations.length },
    { id: "tours" as const, label: "Tours", icon: MapPin, count: filteredPackages.length },
    { id: "stays" as const, label: "Stays", icon: BedDouble, count: filteredStays.length },
    { id: "transport" as const, label: "Transport", icon: Car, count: filteredVehicles.length },
  ];

  return <div className="min-h-screen bg-[#f8fafc]">
    <Navbar />
    <header className="relative overflow-hidden bg-[#062a56]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,56,92,0.28),transparent_40%)]" />
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 md:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-rose-300">Explore Voyara</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight text-white md:text-6xl">Build a Sri Lanka trip that feels like yours.</h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/75 md:text-lg">Discover places, curated tours, stays and transport in one travel marketplace. Compare first, save your favourites, then book when you are ready.</p>
        <div className="mt-8 flex max-w-3xl items-center gap-3 rounded-2xl bg-white p-2 shadow-2xl">
          <Search className="ml-3 h-5 w-5 text-rose-500" />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search destinations, tours, stays or transport..." className="min-w-0 flex-1 bg-transparent px-1 py-3 text-sm text-gray-900 outline-none" aria-label="Search travel options" />
          {query && <button onClick={() => setQuery("")} className="rounded-xl px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100">Clear</button>}
        </div>
      </div>
    </header>

    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="sticky top-[72px] z-30 -mx-4 mb-8 border-y border-gray-200/80 bg-[#f8fafc]/95 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex items-center gap-3 overflow-x-auto pb-0.5">
          <div className="hidden shrink-0 items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 md:flex">
            <SlidersHorizontal className="h-4 w-4" /> Browse
          </div>
          <div className="grid min-w-max grid-cols-4 gap-2 md:flex">
            {tabs.map(({ id, label, icon: Icon, count }) => (
              <button key={id} onClick={() => setTab(id)} className={`flex min-w-[120px] items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition duration-200 ${
                tab === id ? "border-rose-200 bg-rose-50 text-rose-700 shadow-sm" : "border-transparent bg-white/70 text-gray-600 hover:border-gray-200 hover:bg-white"
              }`}>
                <Icon className="h-4 w-4 shrink-0" />
                <span className="text-xs font-bold sm:text-sm">{label}</span>
                <span className="ml-auto rounded-full bg-white px-1.5 py-0.5 text-[10px] font-bold text-gray-400">{count}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {tabs.map(({ id, label, icon: Icon, count }) => <button key={id} onClick={() => setTab(id)} className={`rounded-2xl border p-4 text-left transition-all duration-200 ${tab === id ? "border-gray-900 bg-gray-900 shadow-lg" : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"}`}>
          <Icon className={`h-5 w-5 ${tab === id ? "text-rose-300" : "text-gray-500"}`} />
          <p className={`mt-3 text-sm font-extrabold ${tab === id ? "text-white" : "text-gray-900"}`}>{label}</p>
          <p className={`mt-0.5 text-xs ${tab === id ? "text-white/60" : "text-gray-500"}`}>{count} available</p>
        </button>)}
      </div>

      <section className="mt-10">
        {loading ? <div className="rounded-3xl bg-white p-12 text-center text-sm text-gray-400">Preparing your travel options...</div> :
        tab === "destinations" ? <DestinationGrid items={filteredDestinations} /> :
        tab === "tours" ? <TourGrid items={filteredPackages} /> :
        tab === "stays" ? <StayGrid items={filteredStays} /> :
        <VehicleGrid items={filteredVehicles} />}
      </section>
    </main>
    <Footer />
  </div>;
}

function SectionHeading({ title, text }: { title: string; text: string }) {
  return <div className="mb-6"><p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500">Explore</p><h2 className="mt-2 text-2xl font-black text-gray-900">{title}</h2><p className="mt-1 text-sm text-gray-500">{text}</p></div>;
}

function DestinationGrid({ items }: { items: Destination[] }) {
  return <><SectionHeading title="Places worth the journey" text="Find your next base, day trip or long-weekend escape." />
    {items.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{items.map(item => <Link key={item.id} to={`/destinations/${item.id}`} className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-56"><img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/70 to-transparent" /><div className="absolute bottom-3 left-4 text-white"><p className="font-extrabold">{item.name}</p><p className="text-xs text-white/80">{item.country}</p></div></div>
      <div className="p-4"><div className="flex flex-wrap gap-1.5">{(item.categories || []).slice(0,3).map(c => <span key={c} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">{c}</span>)}</div><div className="mt-3 flex items-center justify-between text-xs text-gray-500"><span>{item.bestSeason || "Year-round"}</span><span className="inline-flex items-center gap-1 font-bold text-gray-700"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{Number(item.rating || 0).toFixed(1)}</span></div></div>
    </Link>)}</div> : <EmptyState />}</>;
}

function TourGrid({ items }: { items: TourPackage[] }) {
  return <><SectionHeading title="Curated tours" text="Ready-made journeys when you want the important details handled for you." />
    {items.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{items.map(item => <Link key={item.id} to={`/packages/${item.id}`} className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-xl">
      <img src={item.image} alt={item.name} className="h-56 w-full object-cover transition duration-500 group-hover:scale-105" />
      <div className="p-5"><div className="flex items-center justify-between gap-3"><span className="text-xs font-bold uppercase tracking-wider text-rose-500">{item.category}</span><span className="inline-flex items-center gap-1 text-xs font-bold text-gray-600"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{Number(item.rating || 0).toFixed(1)}</span></div><h3 className="mt-2 text-lg font-extrabold text-gray-900">{item.name}</h3><p className="mt-1 line-clamp-2 text-sm text-gray-500">{item.description}</p><div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4"><span className="text-sm text-gray-500">{item.duration} days · up to {item.maxGroup} guests</span><span className="font-black text-gray-900">LKR {Number(item.price || 0).toLocaleString()}</span></div></div>
    </Link>)}</div> : <EmptyState />}</>;
}

function StayGrid({ items }: { items: Accommodation[] }) {
  return <><SectionHeading title="Places to stay" text="Choose a comfortable base that fits the way you travel." />
    {items.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{items.map(item => <article key={item.id} className="group overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-200 transition duration-200 hover:-translate-y-1 hover:shadow-lg"><img src={item.image} alt={item.name} className="h-48 w-full object-cover transition duration-500 group-hover:scale-105" /><div className="p-4"><div className="flex justify-between gap-2"><span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-bold text-gray-600">{item.type}</span><span className="text-xs font-bold text-gray-600">★ {Number(item.rating || 0).toFixed(1)}</span></div><h3 className="mt-3 font-extrabold text-gray-900">{item.name}</h3><p className="mt-1 text-xs text-gray-500">{item.location}, {item.country}</p><p className="mt-4 text-lg font-black text-gray-900">LKR {Number(item.price || 0).toLocaleString()} <span className="text-xs font-medium text-gray-400">/ night</span></p><Link to={`/tourist/accommodations/${item.id}/book`} className="mt-4 flex items-center justify-center rounded-xl bg-[#FF385C] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#e31c5f]">View stay</Link></div></article>)}</div> : <EmptyState />}</>;
}

function VehicleGrid({ items }: { items: Vehicle[] }) {
  return <><SectionHeading title="Move around with ease" text="Browse available vehicles for self-drive or supported travel arrangements." />
    {items.length ? <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">{items.map(item => <article key={item.id} className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-200"><img src={item.image} alt={item.name} className="h-48 w-full object-cover" /><div className="p-4"><p className="text-xs font-bold uppercase tracking-wider text-orange-600">{item.type}</p><h3 className="mt-1 font-extrabold text-gray-900">{item.name}</h3><p className="mt-1 text-xs text-gray-500">{item.brand} {item.model} · {item.capacity} seats</p><p className="mt-4 text-lg font-black text-gray-900">LKR {Number(item.pricePerDay || 0).toLocaleString()} <span className="text-xs font-medium text-gray-400">/ day</span></p><Link to={`/tourist/vehicles/${item.id}/book`} className="mt-4 flex items-center justify-center rounded-xl bg-[#003580] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#062a56]">View vehicle</Link></div></article>)}</div> : <EmptyState />}</>;
}

function EmptyState() {
  return <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-gray-200"><Compass className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-3 font-bold text-gray-900">Nothing matched that search.</p><p className="mt-1 text-sm text-gray-500">Try another destination or travel style.</p></div>;
}