import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight, BedDouble, CalendarDays, Car, Check, Compass, Languages, Sparkles, Users } from "lucide-react";
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

function today() { return new Date().toISOString().slice(0, 10); }
function addDays(value: string, days: number) { const date = new Date(value); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); }
function tripDays(start: string, end: string) {
  const from = new Date(start); const to = new Date(end);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 1;
  return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000));
}

const experiences = [
  ["Nature", "🌿"], ["Beach", "🏖️"], ["Culture", "🏛️"], ["Wildlife", "🐘"],
  ["Food", "🍜"], ["Adventure", "🥾"], ["Wellness", "🍃"], ["Family", "👨‍👩‍👧"],
];

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
  const [guideRecommendations, setGuideRecommendations] = useState<GuideRecommendation[]>([]);
  const [accommodationRecommendations, setAccommodationRecommendations] = useState<AccommodationRecommendation[]>([]);
  const [vehicleRecommendations, setVehicleRecommendations] = useState<VehicleRecommendation[]>([]);
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
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load trip planning data"))
      .finally(() => setLoading(false));
  }, []);

  const selectedDestination = useMemo(() => destinations.find((item) => item.id === destinationId) || null, [destinations, destinationId]);
  const duration = tripDays(startDate, endDate);

  const matchingPackages = useMemo(() => {
    if (!selectedDestination) return [];
    const destinationName = selectedDestination.name.toLowerCase();
    return packages
      .filter((item) => item.maxGroup <= 0 || item.maxGroup >= travellers)
      .filter((item) => item.destinations?.some((d) => d.toLowerCase().includes(destinationName) || destinationName.includes(d.toLowerCase())))
      .filter((item) => !dailyBudget || Number(item.price || 0) <= dailyBudget * duration * Math.max(1, travellers))
      .filter((item) => !experience || item.category.toLowerCase().includes(experience.toLowerCase()))
      .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0) || Number(a.price || 0) - Number(b.price || 0))
      .slice(0, 3);
  }, [dailyBudget, duration, experience, packages, selectedDestination, travellers]);

  async function findMatches() {
    if (!selectedDestination) return;
    setMatching(true); setError("");
    try {
      const [guides, stays, vehicles] = await Promise.all([
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
      setGuideRecommendations(guides.slice(0, 3));
      setAccommodationRecommendations(stays.slice(0, 3));
      setVehicleRecommendations(vehicles.slice(0, 3));
      setMatched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build recommendations");
    } finally {
      setMatching(false);
    }
  }

  if (loading) return <PageShell><div className="mx-auto max-w-7xl px-4 py-20 text-center text-gray-500">Loading your travel options...</div></PageShell>;

  return (
    <PageShell>
      <section className="relative overflow-hidden bg-[#071a33] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-20">
          <div className="self-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-rose-300"><Sparkles className="mr-2 inline h-4 w-4" /> Travel planner</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Tell us what kind of Sri Lanka escape you want.</h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/70 md:text-lg">Choose a place, dates and the feeling you want from the trip. Voyara will surface packages and local travel services that fit.</p>
          </div>
          {selectedDestination && <div className="relative min-h-[320px] overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-white/20">
            <img src={selectedDestination.image} alt={selectedDestination.name} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <div className="absolute bottom-0 p-6"><p className="text-xs font-black uppercase tracking-wider text-white/70">Start here</p><h2 className="mt-1 text-3xl font-black">{selectedDestination.name}</h2><p className="mt-1 max-w-md text-sm text-white/80">{selectedDestination.description}</p></div>
          </div>}
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {error && <div className="mb-6 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}

        <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">01 · Choose your place</p><h2 className="mt-1 text-2xl font-black text-[#10213b]">Where do you want to wake up?</h2></div>
            <span className="hidden text-xs font-bold text-gray-400 sm:block">Your answers shape the recommendations</span>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {destinations.slice(0, 10).map((destination) => {
              const active = destination.id === destinationId;
              return <button key={destination.id} type="button" onClick={() => { setDestinationId(destination.id); setMatched(false); }} className={"group relative h-40 overflow-hidden rounded-2xl text-left " + (active ? "ring-4 ring-rose-400" : "ring-1 ring-gray-200")}>
                <img src={destination.image} alt={destination.name} className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-white"><p className="text-sm font-black">{destination.name}</p><p className="mt-1 text-[10px] font-bold text-white/70">{destination.categories?.slice(0, 2).join(" · ")}</p></div>
                {active && <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white"><Check className="h-4 w-4" /></span>}
              </button>;
            })}
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">02 · Shape the experience</p>
            <h2 className="mt-1 text-2xl font-black text-[#10213b]">What sounds like you?</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {experiences.map(([label, emoji]) => <button key={label} type="button" onClick={() => setExperience(experience === label ? "" : label)} className={"rounded-2xl border p-4 text-left transition " + (experience === label ? "border-rose-400 bg-rose-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50")}><span className="text-2xl">{emoji}</span><p className="mt-2 text-sm font-black text-[#10213b]">{label}</p></button>)}
            </div>
          </div>
          <div className="rounded-[2rem] bg-[#fff8f3] p-6 ring-1 ring-orange-100 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-600">Trip snapshot</p>
            <div className="mt-5 space-y-4">
              <Snapshot icon={CalendarDays} label="Dates"><div className="flex gap-2"><input type="date" value={startDate} onChange={e=>{setStartDate(e.target.value);setMatched(false)}} className="min-w-0 flex-1 rounded-xl bg-white p-3 text-sm font-bold outline-none ring-1 ring-orange-100" /><input type="date" min={startDate} value={endDate} onChange={e=>{setEndDate(e.target.value);setMatched(false)}} className="min-w-0 flex-1 rounded-xl bg-white p-3 text-sm font-bold outline-none ring-1 ring-orange-100" /></div></Snapshot>
              <Snapshot icon={Users} label="Travellers"><input type="number" min="1" value={travellers} onChange={e=>{setTravellers(Math.max(1,Number(e.target.value)));setMatched(false)}} className="w-full rounded-xl bg-white p-3 text-sm font-bold outline-none ring-1 ring-orange-100" /></Snapshot>
              <Snapshot icon={Compass} label="Budget per traveller / day"><input type="number" min="0" value={dailyBudget || ""} placeholder="Any budget" onChange={e=>{setDailyBudget(Math.max(0,Number(e.target.value)));setMatched(false)}} className="w-full rounded-xl bg-white p-3 text-sm font-bold outline-none ring-1 ring-orange-100" /></Snapshot>
              <Snapshot icon={Languages} label="Guide language"><select value={guideLanguage} onChange={e=>{setGuideLanguage(e.target.value);setMatched(false)}} className="w-full rounded-xl bg-white p-3 text-sm font-bold outline-none ring-1 ring-orange-100"><option>English</option><option>French</option><option>Spanish</option><option>Japanese</option><option>Korean</option><option>Chinese</option><option>German</option></select></Snapshot>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] bg-[#10213b] p-6 text-white shadow-xl md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-rose-300">03 · Let Voyara match it</p><h2 className="mt-1 text-2xl font-black">Build my travel options</h2><p className="mt-2 max-w-2xl text-sm text-white/65">We'll use your dates, group size, destination and preferences to surface practical options. Nothing is booked yet.</p></div>
            <button type="button" onClick={findMatches} disabled={matching || !selectedDestination} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#FF385C] px-6 py-3.5 text-sm font-black text-white disabled:opacity-60">{matching ? "Finding options..." : "Find my options"} <ArrowRight className="h-4 w-4" /></button>
          </div>
        </section>

        {matched && <section className="mt-10">
          <div className="mb-5"><p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">Your options</p><h2 className="mt-1 text-3xl font-black text-[#10213b]">Trips that fit your brief</h2><p className="mt-2 text-sm text-gray-500">Start with a package when one matches. The other services are there when you want to build a custom booking.</p></div>
          <div className="grid gap-6 lg:grid-cols-3">
            {matchingPackages.length ? matchingPackages.map((pkg) => <article key={pkg.id} className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 ring-gray-200">
              <div className="relative h-52"><img src={pkg.image} alt={pkg.name} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" /><div className="absolute bottom-0 p-5 text-white"><p className="text-xs font-bold uppercase tracking-wider text-white/70">{pkg.category}</p><h3 className="mt-1 text-xl font-black">{pkg.name}</h3></div></div>
              <div className="p-5"><div className="flex items-center justify-between"><span className="text-sm text-gray-500">{pkg.duration} days · {pkg.difficulty}</span><span className="font-black text-[#10213b]">LKR {Number(pkg.price || 0).toLocaleString()}</span></div><p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-500">{pkg.description}</p><div className="mt-4 flex flex-wrap gap-2">{(pkg.included||"").split(",").slice(0,4).map(x=><span key={x} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{x.trim()}</span>)}</div><div className="mt-5 flex gap-2"><Link to={"/packages/" + pkg.id} className="flex-1 rounded-xl border border-gray-200 px-3 py-3 text-center text-xs font-black text-gray-700">Explore</Link><Link to={"/tourist/packages/" + pkg.id + "/customize?guests=" + travellers + "&checkIn=" + startDate + "&checkOut=" + endDate + "&language=" + encodeURIComponent(guideLanguage) + "&luggage=" + luggage + "&driver=" + driverRequired} className="flex-1 rounded-xl bg-[#FF385C] px-3 py-3 text-center text-xs font-black text-white">Customize</Link></div></div>
            </article>) : <div className="rounded-[1.75rem] bg-white p-8 text-center ring-1 ring-gray-200 lg:col-span-3"><p className="font-black text-[#10213b]">No package matches these preferences.</p><p className="mt-2 text-sm text-gray-500">You can still continue with a custom trip for this destination.</p><Link to={"/tourist/bookings/new?destinationId=" + (selectedDestination?.id || "") + "&destination=" + encodeURIComponent(selectedDestination?.name || "")} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#FF385C] px-5 py-3 text-sm font-black text-white">Build a custom trip <ArrowRight className="h-4 w-4" /></Link></div>}
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <ResourceStrip title="Local guides" icon={Languages} items={guideRecommendations.map((item) => ({ title: item.guide.name, subtitle: (item.guide.location || item.guide.country) + " · " + item.guide.experience + " yrs", score: item.suitabilityScore }))} />
            <ResourceStrip title="Places to stay" icon={BedDouble} items={accommodationRecommendations.map((item) => ({ title: item.accommodation.name, subtitle: item.accommodation.type + " · LKR " + Number(item.accommodation.price || 0).toLocaleString() + "/night", score: item.suitabilityScore }))} />
            <ResourceStrip title="Getting around" icon={Car} items={vehicleRecommendations.map((item) => ({ title: item.vehicle.name, subtitle: item.vehicle.type + " · " + item.vehicle.capacity + " seats", score: item.suitabilityScore }))} />
          </div>
        </section>}
      </main>
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) { return <div className="min-h-screen bg-[#f7f8fa]"><Navbar />{children}<Footer /></div>; }
function Snapshot({ icon: Icon, label, children }: { icon: ComponentType<{className?: string}>; label: string; children: ReactNode }) { return <div><p className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-wider text-orange-700"><Icon className="h-4 w-4"/>{label}</p>{children}</div>; }
function ResourceStrip({ title, icon: Icon, items }: { title:string; icon:ComponentType<{className?: string}>; items:Array<{title:string;subtitle:string;score:number}> }) { return <section className="rounded-[1.75rem] bg-white p-5 shadow-sm ring-1 ring-gray-200"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50"><Icon className="h-5 w-5 text-gray-600"/></div><div><h3 className="font-black text-[#10213b]">{title}</h3><p className="text-xs text-gray-400">Available for your trip</p></div></div><div className="mt-4 space-y-3">{items.length ? items.slice(0,3).map((item)=><div key={item.title} className="rounded-xl bg-gray-50 p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-bold text-gray-800">{item.title}</p><span className="text-[11px] font-black text-emerald-600">{item.score}%</span></div><p className="mt-1 text-xs text-gray-500">{item.subtitle}</p></div>) : <p className="rounded-xl border border-dashed border-gray-200 p-4 text-xs text-gray-400">No matches right now.</p>}</div></section>; }
