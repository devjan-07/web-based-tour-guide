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
      setGuideOptions([]); setStayOptions([]); setVehicleOptions([]);
    }).finally(() => setMatching(false));
  }, [pkg, guests, language, luggage, driverRequired]);

  const tripDays = daysBetween(checkIn, checkOut);
  const estimatedTotal = useMemo(() => {
    if (!pkg) return 0;
    const base = Number(pkg.price || 0) * Math.max(1, guests);
    const guideCost = guide ? Number(guide.guide.pricePerDay || 0) * tripDays : 0;
    const stayCost = stay ? Number(stay.accommodation.price || 0) * tripDays : 0;
    const vehicleCost = vehicle ? Number(vehicle.vehicle.pricePerDay || 0) * tripDays : 0;
    return base + guideCost + stayCost + vehicleCost;
  }, [pkg, guests, guide, stay, vehicle, tripDays]);

  const continueToBooking = async () => {
    if (!pkg) return;
    if (new Date(checkOut) <= new Date(checkIn)) { setError("Please choose a check-out date after check-in."); return; }
    setSaving(true); setError("");
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
    } finally { setSaving(false); }
  };

  if (loading) return <PageShell><div className="mx-auto max-w-7xl px-4 py-20 text-center text-gray-500">Loading your package...</div></PageShell>;
  if (!pkg) return <PageShell><div className="mx-auto max-w-4xl px-4 py-20 text-center"><p className="font-black text-gray-900">{error || "Package not found."}</p><Link to="/explore?tab=tours" className="mt-4 inline-block font-bold text-rose-500">Back to packages</Link></div></PageShell>;

  return (
    <PageShell>
      <main>
        <section className="relative overflow-hidden bg-[#071a33] text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.25fr_.75fr] lg:px-8 lg:py-12">
            <div className="relative min-h-[360px] overflow-hidden rounded-[2rem]">
              <img src={pkg.image} alt={pkg.name} className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute left-5 top-5"><Link to={"/packages/" + pkg.id} className="inline-flex items-center gap-2 rounded-full bg-black/35 px-4 py-2 text-xs font-bold text-white backdrop-blur"><ArrowLeft className="h-4 w-4" /> Package details</Link></div>
              <div className="absolute bottom-0 p-6 md:p-8"><div className="flex flex-wrap gap-2"><span className="rounded-full bg-white/90 px-3 py-1 text-xs font-black text-gray-800">{pkg.category}</span><span className="rounded-full bg-black/30 px-3 py-1 text-xs font-bold text-white">{pkg.duration} days</span></div><h1 className="mt-3 text-3xl font-black md:text-5xl">{pkg.name}</h1><div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/80"><span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-current text-amber-300" />{Number(pkg.rating || 0).toFixed(1)}</span><span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{pkg.destinations.join(" · ")}</span></div></div>
            </div>
            <div className="self-end rounded-[2rem] bg-white p-6 text-[#10213b] shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-400">Starting from</p>
              <p className="mt-1 text-4xl font-black">LKR {Number(pkg.price || 0).toLocaleString()}</p>
              <p className="mt-1 text-sm text-gray-500">per traveller · package base</p>
              <div className="mt-5 grid grid-cols-2 gap-3"><Stat icon={Clock3} label="Duration" value={pkg.duration + " days"} /><Stat icon={Users} label="Group" value={"Up to " + (pkg.maxGroup || "flexible")} /></div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1.2fr_.8fr] lg:px-8">
          <div className="space-y-6">
            <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">Your journey</p>
              <h2 className="mt-1 text-2xl font-black text-[#10213b]">Set the essentials</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Travellers"><input type="number" min="1" max={pkg.maxGroup || 99} value={guests} onChange={e=>setGuests(Math.max(1,Number(e.target.value)))} /></Field>
                <Field label="Guide language"><select value={language} onChange={e=>setLanguage(e.target.value)}><option>English</option><option>French</option><option>Spanish</option><option>Japanese</option><option>Korean</option><option>Chinese</option><option>German</option></select></Field>
                <Field label="Check-in"><input type="date" min={today()} value={checkIn} onChange={e=>setCheckIn(e.target.value)} /></Field>
                <Field label="Check-out"><input type="date" min={checkIn} value={checkOut} onChange={e=>setCheckOut(e.target.value)} /></Field>
                <Field label="Luggage pieces"><input type="number" min="0" value={luggage} onChange={e=>setLuggage(Math.max(0,Number(e.target.value)))} /></Field>
                <Field label="Driver"><select value={driverRequired ? "Required" : "Not required"} onChange={e=>setDriverRequired(e.target.value === "Required")}><option>Required</option><option>Not required</option></select></Field>
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
              <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Included in the package</p><h2 className="mt-1 text-2xl font-black text-[#10213b]">Your base experience</h2></div><ShieldCheck className="h-7 w-7 text-emerald-500" /></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {included.length ? included.map((item) => <div key={item} className="flex items-start gap-3 rounded-2xl bg-emerald-50/70 p-4"><Check className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /><div><p className="font-black text-[#10213b]">{item}</p><p className="mt-1 text-xs text-emerald-800/70">Included in the package price</p></div></div>) : <p className="text-sm text-gray-500">The package does not currently list inclusions.</p>}
              </div>
            </section>

            <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
              <div><p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">Optional changes</p><h2 className="mt-1 text-2xl font-black text-[#10213b]">Personalise without rebuilding the trip</h2><p className="mt-2 text-sm text-gray-500">Your package already covers the services listed above. Choose an alternative only when you want to change or add something.</p></div>

              <OptionGroup icon={Languages} title="Guide" included={hasIncludedGuide} current={guide?.guide.name} loading={matching} empty="No guide matches are available right now." onClear={()=>setGuide(null)}>
                {guideOptions.map((item)=><OptionCard key={item.guide.id} title={item.guide.name} subtitle={(item.guide.location || item.guide.country) + " · " + item.guide.experience + " years"} price={item.guide.pricePerDay ? "LKR " + Number(item.guide.pricePerDay).toLocaleString() + "/day" : "Price on request"} selected={guide?.guide.id===item.guide.id} onClick={()=>setGuide(item)} />)}
              </OptionGroup>

              <OptionGroup icon={BedDouble} title="Stay" included={hasIncludedAccommodation} current={stay?.accommodation.name} loading={matching} empty="No stay matches are available right now." onClear={()=>setStay(null)}>
                {stayOptions.map((item)=><OptionCard key={item.accommodation.id} title={item.accommodation.name} subtitle={item.accommodation.type + " · " + item.accommodation.location} price={"LKR " + Number(item.accommodation.price || 0).toLocaleString() + "/night"} selected={stay?.accommodation.id===item.accommodation.id} onClick={()=>setStay(item)} />)}
              </OptionGroup>

              <OptionGroup icon={Car} title="Transport" included={hasIncludedTransport} current={vehicle?.vehicle.name} loading={matching} empty="No vehicle matches are available right now." onClear={()=>setVehicle(null)}>
                {vehicleOptions.map((item)=><OptionCard key={item.vehicle.id} title={item.vehicle.name} subtitle={item.vehicle.type + " · " + item.vehicle.capacity + " seats"} price={"LKR " + Number(item.vehicle.pricePerDay || 0).toLocaleString() + "/day"} selected={vehicle?.vehicle.id===item.vehicle.id} onClick={()=>setVehicle(item)} />)}
              </OptionGroup>
            </section>
          </div>

          <aside className="h-fit lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-[2rem] bg-[#10213b] text-white shadow-xl">
              <div className="p-6 md:p-7"><p className="text-xs font-black uppercase tracking-[0.18em] text-rose-300">Ready when you are</p><h2 className="mt-1 text-2xl font-black">Your trip summary</h2><div className="mt-5 space-y-4"><Summary label="Package" value={pkg.name} /><Summary label="Travellers" value={String(guests)} /><Summary label="Dates" value={checkIn + " → " + checkOut} /><Summary label="Included" value={included.length + " package services"} /><Summary label="Optional changes" value={String([guide,stay,vehicle].filter(Boolean).length)} /></div></div>
              <div className="bg-white p-6 text-[#10213b]"><p className="text-xs font-black uppercase tracking-wider text-gray-400">Estimated total</p><p className="mt-1 text-4xl font-black">LKR {estimatedTotal.toLocaleString()}</p><p className="mt-2 text-xs leading-5 text-gray-500">Package price + any optional services selected above. The backend confirms the final booking total.</p><button type="button" disabled={saving} onClick={continueToBooking} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF385C] px-5 py-4 text-sm font-black text-white disabled:opacity-60">{saving ? "Creating booking..." : "Continue to booking"} <ArrowRight className="h-4 w-4" /></button></div>
            </div>
            {error && <div className="mt-4 rounded-2xl bg-rose-50 p-4 text-sm font-bold text-rose-700">{error}</div>}
          </aside>
        </section>
      </main>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) { return <div className="min-h-screen bg-[#f7f8fa]"><Navbar />{children}<Footer /></div>; }
