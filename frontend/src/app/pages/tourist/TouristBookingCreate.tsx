import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, BedDouble, CalendarDays, Car, CheckCircle, CreditCard, Fuel, Languages, MapPin, Package, Users } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { ResourceReviews, RatingStars } from "../../components/ResourceReviews";
import { useAuth } from "../../context/AuthContext";
import { TOUR_GUIDE_LANGUAGES, accommodationRecommendationsApi, guidesApi, packagesApi, vehicleRecommendationsApi, touristBookingsApi, type Accommodation, type AccommodationRecommendation, type Guide, type TourPackage, type Vehicle, type VehicleRecommendation } from "../../lib/api";

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

const roomTypes = ["Single", "Double", "Twin", "Family", "Suite"];

export default function TouristBookingCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const packageId = searchParams.get("packageId");
  const destinationIdParam = searchParams.get("destinationId");
  const destinationParam = searchParams.get("destination") || "";
  const customGuideIdParam = searchParams.get("guideId");
  const customAccommodationIdParam = searchParams.get("accommodationId");
  const customVehicleIdParam = searchParams.get("vehicleId");
  const bookingType = packageId ? "PACKAGE" : "CUSTOM";

  const [tourPackage, setTourPackage] = useState<TourPackage | null>(null);
  const [primaryDestinationId, setPrimaryDestinationId] = useState<number | null>(destinationIdParam ? Number(destinationIdParam) : null);
  const [destination, setDestination] = useState(destinationParam);
  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || today());
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || addDays(searchParams.get("checkIn") || today(), 1));
  const [guests, setGuests] = useState(Math.max(1, Number(searchParams.get("guests") || 1)));
  const [guides, setGuides] = useState<Guide[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<number | null>(customGuideIdParam ? Number(customGuideIdParam) : null);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [selectedAccommodationId, setSelectedAccommodationId] = useState<number | null>(customAccommodationIdParam ? Number(customAccommodationIdParam) : null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleRecommendations, setVehicleRecommendations] = useState<VehicleRecommendation[]>([]);
  const [accommodationRecommendations, setAccommodationRecommendations] = useState<AccommodationRecommendation[]>([]);
  const [accommodationBudget, setAccommodationBudget] = useState(0);
  const [accommodationType, setAccommodationType] = useState("");
  const [accommodationPreferences, setAccommodationPreferences] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(customVehicleIdParam ? Number(customVehicleIdParam) : null);
  const [languagePreference, setLanguagePreference] = useState(searchParams.get("language") || "English");
  const [rooms, setRooms] = useState(1);
  const [roomType, setRoomType] = useState(roomTypes[1]);
  const [pickupLocation, setPickupLocation] = useState(destinationParam || "Sri Lanka");
  const [pickupTime, setPickupTime] = useState("09:00");
  const [returnLocation, setReturnLocation] = useState(destinationParam || "Sri Lanka");
  const [returnTime, setReturnTime] = useState("18:00");
  const [driverRequired, setDriverRequired] = useState(searchParams.get("driverRequired") !== "false");
  const [luggageCount, setLuggageCount] = useState(Math.max(0, Number(searchParams.get("luggage") || 0)));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(!!packageId);
  const [guidesLoading, setGuidesLoading] = useState(true);
  const [accommodationsLoading, setAccommodationsLoading] = useState(true);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!packageId) return;

    let cancelled = false;
    setLoading(true);
    packagesApi
      .get(Number(packageId))
      .then((item) => {
        if (cancelled) return;
        setTourPackage(item);
        setDestination(item.destinations?.[0] || item.destinations?.join(", ") || "");
        setPrimaryDestinationId(null);
        setCheckOut(addDays(today(), Math.max(1, Number(item.duration || 1))));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load package details");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [packageId]);

  useEffect(() => {
    let cancelled = false;
    setGuidesLoading(true);
    guidesApi
      .list()
      .then((items) => {
        if (!cancelled) setGuides(items.filter((guide) => guide.status === "Available"));
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to load guides", err);
      })
      .finally(() => {
        if (!cancelled) setGuidesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setAccommodationsLoading(true);
    accommodationRecommendationsApi
      .list({
        destinationId: primaryDestinationId || undefined,
        destination: primaryDestinationId ? undefined : primaryDestinationName(destination),
        travellers: guests,
        maxDailyBudget: accommodationBudget || undefined,
        accommodationType: accommodationType || undefined,
        preferences: accommodationPreferences || undefined,
      })
      .then((recommendations) => {
        if (!cancelled) {
          setAccommodationRecommendations(recommendations);
          setAccommodations(recommendations.map((item) => item.accommodation));
        }
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to load accommodations", err);
      })
      .finally(() => {
        if (!cancelled) setAccommodationsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [destination, primaryDestinationId, guests, accommodationBudget, accommodationType, accommodationPreferences]);

  useEffect(() => {
    let cancelled = false;
    setVehiclesLoading(true);
    vehicleRecommendationsApi
      .list({
        passengers: guests,
        luggage: luggageCount,
        driverRequired,
        location: pickupLocation || primaryDestinationName(destination),
      })
      .then((recommendations) => {
        if (cancelled) return;
        setVehicleRecommendations(recommendations);
        const available = recommendations.map((item) => item.vehicle);
        setVehicles(available);
        setSelectedVehicleId((current) => current && available.some((vehicle) => vehicle.id === current) ? current : null);
      })
      .catch((err) => {
        if (!cancelled) console.error("Failed to load vehicles", err);
      })
      .finally(() => {
        if (!cancelled) {
          setVehiclesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [guests, luggageCount, driverRequired, pickupLocation, destination]);

  const nearbyGuides = useMemo(() => {
    const nearby = guides.filter((guide) => isNearDestination(destination, guide.location, guide.country));
    return nearby.length ? nearby : guides;
  }, [destination, guides]);

  const nearbyAccommodations = useMemo(() => {
    return accommodations;
  }, [accommodations, destination]);

  useEffect(() => {
    if (!nearbyGuides.length) {
      setSelectedGuideId(null);
      return;
    }
    setSelectedGuideId((current) => current && nearbyGuides.some((guide) => guide.id === current) ? current : nearbyGuides[0].id);
  }, [nearbyGuides]);

  useEffect(() => {
    if (!nearbyAccommodations.length) {
      setSelectedAccommodationId(null);
      return;
    }
    setSelectedAccommodationId((current) => current && nearbyAccommodations.some((accommodation) => accommodation.id === current) ? current : nearbyAccommodations[0].id);
  }, [nearbyAccommodations]);

  useEffect(() => {
    const fallback = primaryDestinationName(destination) || "Sri Lanka";
    setPickupLocation((current) => current && current !== "Sri Lanka" ? current : fallback);
    setReturnLocation((current) => current && current !== "Sri Lanka" ? current : fallback);
  }, [destination]);

  const total = useMemo(() => {
    const base = Number(tourPackage?.price || 0);
    const days = tripDays(checkIn, checkOut);
    const selectedGuide = guides.find((guide) => guide.id === selectedGuideId);
    const selectedAccommodation = accommodations.find((accommodation) => accommodation.id === selectedAccommodationId);
    const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);
    const guideTotal = selectedGuide ? Number(selectedGuide.pricePerDay || 0) * days : 0;
    const stayTotal = selectedAccommodation ? Number(selectedAccommodation.price || 0) * days : 0;
    const vehicleTotal = selectedVehicle ? Number(selectedVehicle.pricePerDay || 0) * days : 0;
    if (!base && !guideTotal && !stayTotal && !vehicleTotal) return 0;
    return (base * Math.max(1, guests)) + guideTotal + stayTotal + vehicleTotal;
  }, [accommodations, checkIn, checkOut, guests, guides, selectedAccommodationId, selectedGuideId, selectedVehicleId, tourPackage?.price, vehicles]);

  const selectedGuide = useMemo(
    () => guides.find((guide) => guide.id === selectedGuideId) || null,
    [guides, selectedGuideId]
  );

  const selectedAccommodation = useMemo(
    () => accommodations.find((accommodation) => accommodation.id === selectedAccommodationId) || null,
    [accommodations, selectedAccommodationId]
  );

  const selectedVehicle = useMemo(
    () => vehicles.find((vehicle) => vehicle.id === selectedVehicleId) || null,
    [selectedVehicleId, vehicles]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!checkIn || !checkOut) {
      setError("Please select both check-in and check-out dates.");
      return;
    }
    if (new Date(checkOut) <= new Date(checkIn)) {
      setError("Check-out must be after check-in.");
      return;
    }
    if (guests < 1) {
      setError("At least one guest is required.");
      return;
    }
    if (selectedAccommodation && rooms < 1) {
      setError("At least one room is required.");
      return;
    }

    setSubmitting(true);
    try {
      const booking = await touristBookingsApi.create({
        bookingType,
        packageId: tourPackage?.id ?? null,
        languagePreference,
        destination: destination.trim(),
        guideSelectionType: "VOYARA",
        guideId: selectedGuide?.id ?? null,
        accommodationSelectionType: "VOYARA",
        accommodationId: selectedAccommodation?.id ?? null,
        rooms: selectedAccommodation ? rooms : 1,
        roomType: selectedAccommodation ? roomType : "",
        vehicleSelectionType: selectedVehicle ? "VOYARA" : "OWN",
        vehicleId: selectedVehicle?.id ?? null,
        pickupLocation: selectedVehicle ? pickupLocation.trim() : "",
        pickupTime: selectedVehicle ? pickupTime : "",
        returnLocation: selectedVehicle ? returnLocation.trim() : "",
        returnTime: selectedVehicle ? returnTime : "",
        driverRequired,
        luggageCount,
        checkIn,
        checkOut,
        guests,
        notes: notes.trim() || selectedResourceNote(bookingType, selectedGuide, selectedAccommodation, selectedVehicle, languagePreference),
      });
      navigate(`/tourist/bookings/${booking.id}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f5]">
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-[#0b1f3a] text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.25fr_.75fr] lg:px-8 lg:py-12">
            <div className="relative min-h-[330px] overflow-hidden rounded-[2rem]">
              {tourPackage?.image ? (
                <img src={tourPackage.image} alt={tourPackage.name} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#183d68] via-[#0b1f3a] to-[#07111f]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute left-5 top-5"><Link to="/explore" className="inline-flex items-center gap-2 rounded-full bg-black/35 px-4 py-2 text-xs font-black text-white backdrop-blur"><ArrowLeft className="h-4 w-4" /> Back to exploring</Link></div>
              <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-300">Secure your journey</p>
                <h1 className="mt-2 text-3xl font-black md:text-5xl">{bookingTitle(bookingType, destination, tourPackage, selectedAccommodation, selectedVehicle)}</h1>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-white/75">
                  <span>{destination || "Sri Lanka"}</span>
                  <span>·</span><span>{tripDays(checkIn, checkOut)} days</span>
                  <span>·</span><span>{guests} traveller{guests === 1 ? "" : "s"}</span>
                </div>
              </div>
            </div>
            <div className="rounded-[2rem] bg-white p-6 text-[#10213b] shadow-2xl md:p-7">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">Booking at a glance</p>
              <div className="mt-5 space-y-4">
                <BookingHeroStat icon={MapPin} label="Destination" value={destination || "Sri Lanka"} />
                <BookingHeroStat icon={CalendarDays} label="Travel dates" value={checkIn + " → " + checkOut} />
                <BookingHeroStat icon={Users} label="Travellers" value={String(guests)} />
              </div>
              <div className="mt-6 rounded-2xl bg-[#f7f8fa] p-4">
                <p className="text-xs font-black text-gray-500">One clear checkout</p>
                <p className="mt-1 text-sm leading-5 text-gray-600">Choose only the services you need, review the journey, then create the reservation.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          {loading ? (
            <div className="rounded-[2rem] bg-white p-12 text-center text-sm font-semibold text-gray-500 shadow-sm ring-1 ring-gray-200">Preparing your booking...</div>
          ) : (
            bookingType === "CUSTOM" ? (
              <form onSubmit={handleSubmit} className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-7">
                {error && <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">{error}</div>}

                <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">01 · Your trip</p>
                      <h2 className="mt-2 text-3xl font-black text-[#10213b]">Your custom journey</h2>
                      <p className="mt-2 text-sm leading-6 text-gray-500">You already selected your guide, stay and transport. This step is for confirming the trip details before booking.</p>
                    </div>
                    <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 sm:inline-flex">Selections saved</span>
                  </div>
                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    <Field icon={MapPin} label="Destination"><input value={destination} readOnly className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field>
                    <Field icon={Package} label="Journey type"><input value="Custom trip" readOnly className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field>
                    <Field icon={CalendarDays} label="Check-in"><input type="date" value={checkIn} onChange={(e) => { setCheckIn(e.target.value); if (new Date(checkOut) <= new Date(e.target.value)) setCheckOut(addDays(e.target.value, 1)); }} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field>
                    <Field icon={CalendarDays} label="Check-out"><input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field>
                    <Field icon={Users} label="Travellers"><input type="number" min="1" value={guests} onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field>
                    <Field icon={Languages} label="Guide language"><select value={languagePreference} onChange={(e) => setLanguagePreference(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none">{TOUR_GUIDE_LANGUAGES.map((language) => <option key={language}>{language}</option>)}</select></Field>
                  </div>
                </section>

                <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">02 · Selected services</p>
                  <h2 className="mt-2 text-3xl font-black text-[#10213b]">Your choices</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-500">These are the services you selected while building your trip. Voyara will validate their availability again when you create the reservation.</p>
                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <SelectedServiceCard title="Guide" value={selectedGuide ? guideLabel(selectedGuide) : "Not selected"} detail={selectedGuide ? `LKR ${Number(selectedGuide.pricePerDay || 0).toLocaleString()} / day` : "Staff assignment"} />
                    <SelectedServiceCard title="Stay" value={selectedAccommodation ? accommodationLabel(selectedAccommodation) : "Not selected"} detail={selectedAccommodation ? `LKR ${Number(selectedAccommodation.price || 0).toLocaleString()} / night` : "Staff assignment"} />
                    <SelectedServiceCard title="Transport" value={selectedVehicle ? vehicleLabel(selectedVehicle) : "Own vehicle"} detail={selectedVehicle ? `LKR ${Number(selectedVehicle.pricePerDay || 0).toLocaleString()} / day` : "No vehicle selected"} />
                  </div>
                  <Link to={`/tourist/custom-trip?destination=${encodeURIComponent(destination)}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${guests}&guideId=${selectedGuideId || ""}&accommodationId=${selectedAccommodationId || ""}&vehicleId=${selectedVehicleId || ""}&language=${encodeURIComponent(languagePreference)}&driverRequired=${driverRequired}&luggage=${luggageCount}`} className="mt-5 inline-flex text-sm font-black text-rose-500 hover:text-rose-600">Edit my selections</Link>
                </section>

                <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">03 · Final details</p>
                  <h2 className="mt-2 text-3xl font-black text-[#10213b]">Anything else we should know?</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-500">Add the practical details Voyara needs to complete your reservation.</p>
                  {selectedVehicle && <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <Field icon={MapPin} label="Pickup location"><input value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field>
                    <Field icon={CalendarDays} label="Pickup time"><input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field>
                    <Field icon={MapPin} label="Return location"><input value={returnLocation} onChange={(e) => setReturnLocation(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field>
                    <Field icon={CalendarDays} label="Return time"><input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field>
                    <Field icon={Car} label="Driver"><select value={driverRequired ? "Yes" : "No"} onChange={(e) => setDriverRequired(e.target.value === "Yes")} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none"><option>Yes</option><option>No</option></select></Field>
                    <Field icon={Package} label="Luggage"><input type="number" min="0" value={luggageCount} onChange={(e) => setLuggageCount(Math.max(0, Number(e.target.value)))} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field>
                  </div>}
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} className="mt-5 w-full resize-none rounded-2xl bg-gray-50 p-4 text-sm font-medium text-gray-700 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-rose-200" placeholder="Arrival details, dietary needs, special requests..." />
                </section>
              </div>

              <aside className="h-fit lg:sticky lg:top-24">
                <div className="overflow-hidden rounded-[2rem] bg-[#0b1f3a] text-white shadow-xl">
                  <div className="p-6"><p className="text-xs font-black uppercase tracking-[0.2em] text-rose-300">Final confirmation</p><h2 className="mt-2 text-2xl font-black">{destination || "Sri Lanka"} Custom Trip</h2></div>
                  <div className="space-y-4 border-y border-white/10 p-6 text-sm">
                    <SummaryLine label="Dates" value={checkIn + " → " + checkOut} />
                    <SummaryLine label="Travellers" value={String(guests)} />
                    <SummaryLine label="Guide" value={selectedGuide ? guideLabel(selectedGuide) : "Staff assignment"} />
                    <SummaryLine label="Stay" value={selectedAccommodation ? accommodationLabel(selectedAccommodation) : "Staff assignment"} />
                    <SummaryLine label="Vehicle" value={selectedVehicle ? vehicleLabel(selectedVehicle) : OWN_VEHICLE_LABEL} />
                    {selectedVehicle && <SummaryLine label="Driver" value={driverRequired ? "Required" : "Not required"} />}
                  </div>
                  <div className="bg-white p-6 text-[#10213b]">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Estimated total</p>
                    <p className="mt-1 text-3xl font-black">LKR {total.toLocaleString()}</p>
                    <p className="mt-2 text-xs leading-5 text-gray-500">The backend will perform the final availability and pricing checks when you confirm.</p>
                    <button type="submit" disabled={submitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff385c] px-5 py-4 text-sm font-black text-white transition hover:bg-[#e91f47] disabled:opacity-60">{submitting ? "Creating booking..." : "Confirm & create booking"} <CheckCircle className="h-4 w-4" /></button>
                  </div>
                </div>
              </aside>
            </form>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-7">
                {error && <div className="rounded-2xl border border-rose-100 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">{error}</div>}

                <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
                  <div className="flex items-end justify-between gap-4">
                    <div><p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">01 · Trip basics</p><h2 className="mt-2 text-3xl font-black text-[#10213b]">When are you travelling?</h2><p className="mt-2 text-sm text-gray-500">These are the only details we need before choosing services.</p></div>
                    <span className="hidden rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700 sm:inline-flex">Required</span>
                  </div>
                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    <Field icon={MapPin} label="Destination"><input value={destination} onChange={(e) => setDestination(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" placeholder="Ella, Yala, Kandy..." /></Field>
                    <Field icon={Package} label="Journey type"><input value={bookingTypeLabel(bookingType)} readOnly className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field>
                    <Field icon={CalendarDays} label="Check-in"><input type="date" value={checkIn} onChange={(e) => { setCheckIn(e.target.value); if (new Date(checkOut) <= new Date(e.target.value)) setCheckOut(addDays(e.target.value, 1)); }} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field>
                    <Field icon={CalendarDays} label="Check-out"><input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field>
                    <Field icon={Users} label="Travellers"><input type="number" min="1" value={guests} onChange={(e) => setGuests(Math.max(1, Number(e.target.value)))} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field>
                    <Field icon={Languages} label="Guide language"><select value={languagePreference} onChange={(e) => setLanguagePreference(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none">{TOUR_GUIDE_LANGUAGES.map((language) => <option key={language}>{language}</option>)}</select></Field>
                  </div>
                </section>

                <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
                  <SectionHeading step="02" title="Choose your local guide" subtitle="Pick a guide when you want a personal local perspective." />
                  <div className="mt-6">
                    <OptionSection title="Available guides" description="Matched around your destination" loading={guidesLoading} loadingText="Finding guides..." emptyText="No guides are available right now. Staff can assign one after reviewing the booking.">
                      {nearbyGuides.slice(0, 6).map((guide) => {
                        const selected = guide.id === selectedGuideId;
                        return <button type="button" key={guide.id} onClick={() => setSelectedGuideId(selected ? null : guide.id)} className={"overflow-hidden rounded-2xl border bg-white text-left transition hover:-translate-y-0.5 hover:shadow-md " + (selected ? "border-rose-400 ring-2 ring-rose-100" : "border-gray-200")}>
                          <div className="flex items-center gap-4 p-4">
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 font-black text-gray-500">{guide.profilePhoto ? <img src={guide.profilePhoto} alt={guide.name} className="h-full w-full object-cover" /> : guide.initials}</div>
                            <div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="truncate font-black text-[#10213b]">{guide.name}</p>{selected && <CheckCircle className="h-5 w-5 shrink-0 text-rose-500" />}</div><p className="mt-1 text-xs text-gray-500">{guide.location} · {guide.experience} years</p></div>
                          </div>
                          <div className="grid grid-cols-2 gap-2 border-t border-gray-100 px-4 py-3 text-xs"><span className="font-bold text-gray-500">★ {Number(guide.rating || 0).toFixed(1)} · {guide.reviews} reviews</span><span className="text-right font-black text-gray-800">LKR {Number(guide.pricePerDay || 0).toLocaleString()} / day</span></div>
                        </button>;
                      })}
                    </OptionSection>
                    {selectedGuide && <ResourceReviews targetType="GUIDE" targetId={selectedGuide.id} title={selectedGuide.name + " reviews"} />}
                  </div>
                </section>

                <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
                  <SectionHeading step="03" title="Choose your stay" subtitle="Find a place that fits your destination, group and preferences." />
                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <Field icon={CreditCard} label="Max nightly budget"><input type="number" min="0" value={accommodationBudget || ""} onChange={(e) => setAccommodationBudget(Number(e.target.value))} placeholder="Any budget" className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field>
                    <Field icon={BedDouble} label="Stay type"><select value={accommodationType} onChange={(e) => setAccommodationType(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none"><option value="">Any type</option><option>Hotel</option><option>Villa</option><option>Resort</option><option>Hostel</option><option>Apartment</option></select></Field>
                    <Field icon={CheckCircle} label="Preferences"><input value={accommodationPreferences} onChange={(e) => setAccommodationPreferences(e.target.value)} placeholder="wifi, breakfast" className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field>
                  </div>
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {accommodationsLoading ? <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-sm text-gray-400">Finding stays...</div> : nearbyAccommodations.slice(0, 6).map((accommodation) => {
                      const selected = accommodation.id === selectedAccommodationId;
                      const match = accommodationRecommendations.find((item) => item.accommodation.id === accommodation.id);
                      return <button type="button" key={accommodation.id} onClick={() => setSelectedAccommodationId(selected ? null : accommodation.id)} className={"overflow-hidden rounded-2xl border bg-white text-left transition hover:-translate-y-0.5 hover:shadow-md " + (selected ? "border-rose-400 ring-2 ring-rose-100" : "border-gray-200")}>
                        <div className="h-32 overflow-hidden bg-gray-100"><img src={accommodation.image} alt={accommodation.name} className="h-full w-full object-cover" /></div>
                        <div className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-[#10213b]">{accommodation.name}</p><p className="mt-1 text-xs text-gray-500">{accommodation.type} · {accommodation.location}</p></div>{selected && <CheckCircle className="h-5 w-5 text-rose-500" />}</div><div className="mt-3 flex items-center justify-between text-xs"><span className="font-bold text-gray-500">★ {Number(accommodation.rating || 0).toFixed(1)}</span><span className="font-black text-gray-800">LKR {Number(accommodation.price || 0).toLocaleString()} / night</span></div>{match && <div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">{Math.round(match.suitabilityScore)}% fit</span>{match.reasons.slice(0, 2).map((reason) => <span key={reason} className="rounded-full bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-500">{reason}</span>)}</div>}</div>
                      </button>;
                    })}
                  </div>
                  {selectedAccommodation && <div className="mt-5 grid gap-4 rounded-2xl bg-gray-50 p-4 sm:grid-cols-2"><Field icon={BedDouble} label="Rooms"><input type="number" min="1" value={rooms} onChange={(e) => setRooms(Math.max(1, Number(e.target.value)))} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field><Field icon={BedDouble} label="Room type"><select value={roomType} onChange={(e) => setRoomType(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none">{roomTypes.map((item) => <option key={item}>{item}</option>)}</select></Field></div>}
                  {selectedAccommodation && <ResourceReviews targetType="ACCOMMODATION" targetId={selectedAccommodation.id} title={selectedAccommodation.name + " reviews"} />}
                </section>

                <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
                  <SectionHeading step="04" title="Choose your transport" subtitle="Match a vehicle to your group, luggage and driver preference." />
                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {vehiclesLoading ? <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-sm text-gray-400">Finding transport...</div> : vehicles.slice(0, 6).map((vehicle) => {
                      const selected = vehicle.id === selectedVehicleId;
                      const match = vehicleRecommendations.find((item) => item.vehicle.id === vehicle.id);
                      return <button type="button" key={vehicle.id} onClick={() => setSelectedVehicleId(selected ? null : vehicle.id)} className={"overflow-hidden rounded-2xl border bg-white text-left transition hover:-translate-y-0.5 hover:shadow-md " + (selected ? "border-rose-400 ring-2 ring-rose-100" : "border-gray-200")}>
                        <div className="h-32 overflow-hidden bg-gray-100"><img src={vehicle.image} alt={vehicle.name} className="h-full w-full object-cover" /></div>
                        <div className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-black text-[#10213b]">{vehicle.name}</p><p className="mt-1 text-xs text-gray-500">{vehicle.type} · {vehicle.capacity} seats</p></div>{selected && <CheckCircle className="h-5 w-5 text-rose-500" />}</div><div className="mt-3 flex items-center justify-between text-xs"><span className="font-bold text-gray-500">{vehicle.transmission} · {vehicle.fuel}</span><span className="font-black text-gray-800">LKR {Number(vehicle.pricePerDay || 0).toLocaleString()} / day</span></div>{match && <div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700">{Math.round(match.suitabilityScore)}% fit</span>{match.reasons.slice(0, 2).map((reason) => <span key={reason} className="rounded-full bg-gray-50 px-2 py-1 text-[10px] font-bold text-gray-500">{reason}</span>)}</div>}</div>
                      </button>;
                    })}
                  </div>
                  {selectedVehicle && <div className="mt-5 grid gap-4 rounded-2xl bg-gray-50 p-4 md:grid-cols-2"><Field icon={MapPin} label="Pickup location"><input value={pickupLocation} onChange={(e) => setPickupLocation(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field><Field icon={CalendarDays} label="Pickup time"><input type="time" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field><Field icon={MapPin} label="Return location"><input value={returnLocation} onChange={(e) => setReturnLocation(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field><Field icon={CalendarDays} label="Return time"><input type="time" value={returnTime} onChange={(e) => setReturnTime(e.target.value)} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field><Field icon={Car} label="Driver"><select value={driverRequired ? "Yes" : "No"} onChange={(e) => setDriverRequired(e.target.value === "Yes")} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none"><option>Yes</option><option>No</option></select></Field><Field icon={Package} label="Luggage"><input type="number" min="0" value={luggageCount} onChange={(e) => setLuggageCount(Math.max(0, Number(e.target.value)))} className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none" /></Field></div>}
                  {selectedVehicle && <ResourceReviews targetType="VEHICLE" targetId={selectedVehicle.id} title={selectedVehicle.name + " reviews"} />}
                </section>

                <section className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
                  <SectionHeading step="05" title="Anything we should know?" subtitle="Optional notes for the Voyara team." />
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="mt-5 w-full resize-none rounded-2xl bg-gray-50 p-4 text-sm font-medium text-gray-700 outline-none ring-1 ring-gray-200 focus:ring-2 focus:ring-rose-200" placeholder="Arrival details, dietary needs, special requests..." />
                </section>
              </div>

              <aside className="h-fit lg:sticky lg:top-24">
                <div className="overflow-hidden rounded-[2rem] bg-[#0b1f3a] text-white shadow-xl">
                  <div className="p-6"><p className="text-xs font-black uppercase tracking-[0.2em] text-rose-300">Your booking</p><h2 className="mt-2 text-2xl font-black">{bookingTitle(bookingType, destination, tourPackage, selectedAccommodation, selectedVehicle)}</h2></div>
                  <div className="space-y-4 border-y border-white/10 p-6 text-sm">
                    <SummaryLine label="Dates" value={checkIn + " → " + checkOut} />
                    <SummaryLine label="Travellers" value={String(guests)} />
                    <SummaryLine label="Guide" value={selectedGuide ? guideLabel(selectedGuide) : "Staff assignment"} />
                    <SummaryLine label="Stay" value={selectedAccommodation ? accommodationLabel(selectedAccommodation) : "Staff assignment"} />
                    <SummaryLine label="Vehicle" value={selectedVehicle ? vehicleLabel(selectedVehicle) : OWN_VEHICLE_LABEL} />
                    {selectedVehicle && <SummaryLine label="Driver" value={driverRequired ? "Required" : "Not required"} />}
                  </div>
                  <div className="bg-white p-6 text-[#10213b]">
                    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Estimated total</p>
                    <p className="mt-1 text-3xl font-black">LKR {total.toLocaleString()}</p>
                    <p className="mt-2 text-xs leading-5 text-gray-500">Final booking total is confirmed by the backend after the reservation is created.</p>
                    <button type="submit" disabled={submitting} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#ff385c] px-5 py-4 text-sm font-black text-white transition hover:bg-[#e91f47] disabled:opacity-60">{submitting ? "Creating booking..." : "Create booking"} <CheckCircle className="h-4 w-4" /></button>
                  </div>
                </div>
              </aside>
            </form>
            ))}
        </div>
      </main>
      <Footer />
    </div>
  );

}

function BookingHeroStat({ icon: Icon, label, value }: { icon: ComponentType<{ className?: string }>; label: string; value: string }) {
  return <div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-500"><Icon className="h-4 w-4" /></span><div><p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p><p className="mt-1 text-sm font-black text-[#10213b]">{value}</p></div></div>;
}

function SectionHeading({ step, title, subtitle }: { step: string; title: string; subtitle: string }) {
  return <div><p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">{step} ·</p><h2 className="mt-2 text-3xl font-black text-[#10213b]">{title}</h2><p className="mt-2 text-sm leading-6 text-gray-500">{subtitle}</p></div>;
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start justify-between gap-4"><span className="text-white/50">{label}</span><span className="text-right font-bold">{value}</span></div>;
}

function SelectedServiceCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return <div className="rounded-2xl bg-[#f7f8fa] p-5">
    <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">{title}</p>
    <p className="mt-2 truncate text-sm font-black text-[#10213b]">{value}</p>
    <p className="mt-2 text-xs font-bold text-gray-500">{detail}</p>
  </div>;
}


function vehicleLabel(vehicle: Vehicle) {
  return [vehicle.name, vehicle.brand, vehicle.model].filter(Boolean).join(" · ");
}

const OWN_VEHICLE_LABEL = "Own vehicle";

function guideLabel(guide: Guide) {
  return [guide.name, guide.location].filter(Boolean).join(" · ");
}

function accommodationLabel(accommodation: Accommodation) {
  return accommodation.name;
}

function bookingTypeLabel(type: string) {
  if (type === "ACCOMMODATION") return "Accommodation";
  if (type === "VEHICLE") return "Vehicle";
  if (type === "CUSTOM") return "Custom trip";
  return "Tour package";
}

function bookingTitle(type: string, destination: string, tourPackage: TourPackage | null, accommodation: Accommodation | null, vehicle: Vehicle | null) {
  if (type === "ACCOMMODATION") return accommodation ? `${accommodation.name} stay` : "Accommodation booking";
  if (type === "VEHICLE") return vehicle ? `${vehicle.name} rental` : "Vehicle booking";
  return tourPackage?.name || `${destination || "Sri Lanka"} Custom Trip`;
}

function selectedResourceNote(type: string, guide: Guide | null, accommodation: Accommodation | null, vehicle: Vehicle | null, languagePreference: string) {
  const selections = [
    `Preferred guide language: ${languagePreference}`,
    type !== "VEHICLE" && (accommodation ? `Accommodation: ${accommodationLabel(accommodation)}` : "Accommodation: staff assignment"),
    (type === "PACKAGE" || type === "CUSTOM") && (guide ? `Guide preference: ${guideLabel(guide)}` : "Guide preference: staff assignment"),
    type !== "ACCOMMODATION" && (vehicle ? `Vehicle: ${vehicleLabel(vehicle)}` : `Vehicle: ${OWN_VEHICLE_LABEL}`),
  ].filter(Boolean);
  return `Tourist requested a ${bookingTypeLabel(type).toLowerCase()} booking from the Voyara website. ${selections.join("; ")}.`;
}

function isNearDestination(destination: string, location?: string, country?: string) {
  const haystack = [location, country].filter(Boolean).join(" ").toLowerCase();
  const terms = destination.toLowerCase().split(/[,/|-]/).map((item) => item.trim()).filter((item) => item.length > 2);
  if (!terms.length || !haystack) return false;
  return terms.some((term) => haystack.includes(term) || term.includes(haystack));
}

function primaryDestinationName(destination: string) {
  return destination.split(",")[0]?.trim() || destination.trim();
}

function ChoiceBadge({ selected }: { selected: boolean }) {
  return (
    <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: selected ? "#FF385C" : "#f3f4f6", color: selected ? "white" : "#6b7280" }}>
      {selected ? "Selected" : "Choose"}
    </span>
  );
}

function OwnOptionCard({
  selected,
  title,
  description,
  detail,
  icon: Icon,
  onClick,
}: {
  selected: boolean;
  title: string;
  description: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-2xl border p-4 transition-colors"
      style={{
        borderColor: selected ? "#FF385C" : "#e5e7eb",
        background: selected ? "#fff5f7" : "#fff",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-gray-400" />
            <p className="font-bold text-gray-900">{title}</p>
          </div>
          <p className="text-xs text-gray-400 mt-1">{description}</p>
        </div>
        <ChoiceBadge selected={selected} />
      </div>
      <p className="mt-3 text-xs font-semibold text-gray-800">{detail}</p>
    </button>
  );
}

function OptionSection({
  title,
  description,
  loading,
  loadingText,
  emptyText,
  children,
}: {
  title: string;
  description: string;
  loading: boolean;
  loadingText: string;
  emptyText: string;
  children: ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <div className="mt-5">
      <div className="flex items-center justify-between gap-4 mb-3">
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
        {loading && <span className="text-xs text-gray-400">{loadingText}</span>}
      </div>

      {!loading && !hasChildren ? (
        <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-400">
          {emptyText}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{children}</div>
      )}
    </div>
  );
}

function Field({ icon: Icon, label, children }: { icon: ComponentType<{ className?: string }>; label: string; children: ReactNode }) {
  return (
    <label className="block rounded-2xl bg-gray-50 p-4">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
        <Icon className="w-4 h-4" /> {label}
      </span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3">
      <span className="text-gray-400">{label}</span>
      <span className="font-semibold text-gray-800 text-right">{value}</span>
    </div>
  );
}