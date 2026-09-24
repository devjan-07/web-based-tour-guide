import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight, BedDouble, CalendarDays, Car, CheckCircle, Compass, Languages, MapPin, Package, Sparkles, Users } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { addTripItem } from "../../lib/tripPlanner";
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

function today() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function tripDays(start: string, end: string) {
  const from = new Date(start);
  const to = new Date(end);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 1;
  return Math.max(1, Math.ceil((to.getTime() - from.getTime()) / 86400000));
}

export default function PlanMyTrip() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [destinationId, setDestinationId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(addDays(today(), 3));
  const [travellers, setTravellers] = useState(2);
  const [dailyBudget, setDailyBudget] = useState(0);
  const [guideLanguage, setGuideLanguage] = useState("English");
  const [guideSpecialty, setGuideSpecialty] = useState("");
  const [preferences, setPreferences] = useState("wifi, breakfast");
  const [driverRequired, setDriverRequired] = useState(true);
  const [luggage, setLuggage] = useState(2);
  const [guideRecommendations, setGuideRecommendations] = useState<GuideRecommendation[]>([]);
  const [accommodationRecommendations, setAccommodationRecommendations] = useState<AccommodationRecommendation[]>([]);
  const [vehicleRecommendations, setVehicleRecommendations] = useState<VehicleRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
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

  const selectedDestination = useMemo(
    () => destinations.find((item) => item.id === destinationId) || null,
    [destinations, destinationId]
  );

  const duration = tripDays(startDate, endDate);

  const matchingPackages = useMemo(() => {
    if (!selectedDestination) return [];
    const name = selectedDestination.name.toLowerCase();
    return packages
      .filter((item) => item.maxGroup <= 0 || item.maxGroup >= travellers)
      .filter((item) => item.destinations?.some((itemDestination) => itemDestination.toLowerCase().includes(name) || name.includes(itemDestination.toLowerCase())))
      .filter((item) => !dailyBudget || Number(item.price || 0) <= dailyBudget * duration * Math.max(1, travellers))
      .filter((item) => duration <= 0 || Number(item.duration || 1) <= Math.max(duration + 2, duration * 2))
      .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0) || Number(a.price || 0) - Number(b.price || 0))
      .slice(0, 3);
  }, [dailyBudget, duration, packages, selectedDestination, travellers]);

  async function matchTrip() {
    if (!selectedDestination) return;
    setMatching(true);
    setError("");
    try {
      const [guides, stays, vehicles] = await Promise.all([
        guidesApi.recommendations({
          language: guideLanguage,
          specialty: guideSpecialty || undefined,
          location: selectedDestination.name,
        }),
        accommodationRecommendationsApi.list({
          destinationId: selectedDestination.id,
          destination: selectedDestination.name,
          travellers,
          maxDailyBudget: dailyBudget || undefined,
          preferences: preferences || undefined,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build recommendations");
    } finally {
      setMatching(false);
    }
  }

  const customBookingLink = selectedDestination
    ? `/tourist/bookings/new?destinationId=${selectedDestination.id}&destination=${encodeURIComponent(selectedDestination.name)}`
    : "/tourist/bookings/new";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#003580] to-[#0057B8] text-white shadow-lg">
          <div className="p-7 md:p-10">
            <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-white/70">
              <Sparkles className="h-4 w-4" /> Voyara trip planner
            </div>
            <h1 className="max-w-3xl text-3xl font-extrabold md:text-5xl">Build a trip around the way you actually travel.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 md:text-base">
              Choose a destination, dates, group size and preferences. Voyara then connects packages, guides, stays and transport into one practical starting plan.
            </p>
          </div>
        </section>

        {loading ? (
          <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-8 text-sm text-gray-500">Loading destinations and tour packages...</div>
        ) : (
          <>
            <section className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-500"><Compass className="h-5 w-5" /></div>
                <div>
                  <h2 className="font-extrabold text-gray-900">Tell us about the trip</h2>
                  <p className="text-xs text-gray-400">These inputs are used to match existing Voyara resources. No new booking is created yet.</p>
                </div>
              </div>

              {error && <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <PlannerField icon={MapPin} label="Destination">
                  <select value={destinationId ?? ""} onChange={(event) => setDestinationId(Number(event.target.value))} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none">
                    {destinations.map((item) => <option key={item.id} value={item.id}>{item.name}{item.country ? `, ${item.country}` : ""}</option>)}
                  </select>
                </PlannerField>

                <PlannerField icon={CalendarDays} label="Start date">
                  <input type="date" min={today()} value={startDate} onChange={(event) => { setStartDate(event.target.value); if (new Date(endDate) <= new Date(event.target.value)) setEndDate(addDays(event.target.value, 1)); }} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                </PlannerField>

                <PlannerField icon={CalendarDays} label="End date">
                  <input type="date" min={startDate} value={endDate} onChange={(event) => setEndDate(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                </PlannerField>

                <PlannerField icon={Users} label="Travellers">
                  <input type="number" min={1} value={travellers} onChange={(event) => setTravellers(Math.max(1, Number(event.target.value)))} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                </PlannerField>

                <PlannerField icon={Package} label="Daily budget (LKR)">
                  <input type="number" min={0} value={dailyBudget || ""} placeholder="Any budget" onChange={(event) => setDailyBudget(Math.max(0, Number(event.target.value)))} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                </PlannerField>

                <PlannerField icon={Languages} label="Guide language">
                  <select value={guideLanguage} onChange={(event) => setGuideLanguage(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none">
                    {["English", "French", "Spanish", "Japanese", "Korean", "Chinese", "Arabic", "German", "Italian", "Indonesian", "Greek", "Swahili", "Portuguese"].map((item) => <option key={item}>{item}</option>)}
                  </select>
                </PlannerField>

                <PlannerField icon={Compass} label="Guide specialty">
                  <input value={guideSpecialty} onChange={(event) => setGuideSpecialty(event.target.value)} placeholder="Culture, hiking, food..." className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                </PlannerField>

                <PlannerField icon={BedDouble} label="Stay preferences">
                  <input value={preferences} onChange={(event) => setPreferences(event.target.value)} placeholder="wifi, pool, breakfast" className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                </PlannerField>

                <PlannerField icon={Car} label="Transport">
                  <select value={driverRequired ? "Driver required" : "Self drive"} onChange={(event) => setDriverRequired(event.target.value === "Driver required")} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none">
                    <option>Driver required</option>
                    <option>Self drive</option>
                  </select>
                </PlannerField>

                <PlannerField icon={Package} label="Luggage">
                  <input type="number" min={0} value={luggage} onChange={(event) => setLuggage(Math.max(0, Number(event.target.value)))} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                </PlannerField>
              </div>

              <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-gray-50 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{selectedDestination?.name || "Choose a destination"} · {duration} day{duration === 1 ? "" : "s"}</p>
                  <p className="mt-1 text-xs text-gray-500">{travellers} traveller{travellers === 1 ? "" : "s"} · {driverRequired ? "Driver requested" : "Self drive"} · {luggage} luggage item{luggage === 1 ? "" : "s"}</p>
                </div>
                <button type="button" onClick={matchTrip} disabled={matching || !selectedDestination} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF385C] px-5 py-3 text-sm font-bold text-white disabled:opacity-60">
                  {matching ? "Building your plan..." : "Build My Trip"} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>

            <section className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
              <RecommendationCard title="Tour packages" icon={Package} empty="No matching package was found. A custom trip can still use the matched resources below.">
                {matchingPackages.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="font-bold text-gray-900">{item.name}</p><p className="mt-1 text-xs text-gray-400">{item.duration} days · {item.difficulty}</p></div>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">{Number(item.rating || 0).toFixed(1)}★</span>
                    </div>
                    <p className="mt-3 text-sm font-extrabold text-gray-900">LKR {Number(item.price || 0).toLocaleString()}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-500">{item.description || "Tour package available for this destination."}</p>
                    <div className="mt-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => addTripItem({ type: "package", id: item.id, title: item.name, subtitle: item.duration + " days · " + item.difficulty, destination: selectedDestination?.name, day: 1 })} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700">Add to My Trip</button><Link to={`/tourist/bookings/new?packageId=${item.id}`} className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-3 py-2 text-xs font-bold text-white">Use package</Link></div>
                  </div>
                ))}
              </RecommendationCard>

              <RecommendationCard title="Guide matches" icon={Languages} empty="Run Build My Trip to match available guides.">
                {guideRecommendations.map((item) => (
                  <div key={item.guide.id} className="rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-gray-900">{item.guide.name}</p><p className="mt-1 text-xs text-gray-400">{item.guide.location || item.guide.country} · {item.guide.experience} years</p></div><Fit score={item.suitabilityScore} /></div>
                    <p className="mt-3 text-xs text-gray-500">{item.reasons.slice(0, 2).join(" · ")}</p>\n                    <button type="button" onClick={() => addTripItem({ type: "guide", id: item.guide.id, title: item.guide.name, subtitle: "Guide · " + (item.guide.location || item.guide.country), destination: selectedDestination?.name, day: 1 })} className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700">Add to My Trip</button>
                  </div>
                ))}
              </RecommendationCard>

              <RecommendationCard title="Stay matches" icon={BedDouble} empty="Run Build My Trip to match active accommodation.">
                {accommodationRecommendations.map((item) => (
                  <div key={item.accommodation.id} className="rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-gray-900">{item.accommodation.name}</p><p className="mt-1 text-xs text-gray-400">{item.accommodation.type} · {item.accommodation.location}</p></div><Fit score={item.suitabilityScore} /></div>
                    <p className="mt-3 text-sm font-extrabold text-gray-900">LKR {Number(item.accommodation.price || 0).toLocaleString()} / night</p>
                    <p className="mt-1 text-xs text-gray-500">{item.reasons.slice(0, 2).join(" · ")}</p>\n                    <button type="button" onClick={() => addTripItem({ type: "accommodation", id: item.accommodation.id, title: item.accommodation.name, subtitle: item.accommodation.type + " · " + item.accommodation.location, destination: selectedDestination?.name, day: 1 })} className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700">Add to My Trip</button>
                  </div>
                ))}
              </RecommendationCard>
            </section>

            <section className="mt-5 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600"><Car className="h-5 w-5" /></div>
                <div><h2 className="font-extrabold text-gray-900">Transport matches</h2><p className="text-xs text-gray-400">Vehicles are matched using group size, luggage, driver preference and destination.</p></div>
              </div>
              {vehicleRecommendations.length ? (
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {vehicleRecommendations.map((item) => (
                    <div key={item.vehicle.id} className="rounded-2xl border border-gray-200 p-4">
                      <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-gray-900">{item.vehicle.name}</p><p className="mt-1 text-xs text-gray-400">{item.vehicle.type} · {item.vehicle.capacity} seats · {item.vehicle.transmission}</p></div><Fit score={item.suitabilityScore} /></div>
                      <p className="mt-3 text-sm font-extrabold text-gray-900">LKR {Number(item.vehicle.pricePerDay || 0).toLocaleString()} / day</p>
                      <p className="mt-1 text-xs text-gray-500">{item.reasons.slice(0, 2).join(" · ")}</p>\n                      <button type="button" onClick={() => addTripItem({ type: "vehicle", id: item.vehicle.id, title: item.vehicle.name, subtitle: item.vehicle.type + " · " + item.vehicle.capacity + " seats", destination: selectedDestination?.name, day: 1 })} className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700">Add to My Trip</button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-400">Run Build My Trip to match available transport.</div>
              )}
            </section>

            <section className="mt-6 flex flex-col gap-4 rounded-3xl bg-gray-900 p-6 text-white md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold"><CheckCircle className="h-4 w-4 text-emerald-400" /> Ready to turn the plan into a booking?</div>
                <p className="mt-2 max-w-2xl text-sm text-white/60">Start a custom trip with the destination and dates already carried into the booking form. You can review every resource before submitting.</p>
              </div>
              <Link to={customBookingLink} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#FF385C] px-5 py-3 text-sm font-bold text-white">Continue to booking <ArrowRight className="h-4 w-4" /></Link>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

function PlannerField({ icon: Icon, label, children }: { icon: ComponentType<{ className?: string }>; label: string; children: ReactNode }) {
  return (
    <label className="block rounded-2xl bg-gray-50 p-4">
      <span className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400"><Icon className="h-4 w-4" /> {label}</span>
      {children}
    </label>
  );
}

function RecommendationCard({ title, icon: Icon, empty, children }: { title: string; icon: ComponentType<{ className?: string }>; empty: string; children: ReactNode }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gray-50 text-gray-600"><Icon className="h-5 w-5" /></div><h2 className="font-extrabold text-gray-900">{title}</h2></div>
      <div className="mt-4 space-y-3">{hasChildren ? children : <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-400">{empty}</div>}</div>
    </section>
  );
}

function Fit({ score }: { score: number }) {
  return <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">{score}% fit</span>;
}
