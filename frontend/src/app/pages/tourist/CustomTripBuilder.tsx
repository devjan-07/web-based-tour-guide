import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, ArrowRight, BedDouble, Car, Check, Languages, MapPin, Star, Users } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import {
  accommodationRecommendationsApi,
  customTripApi,
  guidesApi,
  vehicleRecommendationsApi,
  type AccommodationRecommendation,
  type Guide,
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

function primaryDestinationName(value: string) {
  return value.split(",")[0].trim();
}

export default function CustomTripBuilder() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const destinationId = Number(params.get("destinationId") || 0) || null;
  const destination = params.get("destination") || "";
  const checkIn = params.get("checkIn") || today();
  const checkOut = params.get("checkOut") || addDays(checkIn, 3);
  const guests = Math.max(1, Number(params.get("guests") || 2));
  const language = params.get("language") || "English";
  const driverRequired = params.get("driverRequired") !== "false";
  const luggage = Math.max(0, Number(params.get("luggage") || 0));

  const [guides, setGuides] = useState<Guide[]>([]);
  const [stays, setStays] = useState<AccommodationRecommendation[]>([]);
  const [vehicles, setVehicles] = useState<VehicleRecommendation[]>([]);
  const [guideId, setGuideId] = useState<number | null>(null);
  const [stayId, setStayId] = useState<number | null>(null);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof customTripApi.preview>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    Promise.all([
      guidesApi.list(),
      accommodationRecommendationsApi.list({
        destinationId: destinationId || undefined,
        destination: destinationId ? undefined : primaryDestinationName(destination),
        travellers: guests,
      }),
      vehicleRecommendationsApi.list({
        passengers: guests,
        luggage,
        driverRequired,
        location: primaryDestinationName(destination),
      }),
    ])
      .then(([guideItems, stayItems, vehicleItems]) => {
        if (cancelled) return;
        const location = primaryDestinationName(destination).toLowerCase();
        const requestedLanguage = language.toLowerCase();

        const rankedGuides = guideItems
          .filter((guide) => guide.status === "Available")
          .map((guide) => {
            let score = 40;
            if (guide.languages?.some((item) => item.toLowerCase().includes(requestedLanguage))) score += 25;
            if (guide.location?.toLowerCase().includes(location) || guide.country?.toLowerCase().includes(location)) score += 10;
            if (Number(guide.rating || 0) >= 4.5) score += 10;
            if (Number(guide.experience || 0) >= 5) score += 10;
            return { guide, score: Math.min(score, 100) };
          })
          .sort((a, b) => b.score - a.score || Number(b.guide.rating || 0) - Number(a.guide.rating || 0))
          .slice(0, 5)
          .map((item) => item.guide);

        setGuides(rankedGuides);
        setStays(stayItems.slice(0, 5));
        setVehicles(vehicleItems.slice(0, 5));
        setGuideId(rankedGuides[0]?.id ?? null);
        setStayId(stayItems[0]?.accommodation.id ?? null);
        setVehicleId(vehicleItems[0]?.vehicle.id ?? null);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load custom trip options.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [destination, destinationId, driverRequired, guests, language, luggage]);

  const selectedGuide = useMemo(() => guides.find((item) => item.id === guideId) || null, [guides, guideId]);
  const selectedStay = useMemo(() => stays.find((item) => item.accommodation.id === stayId)?.accommodation || null, [stays, stayId]);
  const selectedVehicle = useMemo(() => vehicles.find((item) => item.vehicle.id === vehicleId)?.vehicle || null, [vehicles, vehicleId]);

  async function reviewTrip() {
    setReviewing(true);
    setError("");
    try {
      const result = await customTripApi.preview({
        destination,
        guideId,
        accommodationId: stayId,
        vehicleId,
        checkIn,
        checkOut,
        guests,
        rooms: 1,
        languagePreference: language,
        driverRequired,
        luggageCount: luggage,
      });
      setPreview(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not validate this custom trip.");
    } finally {
      setReviewing(false);
    }
  }

  function continueToBooking() {
    const query = new URLSearchParams({
      destination,
      checkIn,
      checkOut,
      guests: String(guests),
      guideId: guideId ? String(guideId) : "",
      accommodationId: stayId ? String(stayId) : "",
      vehicleId: vehicleId ? String(vehicleId) : "",
      language,
      driverRequired: String(driverRequired),
      luggage: String(luggage),
    });
    navigate("/tourist/bookings/new?" + query.toString());
  }

  return (
    <div className="min-h-screen bg-[#f6f7f5]">
      <Navbar />
      <main>
        <section className="bg-[#0b1f3a] text-white">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <Link to="/tourist/plan" className="inline-flex items-center gap-2 text-xs font-black text-white/70 hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to Build My Trip</Link>
            <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-rose-300">Your own journey</p>
            <h1 className="mt-2 text-4xl font-black md:text-5xl">Build My Own Trip</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">Choose the local services that fit your preferences. These recommendations are based on your destination, dates, group size and travel choices — not on a package.</p>
            <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold text-white/75">
              <span className="rounded-full bg-white/10 px-3 py-2"><MapPin className="mr-1 inline h-3.5 w-3.5" />{destination}</span>
              <span className="rounded-full bg-white/10 px-3 py-2">{checkIn} → {checkOut}</span>
              <span className="rounded-full bg-white/10 px-3 py-2"><Users className="mr-1 inline h-3.5 w-3.5" />{guests} traveller{guests === 1 ? "" : "s"}</span>
              <span className="rounded-full bg-white/10 px-3 py-2">{language}</span>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {error && <div className="mb-6 rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">{error}</div>}

          {loading ? (
            <div className="rounded-[2rem] bg-white p-12 text-center text-sm font-semibold text-gray-500 shadow-sm ring-1 ring-gray-200">Finding local options for your journey...</div>
          ) : (
            <>
              <ResourceSection title="Choose your guide" icon={Languages} description={"Guides matched to " + language + " and " + destination + "."}>
                {guides.map((guide) => <ResourceCard key={guide.id} selected={guide.id === guideId} onSelect={() => { setGuideId(guide.id); setPreview(null); }} image={guide.profilePhoto} title={guide.name} subtitle={guide.location + " · " + guide.experience + " years experience"} price={"LKR " + Number(guide.pricePerDay || 0).toLocaleString() + " / day"} rating={guide.rating} meta={guide.languages?.slice(0, 2).join(" · ")} />)}
              </ResourceSection>

              <ResourceSection title="Choose your stay" icon={BedDouble} description="Available stays matched to your destination and group size.">
                {stays.map(({ accommodation, suitabilityScore }) => <ResourceCard key={accommodation.id} selected={accommodation.id === stayId} onSelect={() => { setStayId(accommodation.id); setPreview(null); }} image={accommodation.image} title={accommodation.name} subtitle={accommodation.type + " · " + accommodation.location} price={"LKR " + Number(accommodation.price || 0).toLocaleString() + " / night"} rating={accommodation.rating} meta={Math.round(suitabilityScore) + "% fit"} />)}
              </ResourceSection>

              <ResourceSection title="Choose your transport" icon={Car} description={driverRequired ? "Private transport options that fit your group and luggage." : "Transport options matched to your group and luggage."}>
                {vehicles.map(({ vehicle, suitabilityScore }) => <ResourceCard key={vehicle.id} selected={vehicle.id === vehicleId} onSelect={() => { setVehicleId(vehicle.id); setPreview(null); }} image={vehicle.image} title={vehicle.name} subtitle={vehicle.type + " · " + vehicle.capacity + " seats"} price={"LKR " + Number(vehicle.pricePerDay || 0).toLocaleString() + " / day"} rating={vehicle.rating} meta={Math.round(suitabilityScore) + "% fit"} />)}
              </ResourceSection>

              <section className="mt-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div><p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">Review your choices</p><h2 className="mt-2 text-3xl font-black text-[#10213b]">Your custom journey</h2><p className="mt-2 text-sm text-gray-500">Voyara will re-check availability before the reservation is created.</p></div>
                  <button type="button" onClick={reviewTrip} disabled={reviewing} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#ff385c] px-6 py-3.5 text-sm font-black text-white disabled:opacity-50">{reviewing ? "Checking availability..." : "Review my trip"} <ArrowRight className="h-4 w-4" /></button>
                </div>
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <Summary title="Guide" value={selectedGuide?.name || "Not selected"} />
                  <Summary title="Stay" value={selectedStay?.name || "Not selected"} />
                  <Summary title="Transport" value={selectedVehicle?.name || "Not selected"} />
                </div>
                {preview && <div className="mt-6 rounded-2xl bg-[#f7f8fa] p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-black uppercase tracking-wider text-emerald-600">Availability confirmed</p><p className="mt-1 text-sm text-gray-600">The selected resources pass the current date, capacity and conflict checks.</p></div><p className="text-3xl font-black text-[#10213b]">LKR {Number(preview.total || 0).toLocaleString()}</p></div><button type="button" onClick={continueToBooking} className="mt-5 w-full rounded-xl bg-[#10213b] px-5 py-3.5 text-sm font-black text-white">Continue to booking</button></div>}
              </section>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ResourceSection({ title, icon: Icon, description, children }: { title: string; icon: typeof Languages; description: string; children: React.ReactNode }) {
  return <section className="mb-8 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8"><div><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-500"><Icon className="h-5 w-5" /></span><div><h2 className="text-2xl font-black text-[#10213b]">{title}</h2><p className="mt-1 text-sm text-gray-500">{description}</p></div></div></div><div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{children}</div></section>;
}

function ResourceCard({ selected, onSelect, image, title, subtitle, price, rating, meta }: { selected: boolean; onSelect: () => void; image?: string; title: string; subtitle: string; price: string; rating: number; meta: string }) {
  return <button type="button" onClick={onSelect} className={"overflow-hidden rounded-2xl border text-left transition hover:-translate-y-0.5 hover:shadow-lg " + (selected ? "border-rose-400 ring-2 ring-rose-200" : "border-gray-200")}>
    <div className="relative h-40 bg-gray-100">{image && <img src={image} alt="" className="h-full w-full object-cover" />} {selected && <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#ff385c] text-white"><Check className="h-5 w-5" /></span>}</div>
    <div className="p-4"><div className="flex items-start justify-between gap-3"><h3 className="font-black text-[#10213b]">{title}</h3><span className="shrink-0 inline-flex items-center gap-1 text-xs font-black text-gray-500"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />{Number(rating || 0).toFixed(1)}</span></div><p className="mt-1 text-xs text-gray-500">{subtitle}</p><p className="mt-3 text-sm font-black text-[#10213b]">{price}</p><p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">{meta}</p></div>
  </button>;
}

function Summary({ title, value }: { title: string; value: string }) {
  return <div className="rounded-2xl bg-[#f7f8fa] p-4"><p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{title}</p><p className="mt-2 truncate text-sm font-black text-[#10213b]">{value}</p></div>;
}
