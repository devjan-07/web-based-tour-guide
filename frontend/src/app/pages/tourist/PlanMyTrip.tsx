import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, BedDouble, CalendarDays, Car, Check, ChevronRight, Compass, Languages, MapPin, Sparkles, Star, Users } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import {
  accommodationRecommendationsApi,
  destinationsApi,
  guidesApi,
  packagesApi,
  vehicleRecommendationsApi,
  type AccommodationRecommendation,
  type Destination,
  type GuideRecommendation,
  type TourPackage,
  type VehicleRecommendation,
} from "../../lib/api";

const experiences = [
  ["Nature", "🌿"], ["Beach", "🏖️"], ["Culture", "🏛️"], ["Wildlife", "🐘"],
  ["Food", "🍜"], ["Adventure", "🥾"], ["Wellness", "🍃"], ["Family", "👨‍👩‍👧"],
] as const;

function today() { return new Date().toISOString().slice(0, 10); }
function addDays(value: string, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
function tripDays(start: string, end: string) {
  const from = new Date(start).getTime();
  const to = new Date(end).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) return 1;
  return Math.max(1, Math.ceil((to - from) / 86400000));
}
function imageFor(destination: Destination, fallback = "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1200&q=80") {
  return destination.image || fallback;
}

export default function PlanMyTrip() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [destinationId, setDestinationId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(addDays(today(), 3));
  const [travellers, setTravellers] = useState(2);
  const [dailyBudget, setDailyBudget] = useState(0);
  const [experience, setExperience] = useState("");
  const [guideLanguage, setGuideLanguage] = useState("English");
  const [preferences, setPreferences] = useState("wifi, breakfast");
  const [driverRequired, setDriverRequired] = useState(true);
  const [luggage, setLuggage] = useState(2);
  const [guides, setGuides] = useState<GuideRecommendation[]>([]);
  const [stays, setStays] = useState<AccommodationRecommendation[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [matched, setMatched] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([destinationsApi.list(), packagesApi.list()])
      .then(([destinationItems, packageItems]) => {
        const activeDestinations = destinationItems.filter((item) => item.status !== "Hidden");
        setDestinations(activeDestinations);
        setPackages(packageItems.filter((item) => item.status === "Active"));
        if (activeDestinations.length) setDestinationId(activeDestinations[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load travel options."))
      .finally(() => setLoading(false));
  }, []);

  const selectedDestination = useMemo(
    () => destinations.find((item) => item.id === destinationId) || null,
    [destinations, destinationId]
  );
  const duration = tripDays(startDate, endDate);

  const matchingPackages = useMemo(() => {
    if (!selectedDestination) return [];
    const destinationName = selectedDestination.name.toLowerCase();
    return packages
      .filter((pkg) => pkg.maxGroup <= 0 || pkg.maxGroup >= travellers)
      .filter((pkg) => pkg.destinations?.some((name) => name.toLowerCase().includes(destinationName) || destinationName.includes(name.toLowerCase())))
      .filter((pkg) => !dailyBudget || Number(pkg.price || 0) <= dailyBudget * duration * Math.max(1, travellers))
      .filter((pkg) => !experience || pkg.category.toLowerCase().includes(experience.toLowerCase()))
      .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0) || Number(a.price || 0) - Number(b.price || 0))
      .slice(0, 4);
  }, [dailyBudget, duration, experience, packages, selectedDestination, travellers]);

  async function findMatches() {
    if (!selectedDestination) return;
    setMatching(true);
    setError("");
    try {
      const [guideItems, stayItems, vehicleItems] = await Promise.all([
        guidesApi.recommendations({ language: guideLanguage, location: selectedDestination.name }),
        accommodationRecommendationsApi.list({
          destinationId: selectedDestination.id,
          destination: selectedDestination.name,
          travellers,
          preferences: preferences || undefined,
          maxDailyBudget: dailyBudget || undefined,
        }),
        vehicleRecommendationsApi.list({
          passengers: travellers,
          luggage,
          driverRequired,
          location: selectedDestination.name,
          maxDailyBudget: dailyBudget || undefined,
        }),
      ]);
      setGuides(guideItems.slice(0, 3));
      setStays(stayItems.slice(0, 3));
      setVehicles(vehicleItems.slice(0, 3));
      setMatched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build recommendations.");
    } finally {
      setMatching(false);
    }
  }

  if (loading) {
    return <Shell><div className="mx-auto max-w-7xl px-4 py-24 text-center text-sm font-semibold text-gray-500">Preparing your Sri Lanka journey...</div></Shell>;
  }

  return (
    <Shell>
      <section className="relative overflow-hidden bg-[#0b1f3a] text-white">
        <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "radial-gradient(circle at 75% 15%, #ff385c 0, transparent 28%), radial-gradient(circle at 20% 90%, #4f8cff 0, transparent 32%)" }} />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:px-8 lg:py-16">
          <div className="self-center">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-rose-300"><Sparkles className="h-4 w-4" /> Travel concierge</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Build the Sri Lanka escape that feels like you.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70 md:text-lg">
              Start with a destination, dates and travel style. Voyara then connects the existing packages and supporting services that fit those choices.
            </p>
            <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold text-white/75">
              <span className="rounded-full bg-white/10 px-3 py-2">Destination</span>
              <span className="rounded-full bg-white/10 px-3 py-2">Dates & people</span>
              <span className="rounded-full bg-white/10 px-3 py-2">Preferences</span>
              <span className="rounded-full bg-white/10 px-3 py-2">Matched options</span>
            </div>
          </div>
          {selectedDestination && (
            <div className="relative min-h-[330px] overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-white/20">
              <img src={imageFor(selectedDestination)} alt={selectedDestination.name} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
              <div className="absolute bottom-0 p-7">
                <p className="text-xs font-black uppercase tracking-widest text-white/60">Your starting point</p>
                <h2 className="mt-2 text-3xl font-black">{selectedDestination.name}</h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-white/80">{selectedDestination.description}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        {error && <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">{error}</div>}

        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">01 · Pick a place</p><h2 className="mt-2 text-3xl font-black tracking-tight text-[#10213b]">Where do you want to go?</h2></div>
            <p className="text-sm text-gray-400">Choose a destination before anything else.</p>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {destinations.slice(0, 10).map((destination) => {
              const active = destination.id === destinationId;
              return (
                <button key={destination.id} type="button" onClick={() => { setDestinationId(destination.id); setMatched(false); }} className={"group relative h-44 overflow-hidden rounded-2xl text-left transition duration-300 " + (active ? "ring-4 ring-rose-400 ring-offset-2" : "ring-1 ring-gray-200 hover:-translate-y-1 hover:shadow-lg")}>
                  <img src={imageFor(destination)} alt={destination.name} className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <p className="font-black">{destination.name}</p>
                    <p className="mt-1 text-[10px] font-bold text-white/70">{destination.categories?.slice(0, 2).join(" · ")}</p>
                  </div>
                  {active && <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#ff385c] text-white"><Check className="h-4 w-4" /></span>}
                </button>
              );
            })}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">02 · Set the mood</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#10213b]">What sounds like you?</h2>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {experiences.map(([label, emoji]) => {
                const active = experience === label;
                return <button key={label} type="button" onClick={() => { setExperience(active ? "" : label); setMatched(false); }} className={"rounded-2xl border p-4 text-left transition " + (active ? "border-rose-400 bg-rose-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50")}>
                  <span className="text-2xl">{emoji}</span><p className="mt-3 text-sm font-black text-[#10213b]">{label}</p><span className={"mt-2 block h-1 w-8 rounded-full " + (active ? "bg-rose-500" : "bg-gray-200")} />
                </button>;
              })}
            </div>
          </div>

          <div className="rounded-[2rem] bg-[#f0f6ff] p-6 ring-1 ring-blue-100 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">03 · When & who</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#10213b]">Make it yours.</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <PlannerField icon={CalendarDays} label="Start"><input type="date" min={today()} value={startDate} onChange={(e) => { setStartDate(e.target.value); if (new Date(e.target.value) >= new Date(endDate)) setEndDate(addDays(e.target.value, 1)); setMatched(false); }} /></PlannerField>
              <PlannerField icon={CalendarDays} label="End"><input type="date" min={startDate} value={endDate} onChange={(e) => { setEndDate(e.target.value); setMatched(false); }} /></PlannerField>
              <PlannerField icon={Users} label="Travellers"><input type="number" min={1} value={travellers} onChange={(e) => { setTravellers(Math.max(1, Number(e.target.value))); setMatched(false); }} /></PlannerField>
              <PlannerField icon={Compass} label="Daily budget"><select value={dailyBudget} onChange={(e) => { setDailyBudget(Number(e.target.value)); setMatched(false); }}><option value={0}>Any budget</option><option value={25000}>Up to LKR 25,000</option><option value={40000}>Up to LKR 40,000</option><option value={60000}>Up to LKR 60,000</option></select></PlannerField>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">04 · Fine tune</p><h2 className="mt-2 text-3xl font-black tracking-tight text-[#10213b]">A few travel preferences</h2><p className="mt-2 text-sm text-gray-500">These help match guides, stays and transport after we find the right trip.</p></div>
            <button type="button" disabled={matching || !selectedDestination} onClick={findMatches} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff385c] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-rose-200 transition hover:-translate-y-0.5 hover:bg-[#e91f47] disabled:cursor-not-allowed disabled:opacity-50">
              {matching ? "Finding your journey..." : "Find my journey"} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <PlannerField icon={Languages} label="Guide language"><select value={guideLanguage} onChange={(e) => setGuideLanguage(e.target.value)}><option>English</option><option>French</option><option>Spanish</option><option>Japanese</option><option>Korean</option><option>Chinese</option><option>German</option></select></PlannerField>
            <PlannerField icon={BedDouble} label="Stay preferences"><input value={preferences} onChange={(e) => setPreferences(e.target.value)} placeholder="wifi, breakfast" /></PlannerField>
            <PlannerField icon={Car} label="Transport"><select value={driverRequired ? "Driver preferred" : "I will arrange my own"} onChange={(e) => setDriverRequired(e.target.value === "Driver preferred")}><option>Driver preferred</option><option>I will arrange my own</option></select></PlannerField>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs font-bold text-gray-500"><span className="rounded-full bg-gray-50 px-3 py-2">🧳 {luggage} luggage {luggage === 1 ? "item" : "items"}</span><button type="button" onClick={() => setLuggage(Math.max(0, luggage - 1))} className="rounded-full border border-gray-200 px-3 py-2 hover:bg-gray-50">−</button><button type="button" onClick={() => setLuggage(luggage + 1)} className="rounded-full border border-gray-200 px-3 py-2 hover:bg-gray-50">+</button><span className="rounded-full bg-gray-50 px-3 py-2">{duration} day{duration === 1 ? "" : "s"}</span></div>
        </section>

        <section className="mt-14">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Your main trip options</p><h2 className="mt-2 text-3xl font-black tracking-tight text-[#10213b]">Journeys that fit</h2><p className="mt-2 text-sm text-gray-500">{selectedDestination ? "Packages around " + selectedDestination.name + "." : "Choose a destination to see packages."}</p></div>
            {matched && <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700">Recommendations updated</span>}
          </div>

          {matchingPackages.length === 0 ? (
            <div className="mt-6 rounded-[2rem] border border-dashed border-gray-300 bg-white p-10 text-center">
              <Compass className="mx-auto h-8 w-8 text-gray-300" />
              <p className="mt-4 font-black text-[#10213b]">No package matches these choices yet.</p>
              <p className="mt-2 text-sm text-gray-500">Try another destination, experience or budget. You can also browse every package.</p>
              <Link to="/explore?tab=tours" className="mt-5 inline-flex rounded-full bg-[#10213b] px-5 py-3 text-sm font-black text-white">Browse all packages</Link>
            </div>
          ) : (
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {matchingPackages.map((pkg) => (
                <article key={pkg.id} className="group overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
                  <div className="relative h-60 overflow-hidden">
                    <img src={pkg.image || imageFor(selectedDestination!)} alt={pkg.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#10213b]">{pkg.category}</div>
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white"><h3 className="text-2xl font-black">{pkg.name}</h3><p className="mt-1 text-xs font-semibold text-white/75">{pkg.destinations.join(" · ")}</p></div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3"><span className="inline-flex items-center gap-1 text-sm font-bold text-gray-500"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {Number(pkg.rating || 0).toFixed(1)}</span><span className="text-xs font-bold text-gray-400">{pkg.duration} days · {pkg.difficulty}</span></div>
                    <div className="mt-5 flex items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-wider text-gray-400">From</p><p className="text-2xl font-black text-[#10213b]">LKR {Number(pkg.price || 0).toLocaleString()}</p></div><span className="text-xs font-semibold text-gray-400">per traveller</span></div>
                    <div className="mt-5 rounded-2xl bg-[#f7f8fa] p-4"><p className="text-[10px] font-black uppercase tracking-wider text-gray-400">This package already includes</p><div className="mt-3 flex flex-wrap gap-2">{(pkg.included || "Package services").split(",").slice(0, 5).map((item) => <span key={item} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-gray-600 ring-1 ring-gray-100">{item.trim()}</span>)}</div></div>
                    <div className="mt-5 flex gap-2"><Link to={"/packages/" + pkg.id} className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-center text-xs font-black text-gray-700 hover:bg-gray-50">View journey</Link><Link to={"/tourist/packages/" + pkg.id + "/customize"} className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-[#ff385c] px-4 py-3 text-xs font-black text-white">Customize <ChevronRight className="h-4 w-4" /></Link></div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {matched && (
          <section className="mt-14">
            <div className="rounded-[2rem] bg-[#0b1f3a] p-6 text-white md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Supporting services</p>
              <h2 className="mt-2 text-3xl font-black">Complete the journey when you need to.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">These are separate local resources matched to your choices. They are not automatically added to a package.</p>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <ServicePanel title="Local guides" icon={Languages} count={guides.length} empty="No guide matches right now.">{guides.map(({ guide, suitabilityScore, reasons }) => <ServiceCard key={guide.id} image={guide.profilePhoto} title={guide.name} subtitle={guide.location + " · " + guide.experience + " years"} price={guide.pricePerDay ? "LKR " + Number(guide.pricePerDay).toLocaleString() + " / day" : "Price on request"} score={suitabilityScore} reasons={reasons} />)}</ServicePanel>
              <ServicePanel title="Places to stay" icon={BedDouble} count={stays.length} empty="No suitable stays found.">{stays.map(({ accommodation, suitabilityScore, reasons }) => <ServiceCard key={accommodation.id} image={accommodation.image} title={accommodation.name} subtitle={accommodation.type + " · " + accommodation.location} price={"LKR " + Number(accommodation.price).toLocaleString() + " / night"} score={suitabilityScore} reasons={reasons} />)}</ServicePanel>
              <ServicePanel title="Transport" icon={Car} count={vehicles.length} empty="No suitable vehicles found.">{vehicles.map(({ vehicle, suitabilityScore, reasons }) => <ServiceCard key={vehicle.id} image={vehicle.image} title={vehicle.name} subtitle={vehicle.type + " · " + vehicle.capacity + " seats"} price={"LKR " + Number(vehicle.pricePerDay).toLocaleString() + " / day"} score={suitabilityScore} reasons={reasons} />)}</ServicePanel>
            </div>
          </section>
        )}

        <section className="mt-14 overflow-hidden rounded-[2rem] bg-[#f5eee7]">
          <div className="grid gap-8 p-7 md:grid-cols-[1fr_auto] md:items-center md:p-10">
            <div><p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">How Voyara works</p><h2 className="mt-2 text-3xl font-black text-[#10213b]">Choose the experience first. Personalise only what matters.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">A package is your main journey. Included services stay included. Optional guides, stays and transport are only added when you choose to change or add them.</p></div>
            <Link to="/explore?tab=tours" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#10213b] px-6 py-3.5 text-sm font-black text-white">Explore journeys <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
      </main>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#f6f7f5]"><Navbar />{children}<Footer /></div>;
}

function PlannerField({ icon: Icon, label, children }: { icon: typeof CalendarDays; label: string; children: React.ReactNode }) {
  return <label className="block rounded-2xl bg-white p-4 ring-1 ring-gray-200"><span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-gray-400"><Icon className="h-4 w-4" /> {label}</span><div className="mt-2">{children}</div></label>;
}

function ServicePanel({ title, icon: Icon, count, empty, children }: { title: string; icon: typeof BedDouble; count: number; empty: string; children: React.ReactNode }) {
  return <section className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-gray-200 md:p-6"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500"><Icon className="h-5 w-5" /></span><div><h3 className="text-xl font-black text-[#10213b]">{title}</h3><p className="text-xs text-gray-400">{count ? count + " matched option" + (count === 1 ? "" : "s") : "Matched to your choices"}</p></div></div></div><div className="mt-5 space-y-3">{count ? children : <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-400">{empty}</div>}</div></section>;
}

function ServiceCard({ image, title, subtitle, price, score, reasons }: { image?: string; title: string; subtitle: string; price: string; score: number; reasons: string[] }) {
  return <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white"><div className="flex h-28"><div className="w-28 shrink-0 overflow-hidden bg-gray-100">{image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-gray-300"><Compass className="h-7 w-7" /></div>}</div><div className="min-w-0 flex-1 p-3"><div className="flex items-start justify-between gap-2"><h4 className="truncate font-black text-[#10213b]">{title}</h4><span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">{Math.round(score)}% fit</span></div><p className="mt-1 truncate text-xs text-gray-500">{subtitle}</p><p className="mt-2 text-xs font-black text-gray-800">{price}</p></div></div><div className="flex flex-wrap gap-1.5 border-t border-gray-100 px-3 py-2.5">{reasons.slice(0, 2).map((reason) => <span key={reason} className="rounded-full bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-500">{reason}</span>)}</div></article>;
}
