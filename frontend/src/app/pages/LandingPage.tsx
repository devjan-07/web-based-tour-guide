import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Search, Sparkles, Star } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { DestinationCard } from "../components/DestinationCard";
import { TourCard } from "../components/TourCard";
import { Footer } from "../components/Footer";
import { VoyAI } from "../components/VoyAI";
import { useAuth } from "../context/AuthContext";
import { destinationsApi, packagesApi, type Destination, type TourPackage } from "../lib/api";

const categoryTagMap: Record<string, string[]> = {
  Beaches: ["Beach", "Beaches"],
  Cultural: ["Cultural", "Culture", "History", "Spiritual", "Heritage"],
  Adventure: ["Adventure", "Hiking", "Trek", "Trekking", "Water", "Surf"],
  "Food & Drink": ["Food", "Culinary", "Food & Drink"],
  Nature: ["Nature", "Wildlife", "Forest", "Scenic"],
};

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [showAllResults, setShowAllResults] = useState(false);

  useEffect(() => {
    Promise.all([destinationsApi.list(), packagesApi.list()])
      .then(([destinationItems, packageItems]) => {
        setDestinations(destinationItems.filter((item) => item.status !== "Hidden"));
        setPackages(packageItems.filter((item) => item.status === "Active"));
      })
      .catch((error) => console.error("Failed to load homepage discovery data", error));
  }, []);

  const sriLankanDestinations = useMemo(() => destinations.filter((item) => item.country?.trim().toLowerCase() === "sri lanka"), [destinations]);
  const localNames = useMemo(() => new Set(sriLankanDestinations.map((item) => item.name.trim().toLowerCase())), [sriLankanDestinations]);
  const sriLankanPackages = useMemo(() => packages.filter((item) => item.destinations?.some((destination) => localNames.has(destination.trim().toLowerCase()) || destination.toLowerCase().includes("sri lanka"))), [localNames, packages]);

  const filteredDestinations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let result = sriLankanDestinations;
    if (query) result = result.filter((item) => [item.name, item.country, ...(item.categories || [])].join(" ").toLowerCase().includes(query));
    if (activeCategory) {
      const allowed = categoryTagMap[activeCategory] || [activeCategory];
      result = result.filter((item) => (item.categories || []).some((tag) => allowed.some((allowedTag) => tag.toLowerCase().includes(allowedTag.toLowerCase()))));
    }
    return result;
  }, [activeCategory, searchQuery, sriLankanDestinations]);

  const filteredPackages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let result = sriLankanPackages;
    if (query) result = result.filter((item) => [item.name, item.category, ...(item.destinations || [])].join(" ").toLowerCase().includes(query));
    if (activeCategory) {
      const allowed = categoryTagMap[activeCategory] || [activeCategory];
      result = result.filter((item) => allowed.some((allowedTag) => item.category?.toLowerCase().includes(allowedTag.toLowerCase())));
    }
    return result;
  }, [activeCategory, searchQuery, sriLankanPackages]);

  const isFiltering = Boolean(searchQuery.trim() || activeCategory);
  const totalResults = filteredDestinations.length + filteredPackages.length;
  const featuredDestinations = sriLankanDestinations.slice().sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)).slice(0, 6);
  const featuredPackages = sriLankanPackages.slice().sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)).slice(0, 3);
  const categories = Array.from(new Set(sriLankanDestinations.flatMap((item) => item.categories || []))).filter(Boolean).slice(0, 10);

  const clearDiscovery = () => { setSearchQuery(""); setActiveCategory(""); setShowAllResults(false); };
  const handleSearch = (query: string) => { setSearchQuery(query); setActiveCategory(""); setShowAllResults(true); };
  const handleCategory = (category: string) => { setActiveCategory(category); setSearchQuery(""); setShowAllResults(true); };
  const scrollToDiscovery = () => document.getElementById("discovery")?.scrollIntoView({ behavior: "smooth" });
  const displayedDestinations = showAllResults ? filteredDestinations : filteredDestinations.slice(0, 4);
  const displayedPackages = showAllResults ? filteredPackages : filteredPackages.slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero
        onSearch={(query) => { handleSearch(query); setTimeout(scrollToDiscovery, 0); }}
        onClear={clearDiscovery}
        hasActiveFilter={isFiltering}
        onCategoryChange={(category) => { handleCategory(category); setTimeout(scrollToDiscovery, 0); }}
      />
      <main>
        {isFiltering ? (
          <section id="discovery" className="scroll-mt-20 border-b border-gray-100 bg-gray-50 px-4 py-10">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500">Search results</p>
                  <h2 className="mt-2 text-2xl font-extrabold text-gray-900 md:text-3xl">{searchQuery ? "Results for “" + searchQuery + "”" : activeCategory + " travel"}</h2>
                  <p className="mt-2 text-sm text-gray-500">{totalResults} {totalResults === 1 ? "result" : "results"} across destinations and tour packages.</p>
                </div>
                <button type="button" onClick={clearDiscovery} className="self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 md:self-auto">Clear search</button>
              </div>
              {totalResults === 0 ? <EmptySearch onClear={clearDiscovery} /> : <div className="mt-8 space-y-12">
                {displayedDestinations.length > 0 && <DiscoveryGroup title="Destinations" actionLabel={filteredDestinations.length > 4 ? "Show all destinations" : undefined} onAction={() => setShowAllResults(true)}><div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">{displayedDestinations.map((item) => <DestinationCard key={item.id} id={item.id} image={item.image} title={item.name} location={[item.name, item.country].filter(Boolean).join(", ")} badge={item.status === "Featured" ? "Featured" : undefined} tags={item.categories || []} onView={(id) => navigate("/destinations/" + id)} />)}</div></DiscoveryGroup>}
                {displayedPackages.length > 0 && <DiscoveryGroup title="Tour packages" actionLabel={filteredPackages.length > 3 ? "Show all packages" : undefined} onAction={() => setShowAllResults(true)}><div className="space-y-5">{displayedPackages.map((item) => <TourCard key={item.id} id={item.id} image={item.image} title={item.name} location={item.destinations.join(", ")} price={item.price || 0} duration={String(item.duration) + " days"} maxGroup={item.maxGroup} badge={item.status === "Active" ? undefined : item.status} category={item.category} rating={item.rating || 0} onView={(id) => navigate("/packages/" + id)} />)}</div></DiscoveryGroup>}
              </div>}
            </div>
          </section>
        ) : (
          <>
            <section id="discovery" className="scroll-mt-20 px-4 py-14 md:py-16">
              <div className="mx-auto max-w-7xl">
                <SectionHeading eyebrow="Explore Sri Lanka" title="Start with a place" description="Browse destinations by the kind of trip you want to have." action={<Link to="/explore" className="hidden items-center gap-2 text-sm font-bold text-gray-700 hover:text-rose-500 sm:inline-flex">Explore all <ArrowRight className="h-4 w-4" /></Link>} />
                <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">{[{ label: "Beaches", value: "Beaches" }, { label: "Culture", value: "Cultural" }, { label: "Adventure", value: "Adventure" }, { label: "Food", value: "Food & Drink" }, { label: "Nature", value: "Nature" }].map(({ label, value }) => <button key={value} type="button" onClick={() => { handleCategory(value); scrollToDiscovery(); }} className="rounded-2xl border border-gray-200 bg-white px-4 py-4 text-left text-sm font-bold text-gray-800 shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-md"><Sparkles className="mb-3 h-4 w-4 text-rose-500" />{label}</button>)}</div>
                <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">{featuredDestinations.map((destination) => <Link key={destination.id} to={"/destinations/" + destination.id} className="group relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100 shadow-sm"><img src={destination.image} alt={destination.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" onError={(event) => { event.currentTarget.src = "https://images.unsplash.com/photo-1586500036706-41963de24d8b?auto=format&fit=crop&w=900&q=80"; }} /><div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-3"><p className="text-sm font-extrabold text-white">{destination.name}</p><div className="mt-1 flex items-center gap-1 text-xs text-white/75"><Star className="h-3 w-3 fill-current" />{Number(destination.rating || 0).toFixed(1)}</div></div></Link>)}</div>
              </div>
            </section>
            <section className="border-y border-gray-100 bg-gray-50 px-4 py-14 md:py-16"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="Travel styles" title="Choose the feeling, then choose the place" description="Use the categories already maintained in Voyara to narrow your inspiration." /><div className="mt-7 flex flex-wrap gap-2.5">{categories.map((category) => <button key={category} type="button" onClick={() => { handleCategory(category); scrollToDiscovery(); }} className="rounded-full border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-rose-300 hover:text-rose-600">{category}</button>)}</div></div></section>
            <section className="px-4 py-14 md:py-16"><div className="mx-auto max-w-7xl"><SectionHeading eyebrow="Curated journeys" title="Tours worth building a trip around" description="Compare package details, open the full itinerary, then customise when you are ready." action={<Link to="/compare-packages" className="hidden items-center gap-2 text-sm font-bold text-gray-700 hover:text-rose-500 sm:inline-flex">Compare packages <ArrowRight className="h-4 w-4" /></Link>} /><div className="mt-7 space-y-5">{featuredPackages.map((item) => <TourCard key={item.id} id={item.id} image={item.image} title={item.name} location={item.destinations.join(", ")} price={item.price || 0} duration={String(item.duration) + " days"} maxGroup={item.maxGroup} badge={item.status === "Active" ? undefined : item.status} category={item.category} rating={item.rating || 0} onView={(id) => navigate("/packages/" + id)} />)}</div>{featuredPackages.length === 0 && <div className="mt-7 rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">Tour packages will appear here when active packages are available.</div>}</div></section>
            <section className="px-4 pb-14 md:pb-16"><div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3">{[{ step: "01", title: "Discover", text: "Explore destinations, packages and local guides." }, { step: "02", title: "Plan", text: "Save ideas, compare packages and match trip resources to your needs." }, { step: "03", title: "Book", text: "Choose dates and create your booking when the plan is ready." }].map(({ step, title, text }) => <div key={step} className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"><span className="text-xs font-black tracking-[0.2em] text-rose-500">{step}</span><h3 className="mt-3 text-lg font-extrabold text-gray-900">{title}</h3><p className="mt-2 text-sm leading-6 text-gray-500">{text}</p></div>)}</div></section>
            <section className="px-4 pb-16"><div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#062a56] p-7 text-white md:p-10"><div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-300">Plan around you</p><h2 className="mt-2 text-2xl font-black md:text-3xl">Not sure where to start?</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Give Voyara your destination, dates, group size and preferences. The trip planner brings together suitable tours, guides, stays and transport using the resources already in the system.</p></div><div className="flex flex-wrap gap-3 md:justify-end"><Link to="/tourist/plan" className="inline-flex items-center gap-2 rounded-xl bg-[#FF385C] px-5 py-3 text-sm font-bold text-white hover:opacity-90">Plan my trip <ArrowRight className="h-4 w-4" /></Link><Link to="/explore" className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold text-white ring-1 ring-white/20 hover:bg-white/15">Explore first</Link></div></div></div></section>
            <section className="border-t border-gray-100 bg-gray-50 px-4 py-12"><div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-bold text-gray-900">Already planning a trip?</p><p className="mt-1 text-sm text-gray-500">Keep saved destinations and packages together in My Trip.</p></div><div className="flex flex-wrap gap-3">{isAuthenticated ? <><Link to="/tourist/my-trip" className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white">Open My Trip</Link><Link to="/tourist/dashboard" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">My bookings</Link></> : <><Link to="/login?mode=signup" className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white">Create an account</Link><Link to="/login" className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700">Log in</Link></>}</div></div></section>
          </>
        )}
      </main>
      <Footer />
      {isAuthenticated && <VoyAI />}
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-500">{eyebrow}</p><h2 className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">{title}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">{description}</p></div>{action}</div>;
}

function DiscoveryGroup({ title, actionLabel, onAction, children }: { title: string; actionLabel?: string; onAction?: () => void; children: React.ReactNode }) {
  return <section><div className="mb-5 flex items-center justify-between gap-3"><h3 className="text-lg font-extrabold text-gray-900">{title}</h3>{actionLabel && onAction && <button type="button" onClick={onAction} className="text-sm font-bold text-gray-600 hover:text-rose-500">{actionLabel}</button>}</div>{children}</section>;
}

function EmptySearch({ onClear }: { onClear: () => void }) {
  return <div className="mt-8 rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center"><Search className="mx-auto h-10 w-10 text-gray-300" /><h3 className="mt-4 text-lg font-extrabold text-gray-900">Nothing matched that search</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">Try a destination name, travel style, or tour package keyword.</p><button type="button" onClick={onClear} className="mt-5 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white">Browse all</button></div>;
}