function Field({ label, children }: { label:string; children:React.ReactNode }) { return <label className="block"><span className="mb-2 block text-xs font-black uppercase tracking-wider text-gray-400">{label}</span><div className="rounded-xl bg-gray-50 px-4 py-3 ring-1 ring-gray-200 [&>input]:w-full [&>input]:bg-transparent [&>input]:outline-none [&>select]:w-full [&>select]:bg-transparent [&>select]:outline-none">{children}</div></label>; }
function Stat({ icon:Icon,label,value }:{icon:typeof Clock3;label:string;value:string}){return <div className="rounded-xl bg-gray-50 p-3"><Icon className="h-4 w-4 text-gray-400"/><p className="mt-2 text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p><p className="mt-0.5 text-sm font-black">{value}</p></div>}
function Summary({label,value}:{label:string;value:string}){return <div className="flex justify-between gap-4 border-b border-white/10 pb-3 text-sm"><span className="text-white/55">{label}</span><span className="text-right font-bold">{value}</span></div>}
function OptionGroup({icon:Icon,title,included,current,loading,empty,children,onClear}:{icon:typeof Languages;title:string;included:boolean;current?:string;loading:boolean;empty:string;children:React.ReactNode;onClear:()=>void}){return <div className="mt-6 border-t border-gray-100 pt-6"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50"><Icon className="h-5 w-5 text-gray-600"/></div><div><h3 className="font-black text-[#10213b]">{title}</h3><p className="mt-1 text-xs text-gray-500">{included ? "Included in your package" : "Not listed as included · choose if you need it"}{current ? " · " + current : ""}</p></div></div>{current && <button type="button" onClick={onClear} className="text-xs font-bold text-gray-400 hover:text-gray-700">Remove</button>}</div><div className="mt-4 grid gap-3 md:grid-cols-2">{loading ? <div className="text-xs text-gray-400">Finding options…</div> : children}</div>{!loading && !children && <p className="mt-3 text-xs text-gray-400">{empty}</p>}</div>}
function OptionCard({title,subtitle,price,selected,onClick}:{title:string;subtitle:string;price:string;selected:boolean;onClick:()=>void}){return <button type="button" onClick={onClick} className={"rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm "+(selected?"border-rose-400 bg-rose-50":"border-gray-200 bg-white")}><div className="flex items-start justify-between gap-3"><div><p className="font-black text-[#10213b]">{title}</p><p className="mt-1 text-xs text-gray-500">{subtitle}</p></div>{selected?<span className="rounded-full bg-rose-500 px-2 py-1 text-[10px] font-black text-white">Selected</span>:<span className="text-xs font-bold text-gray-400">Choose</span>}</div><p className="mt-3 text-xs font-black text-gray-700">{price}</p></button>}
