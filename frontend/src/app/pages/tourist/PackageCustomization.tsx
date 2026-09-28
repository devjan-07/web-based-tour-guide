import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight, BedDouble, Car, Check, Clock3, Languages, MapPin, ShieldCheck, Star, Users } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import {
  accommodationRecommendationsApi,
  guidesApi,
  packagesApi,
  touristBookingsApi,
  vehicleRecommendationsApi,
  type AccommodationRecommendation,
  type GuideRecommendation,
  type TourPackage,
  type VehicleRecommendation,
} from "../../lib/api";

function today() { return new Date().toISOString().slice(0, 10); }
function addDays(value: string, days: number) { const date = new Date(value); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); }
function daysBetween(start: string, end: string) { return Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000)); }
function includedItems(value?: string) { return (value || "").split(",").map((x) => x.trim()).filter(Boolean); }
function includesAny(value: string, words: string[]) { const haystack = value.toLowerCase(); return words.some((word) => haystack.includes(word)); }

export default function PackageCustomization() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [pkg, setPkg] = useState<TourPackage | null>(null);
  const [guests, setGuests] = useState(Number(params.get("guests") || 2));
  const [checkIn, setCheckIn] = useState(params.get("checkIn") || today());
  const [checkOut, setCheckOut] = useState(params.get("checkOut") || "");
  const [language, setLanguage] = useState(params.get("language") || "English");
  const [luggage, setLuggage] = useState(Number(params.get("luggage") || 2));
  const [driverRequired, setDriverRequired] = useState(params.get("driver") !== "false");
  const [pickupTime, setPickupTime] = useState("09:00");
  const [returnTime, setReturnTime] = useState("18:00");
  const [guide, setGuide] = useState<GuideRecommendation | null>(null);
  const [stay, setStay] = useState<AccommodationRecommendation | null>(null);
  const [vehicle, setVehicle] = useState<VehicleRecommendation | null>(null);
  const [guideOptions, setGuideOptions] = useState<GuideRecommendation[]>([]);
  const [stayOptions, setStayOptions] = useState<AccommodationRecommendation[]>([]);
  const [vehicleOptions, setVehicleOptions] = useState<VehicleRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [openOption, setOpenOption] = useState<"guide" | "stay" | "vehicle" | null>(null);

  useEffect(() => {
    if (!id) return;
    packagesApi.get(Number(id))
      .then((item) => {
        setPkg(item);
        if (!params.get("checkOut")) setCheckOut(addDays(params.get("checkIn") || today(), Math.max(1, Number(item.duration || 1))));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load package."))
      .finally(() => setLoading(false));
  }, [id]);

  const included = useMemo(() => includedItems(pkg?.included), [pkg]);
  const hasIncludedAccommodation = includesAny(pkg?.included || "", ["accommodation", "hotel", "lodge", "villa", "stay"]);
  const hasIncludedGuide = includesAny(pkg?.included || "", ["guide", "naturalist"]);
  const hasIncludedTransport = includesAny(pkg?.included || "", ["transport", "transfer", "private van", "car", "vehicle", "jeep"]);

  useEffect(() => {
    if (!pkg) return;
    const destination = pkg.destinations?.[0] || "";
    setMatching(true);
    Promise.all([
      guidesApi.recommendations({ language, location: destination }),
      accommodationRecommendationsApi.list({ destination, travellers: guests }),
      vehicleRecommendationsApi.list({ passengers: guests, luggage, driverRequired, location: destination }),
    ]).then(([guides, stays, vehicles]) => {
      setGuideOptions(guides.slice(0, 3));
      setStayOptions(stays.slice(0, 3));
      setVehicleOptions(vehicles.slice(0, 3));
    }).catch(() => {
      setGuideOptions([]);
      setStayOptions([]);
      setVehicleOptions([]);
    }).finally(() => setMatching(false));
  }, [pkg, guests, language, luggage, driverRequired]);

  const tripDays = daysBetween(checkIn, checkOut);
  const estimatedTotal = useMemo(() => {
    if (!pkg) return 0;
    const base = Number(pkg.price || 0) * Math.max(1, guests);
    const guideCost = guide && !hasIncludedGuide ? Number(guide.guide.pricePerDay || 0) * tripDays : 0;
    const stayCost = stay && !hasIncludedAccommodation ? Number(stay.accommodation.price || 0) * tripDays : 0;
    const vehicleCost = vehicle && !hasIncludedTransport ? Number(vehicle.vehicle.pricePerDay || 0) * tripDays : 0;
    return base + guideCost + stayCost + vehicleCost;
  }, [pkg, guests, guide, stay, vehicle, tripDays, hasIncludedGuide, hasIncludedAccommodation, hasIncludedTransport]);

  const continueToBooking = async () => {
    if (!pkg) return;
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError("Please choose a check-out date after check-in.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const booking = await touristBookingsApi.create({
        bookingType: "PACKAGE",
        packageId: pkg.id,
        languagePreference: language,
        destination: pkg.destinations?.join(", ") || "",
        guideSelectionType: guide ? "VOYARA" : "OWN",
        guideId: guide?.guide.id ?? null,
        accommodationSelectionType: stay ? "VOYARA" : "OWN",
        accommodationId: stay?.accommodation.id ?? null,
        rooms: 1,
        roomType: "Double",
        vehicleSelectionType: vehicle ? "VOYARA" : "OWN",
        vehicleId: vehicle?.vehicle.id ?? null,
        pickupLocation: pkg.destinations?.[0] || "",
        pickupTime,
        returnLocation: pkg.destinations?.[0] || "",
        returnTime,
        driverRequired,
        luggageCount: luggage,
        checkIn,
        checkOut,
        guests,
        notes: "Package: " + pkg.name + ". Included services: " + (pkg.included || "Not specified") + ". Optional guide: " + (guide?.guide.name || "None") + ". Optional stay: " + (stay?.accommodation.name || "None") + ". Optional vehicle: " + (vehicle?.vehicle.name || "None") + ".",
      });
      navigate("/tourist/bookings/" + booking.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the booking.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Shell><div className="mx-auto max-w-7xl px-4 py-24 text-center text-sm font-semibold text-gray-500">Loading your journey...</div></Shell>;
  if (!pkg) return <Shell><div className="mx-auto max-w-4xl px-4 py-24 text-center"><p className="font-black text-gray-900">{error || "Package not found."}</p><Link to="/explore?tab=tours" className="mt-4 inline-flex rounded-full bg-[#ff385c] px-5 py-3 text-sm font-black text-white">Back to journeys</Link></div></Shell>;

  return (
    <Shell>
      <main>
        <section className="relative overflow-hidden bg-[#0b1f3a] text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.3fr_.7fr] lg:px-8 lg:py-12">
            <div className="relative min-h-[360px] overflow-hidden rounded-[2rem]">
              <img src={pkg.image} alt={pkg.name} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute left-5 top-5"><Link to={"/packages/" + pkg.id} className="inline-flex items-center gap-2 rounded-full bg-black/35 px-4 py-2 text-xs font-black text-white backdrop-blur"><ArrowLeft className="h-4 w-4" /> Back to journey</Link></div>
              <div className="absolute bottom-0 p-6 md:p-8">
                <div className="flex flex-wrap gap-2"><span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#10213b]">{pkg.category}</span><span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white">{pkg.duration} days</span></div>
                <h1 className="mt-3 max-w-3xl text-3xl font-black md:text-5xl">{pkg.name}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/80"><span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-300 text-amber-300" /> {Number(pkg.rating || 0).toFixed(1)}</span><span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {pkg.destinations.join(" · ")}</span></div>
              </div>
            </div>
            <div className="flex flex-col justify-end rounded-[2rem] bg-white p-6 text-[#10213b] shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Your journey starts from</p>
              <p className="mt-1 text-4xl font-black">LKR {Number(pkg.price || 0).toLocaleString()}</p>
              <p className="mt-1 text-sm text-gray-500">per traveller · package base</p>
              <div className="mt-5 grid grid-cols-2 gap-3"><Stat icon={Clock3} label="Duration" value={pkg.duration + " days"} /><Stat icon={Users} label="Group" value={"Up to " + (pkg.maxGroup || "flexible")} /></div>
              <div className="mt-5 rounded-2xl bg-emerald-50 p-4"><p className="text-xs font-black uppercase tracking-wider text-emerald-700">Package first</p><p className="mt-1 text-sm font-semibold leading-5 text-emerald-900">Your package already contains the services listed below. You only change them when you want an alternative.</p></div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-7 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
          <div className="space-y-7">
            <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
              <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">01 · Your dates</p><h2 className="mt-2 text-3xl font-black text-[#10213b]">Make the journey yours</h2></div><span className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-black text-gray-500">{tripDays} days</span></div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Travellers"><input type="number" min="1" max={pkg.maxGroup || 99} value={guests} onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))} /></Field>
                <Field label="Guide language"><select value={language} onChange={(e) => setLanguage(e.target.value)}><option>English</option><option>French</option><option>Spanish</option><option>Japanese</option><option>Korean</option><option>Chinese</option><option>German</option></select></Field>
                <Field label="Check-in"><input type="date" min={today()} value={checkIn} onChange={(e) => { setCheckIn(e.target.value); if (new Date(e.target.value) >= new Date(checkOut)) setCheckOut(addDays(e.target.value, Math.max(1, pkg.duration))); }} /></Field>
                <Field label="Check-out"><input type="date" min={checkIn} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} /></Field>
                <Field label="Luggage"><input type="number" min="0" value={luggage} onChange={(e) => setLuggage(Math.max(0, Number(e.target.value)))} /></Field>
                <Field label="Driver preference"><select value={driverRequired ? "Driver preferred" : "No driver"} onChange={(e) => setDriverRequired(e.target.value === "Driver preferred")}><option>Driver preferred</option><option>No driver</option></select></Field>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
              <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">02 · Already included</p><h2 className="mt-2 text-3xl font-black text-[#10213b]">Your package experience</h2><p className="mt-2 text-sm text-gray-500">Nothing needs to be selected again. These services belong to the package.</p></div><ShieldCheck className="h-8 w-8 text-emerald-500" /></div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {included.map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl bg-emerald-50/70 p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600"><Check className="h-4 w-4" /></span><div><p className="font-black text-[#10213b]">{item}</p><p className="text-xs font-semibold text-emerald-800/70">Included in package price</p></div></div>)}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
              <div><p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">03 · Personalise</p><h2 className="mt-2 text-3xl font-black text-[#10213b]">Change something only if you want to</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Voyara will keep the package intact unless you choose an alternative guide, stay or vehicle.</p></div>

              <ChoiceSection title="Local guide" icon={Languages} included={hasIncludedGuide} selected={guide?.guide.name} loading={matching} open={openOption === "guide"} onToggle={() => setOpenOption(openOption === "guide" ? null : "guide")} onClear={() => setGuide(null)}>
                {guideOptions.map((item) => <GuideCard key={item.guide.id} item={item} selected={guide?.guide.id === item.guide.id} onSelect={() => setGuide(item)} />)}
              </ChoiceSection>

              <ChoiceSection title="Where you stay" icon={BedDouble} included={hasIncludedAccommodation} selected={stay?.accommodation.name} loading={matching} open={openOption === "stay"} onToggle={() => setOpenOption(openOption === "stay" ? null : "stay")} onClear={() => setStay(null)}>
                {stayOptions.map((item) => <StayCard key={item.accommodation.id} item={item} selected={stay?.accommodation.id === item.accommodation.id} onSelect={() => setStay(item)} />)}
              </ChoiceSection>

              <ChoiceSection title="Transport" icon={Car} included={hasIncludedTransport} selected={vehicle?.vehicle.name} loading={matching} open={openOption === "vehicle"} onToggle={() => setOpenOption(openOption === "vehicle" ? null : "vehicle")} onClear={() => setVehicle(null)}>
                {vehicleOptions.map((item) => <VehicleCard key={item.vehicle.id} item={item} selected={vehicle?.vehicle.id === item.vehicle.id} onSelect={() => setVehicle(item)} />)}
              </ChoiceSection>
            </section>
          </div>

          <aside className="h-fit lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-[2rem] bg-[#0b1f3a] text-white shadow-xl">
              <div className="p-6">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-300">Your journey</p>
                <h2 className="mt-2 text-2xl font-black">{pkg.name}</h2>
                <p className="mt-1 text-sm text-white/60">{tripDays} days · {guests} traveller{guests === 1 ? "" : "s"}</p>
              </div>
              <div className="space-y-3 border-y border-white/10 p-6 text-sm">
                <Summary label="Dates" value={checkIn + " → " + checkOut} />
                <Summary label="Guide" value={guide ? guide.guide.name : hasIncludedGuide ? "Included in package" : "No guide selected"} />
                <Summary label="Stay" value={stay ? stay.accommodation.name : hasIncludedAccommodation ? "Included in package" : "No stay selected"} />
                <Summary label="Transport" value={vehicle ? vehicle.vehicle.name : hasIncludedTransport ? "Included services" : "Not selected"} />
                <Summary label="Language" value={language} />
              </div>
              <div className="bg-white p-6 text-[#10213b]">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Estimated total</p>
                <p className="mt-1 text-3xl font-black">LKR {estimatedTotal.toLocaleString()}</p>
                <p className="mt-2 text-xs leading-5 text-gray-500">Package base plus any selected optional services. The backend confirms the final booking total.</p>
                {error && <div className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-700">{error}</div>}
                <button type="button" disabled={saving} onClick={continueToBooking} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff385c] px-5 py-4 text-sm font-black text-white transition hover:bg-[#e91f47] disabled:opacity-60">
                  {saving ? "Creating booking..." : "Continue to booking"} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-[#f6f7f5]"><Navbar />{children}<Footer /></div>; }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block rounded-2xl bg-gray-50 p-4 ring-1 ring-gray-200"><span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</span><div className="mt-2">{children}</div></label>;
}

function Stat({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return <div className="rounded-2xl bg-gray-50 p-3"><Icon className="h-4 w-4 text-gray-400" /><p className="mt-2 text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p><p className="mt-1 text-sm font-black text-[#10213b]">{value}</p></div>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4"><span className="text-white/50">{label}</span><span className="text-right font-bold">{value}</span></div>;
}

function ChoiceSection({ title, icon: Icon, included, selected, loading, open, onToggle, onClear, children }: { title: string; icon: typeof BedDouble; included: boolean; selected?: string; loading: boolean; open: boolean; onToggle: () => void; onClear: () => void; children: React.ReactNode }) {
  return <div className="mt-4 overflow-hidden rounded-2xl border border-gray-200">
    <button type="button" onClick={onToggle} className="flex w-full items-center justify-between gap-4 bg-white p-5 text-left hover:bg-gray-50">
      <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-50 text-gray-600"><Icon className="h-5 w-5" /></span><div><p className="font-black text-[#10213b]">{title}</p><p className="mt-1 text-xs text-gray-500">{selected ? "Alternative: " + selected : included ? "Included with this package" : "Choose an optional service"}</p></div></div>
      <div className="flex items-center gap-2">{selected && <button type="button" onClick={(event) => { event.stopPropagation(); onClear(); }} className="rounded-full px-3 py-1.5 text-xs font-black text-gray-500 hover:bg-gray-100">Reset</button>}<span className={"rounded-full px-3 py-1.5 text-xs font-black " + (included ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600")}>{included ? "Included" : "Optional"}</span><ArrowRight className={"h-4 w-4 text-gray-400 transition " + (open ? "rotate-90" : "")} /></div>
    </button>
    {open && <div className="border-t border-gray-100 bg-[#fafafa] p-4">{loading ? <p className="p-4 text-sm text-gray-400">Finding suitable options...</p> : <div className="grid gap-3 md:grid-cols-2">{children}</div>}</div>}
  </div>;
}

function GuideCard({ item, selected, onSelect }: { item: GuideRecommendation; selected: boolean; onSelect: () => void }) {
  const guide = item.guide;
  return <button type="button" onClick={onSelect} className={"overflow-hidden rounded-2xl border bg-white text-left transition hover:-translate-y-0.5 hover:shadow-md " + (selected ? "border-rose-400 ring-2 ring-rose-100" : "border-gray-200")}>
    <div className="flex items-center gap-3 p-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-sm font-black text-gray-500">{guide.profilePhoto ? <img src={guide.profilePhoto} alt={guide.name} className="h-full w-full object-cover" /> : guide.initials}</div><div className="min-w-0 flex-1"><p className="truncate font-black text-[#10213b]">{guide.name}</p><p className="text-xs text-gray-500">{guide.location} · {guide.experience} years</p></div>{selected && <Check className="h-5 w-5 text-rose-500" />}</div>
    <div className="border-t border-gray-100 px-4 py-3"><div className="flex justify-between text-xs"><span className="font-bold text-gray-500">★ {Number(guide.rating || 0).toFixed(1)}</span><span className="font-black text-gray-800">LKR {Number(guide.pricePerDay || 0).toLocaleString()}/day</span></div><div className="mt-2 flex flex-wrap gap-1">{item.reasons.slice(0, 2).map((reason) => <span key={reason} className="rounded-full bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-500">{reason}</span>)}</div></div>
  </button>;
}

function StayCard({ item, selected, onSelect }: { item: AccommodationRecommendation; selected: boolean; onSelect: () => void }) {
  const stay = item.accommodation;
  return <button type="button" onClick={onSelect} className={"overflow-hidden rounded-2xl border bg-white text-left transition hover:-translate-y-0.5 hover:shadow-md " + (selected ? "border-rose-400 ring-2 ring-rose-100" : "border-gray-200")}>
    <div className="h-28 overflow-hidden bg-gray-100"><img src={stay.image} alt={stay.name} className="h-full w-full object-cover" /></div><div className="p-4"><div className="flex items-start justify-between gap-2"><div><p className="font-black text-[#10213b]">{stay.name}</p><p className="mt-1 text-xs text-gray-500">{stay.type} · {stay.location}</p></div>{selected && <Check className="h-5 w-5 text-rose-500" />}</div><div className="mt-3 flex items-center justify-between text-xs"><span className="font-bold text-gray-500">★ {Number(stay.rating || 0).toFixed(1)}</span><span className="font-black text-gray-800">LKR {Number(stay.price).toLocaleString()}/night</span></div></div>
  </button>;
}

function VehicleCard({ item, selected, onSelect }: { item: VehicleRecommendation; selected: boolean; onSelect: () => void }) {
  const vehicle = item.vehicle;
  return <button type="button" onClick={onSelect} className={"overflow-hidden rounded-2xl border bg-white text-left transition hover:-translate-y-0.5 hover:shadow-md " + (selected ? "border-rose-400 ring-2 ring-rose-100" : "border-gray-200")}>
    <div className="h-28 overflow-hidden bg-gray-100"><img src={vehicle.image} alt={vehicle.name} className="h-full w-full object-cover" /></div><div className="p-4"><div className="flex items-start justify-between gap-2"><div><p className="font-black text-[#10213b]">{vehicle.name}</p><p className="mt-1 text-xs text-gray-500">{vehicle.type} · {vehicle.capacity} seats</p></div>{selected && <Check className="h-5 w-5 text-rose-500" />}</div><div className="mt-3 flex items-center justify-between text-xs"><span className="font-bold text-gray-500">{vehicle.transmission} · {vehicle.fuel}</span><span className="font-black text-gray-800">LKR {Number(vehicle.pricePerDay).toLocaleString()}/day</span></div></div>
  </button>;
}
