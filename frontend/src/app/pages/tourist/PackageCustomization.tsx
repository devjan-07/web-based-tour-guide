import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, BedDouble, Car, CheckCircle2, Languages, Users } from "lucide-react";
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

const storageKey = "voyara_package_customization_v1";

function addDays(value: string, days: number) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(start: string, end: string) {
  return Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
}

export default function PackageCustomization() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pkg, setPkg] = useState<TourPackage | null>(null);
  const [guests, setGuests] = useState(2);
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState("");
  const [language, setLanguage] = useState("English");
  const [guide, setGuide] = useState<GuideRecommendation | null>(null);
  const [stay, setStay] = useState<AccommodationRecommendation | null>(null);
  const [vehicle, setVehicle] = useState<VehicleRecommendation | null>(null);
  const [driverRequired, setDriverRequired] = useState(true);
  const [luggage, setLuggage] = useState(2);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    packagesApi.get(Number(id)).then((item) => {
      setPkg(item);
      setCheckOut(addDays(today(), Math.max(1, Number(item.duration || 1))));
    }).catch((e) => setError(e instanceof Error ? e.message : "Could not load package."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!pkg) return;
    const destination = pkg.destinations?.[0] || "";
    guidesApi.recommendations({ language, location: destination })
      .then((items) => setGuide(items[0] || null))
      .catch(() => setGuide(null));
    accommodationRecommendationsApi.list({ destination, travellers: guests })
      .then((items) => setStay(items[0] || null))
      .catch(() => setStay(null));
    vehicleRecommendationsApi.list({ passengers: guests, luggage, driverRequired, location: destination })
      .then((items) => setVehicle(items[0] || null))
      .catch(() => setVehicle(null));
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

  const saveSelection = () => {
    localStorage.setItem(storageKey, JSON.stringify({
      packageId: pkg?.id,
      guests,
      checkIn,
      checkOut,
      language,
      guideId: guide?.guide.id ?? null,
      accommodationId: stay?.accommodation.id ?? null,
      vehicleId: vehicle?.vehicle.id ?? null,
      driverRequired,
      luggage,
      estimatedTotal,
    }));
  };

  const continueToBooking = async () => {
    if (!pkg) return;
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError("Check-out must be after check-in.");
      return;
    }
    setSaving(true);
    setError("");
    saveSelection();
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
        returnLocation: pkg.destinations?.[0] || "",
        driverRequired,
        luggageCount: luggage,
        checkIn,
        checkOut,
        guests,
        notes: `Customized package: ${pkg.name}. Guide: ${guide?.guide.name || "Not selected"}. Accommodation: ${stay?.accommodation.name || "Not selected"}. Vehicle: ${vehicle?.vehicle.name || "Not selected"}. Estimated customized total: LKR ${estimatedTotal.toLocaleString()}.`,
      });
      navigate(`/tourist/bookings/${booking.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create the customized booking.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><main className="mx-auto max-w-5xl px-4 py-16 text-center text-sm text-gray-500">Loading package...</main><Footer /></div>;
  if (!pkg) return <div className="min-h-screen bg-gray-50"><Navbar /><main className="mx-auto max-w-5xl px-4 py-16 text-center"><p className="font-bold text-gray-900">{error || "Package not found."}</p><Link to="/" className="mt-4 inline-block text-sm font-bold text-rose-500">Back to explore</Link></main><Footer /></div>;

  const cards = [
    { icon: Languages, title: "Guide match", value: guide?.guide.name || "No match available", reason: guide?.reasons?.[0] },
    { icon: BedDouble, title: "Stay match", value: stay?.accommodation.name || "No match available", reason: stay?.reasons?.[0] },
    { icon: Car, title: "Transport match", value: vehicle?.vehicle.name || "No match available", reason: vehicle?.reasons?.[0] },
  ];

  return <div className="min-h-screen bg-gray-50"><Navbar />
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to={`/packages/${pkg.id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500"><ArrowLeft className="h-4 w-4" /> Back to package</Link>
      <section className="mt-5 overflow-hidden rounded-3xl bg-gradient-to-br from-[#003580] to-[#0057B8] p-7 text-white md:p-10">
        <p className="text-xs font-bold uppercase tracking-widest text-white/70">Package customization</p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">{pkg.name}</h1>
        <p className="mt-3 max-w-2xl text-sm text-white/80">Keep the package, then tailor the people, dates and supporting travel services around it.</p>
      </section>

      {error && <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
        <div className="space-y-5">
          <div className="rounded-3xl border border-gray-200 bg-white p-6">
            <h2 className="text-xl font-extrabold text-gray-900">Your trip</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-gray-700">Guests<input type="number" min="1" max={pkg.maxGroup || 99} value={guests} onChange={e => setGuests(Math.max(1, Number(e.target.value)))} className="mt-2 w-full rounded-xl border border-gray-200 p-3 outline-none" /></label>
              <label className="text-sm font-semibold text-gray-700">Guide language<select value={language} onChange={e => setLanguage(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 p-3 outline-none"><option>English</option><option>French</option><option>Spanish</option><option>Japanese</option><option>Korean</option><option>Chinese</option><option>German</option></select></label>
              <label className="text-sm font-semibold text-gray-700">Check-in<input type="date" min={today()} value={checkIn} onChange={e => setCheckIn(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 p-3 outline-none" /></label>
              <label className="text-sm font-semibold text-gray-700">Check-out<input type="date" min={checkIn} value={checkOut} onChange={e => setCheckOut(e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 p-3 outline-none" /></label>
              <label className="text-sm font-semibold text-gray-700">Luggage pieces<input type="number" min="0" value={luggage} onChange={e => setLuggage(Math.max(0, Number(e.target.value)))} className="mt-2 w-full rounded-xl border border-gray-200 p-3 outline-none" /></label>
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 text-sm font-semibold text-gray-700"><input type="checkbox" checked={driverRequired} onChange={e => setDriverRequired(e.target.checked)} /> Driver required</label>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {cards.map(({ icon: Icon, title, value, reason }) => <article key={title} className="rounded-3xl border border-gray-200 bg-white p-5">
              <Icon className="h-5 w-5 text-rose-500" /><p className="mt-3 text-xs font-bold uppercase tracking-widest text-gray-400">{title}</p><h3 className="mt-2 font-extrabold text-gray-900">{value}</h3><p className="mt-2 text-xs leading-5 text-gray-500">{reason || "Based on your current trip details."}</p>
            </article>)}
          </div>
        </div>

        <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Estimated customized price</p>
          <p className="mt-2 text-3xl font-extrabold text-gray-900">LKR {estimatedTotal.toLocaleString()}</p>
          <p className="mt-2 text-xs leading-5 text-gray-500">Estimate = package price × guests + selected guide, accommodation and vehicle daily rates. Final booking total is confirmed by the backend.</p>
          <div className="mt-5 space-y-3 border-t border-gray-100 pt-5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Base package</span><b>LKR {(Number(pkg.price || 0) * guests).toLocaleString()}</b></div>
            <div className="flex justify-between"><span className="text-gray-500">Trip length</span><b>{tripDays} days</b></div>
            <div className="flex justify-between"><span className="text-gray-500">Add-ons</span><b>{[guide, stay, vehicle].filter(Boolean).length}</b></div>
          </div>
          <button disabled={saving} onClick={continueToBooking} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF385C] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><CheckCircle2 className="h-4 w-4" />{saving ? "Creating booking..." : "Continue with this package"}</button>
          <Link to="/tourist/my-trip" className="mt-3 block text-center text-xs font-bold text-gray-500">Save the plan in My Trip instead</Link>
        </aside>
      </section>
    </main><Footer /></div>;
}
