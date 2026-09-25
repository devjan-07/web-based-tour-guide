import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, BedDouble, CalendarDays, Car, CheckCircle, Fuel, Languages, MapPin, Package, Users } from "lucide-react";
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
  const bookingType = packageId ? "PACKAGE" : "CUSTOM";

  const [tourPackage, setTourPackage] = useState<TourPackage | null>(null);
  const [primaryDestinationId, setPrimaryDestinationId] = useState<number | null>(destinationIdParam ? Number(destinationIdParam) : null);
  const [destination, setDestination] = useState(destinationParam);
  const [checkIn, setCheckIn] = useState(today());
  const [checkOut, setCheckOut] = useState(addDays(today(), 1));
  const [guests, setGuests] = useState(1);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [selectedGuideId, setSelectedGuideId] = useState<number | null>(null);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [selectedAccommodationId, setSelectedAccommodationId] = useState<number | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleRecommendations, setVehicleRecommendations] = useState<VehicleRecommendation[]>([]);
  const [accommodationRecommendations, setAccommodationRecommendations] = useState<AccommodationRecommendation[]>([]);
  const [accommodationBudget, setAccommodationBudget] = useState(0);
  const [accommodationType, setAccommodationType] = useState("");
  const [accommodationPreferences, setAccommodationPreferences] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [languagePreference, setLanguagePreference] = useState("English");
  const [rooms, setRooms] = useState(1);
  const [roomType, setRoomType] = useState(roomTypes[1]);
  const [pickupLocation, setPickupLocation] = useState(destinationParam || "Sri Lanka");
  const [pickupTime, setPickupTime] = useState("09:00");
  const [returnLocation, setReturnLocation] = useState(destinationParam || "Sri Lanka");
  const [returnTime, setReturnTime] = useState("18:00");
  const [driverRequired, setDriverRequired] = useState(true);
  const [luggageCount, setLuggageCount] = useState(0);
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to explore
        </Link>

        <section className="mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#062a56] to-[#0057B8] shadow-sm">
          <div className="p-6 text-white md:p-8">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/70"><span>Booking</span><span className="h-1 w-1 rounded-full bg-white/40" />{bookingTypeLabel(bookingType)}</div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-2">
              {bookingTitle(bookingType, destination, tourPackage, selectedAccommodation, selectedVehicle)}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
              Submit your preferred dates, then open the booking details to complete payment.
            </p>
          </div>
        </section>

        {loading ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-sm text-gray-400 shadow-sm">Loading booking details...</div>
        ) : (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
            <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-500">Step 1</p><h2 className="mt-1 text-xl font-extrabold text-gray-900">Start with the essentials</h2><p className="mt-1 text-sm text-gray-500">Tell us when you are travelling and who is coming. Everything else is optional.</p></div><span className="hidden rounded-full bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 sm:inline-flex">Required first</span></div>

              {error && (
                <div className="mb-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field icon={MapPin} label="Destination">
                  <input
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none"
                    placeholder="Ella, Sigiriya, Kandy..."
                  />
                </Field>

                <Field icon={Package} label="Booking type">
                  <input
                    value={bookingTypeLabel(bookingType)}
                    readOnly
                    className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none"
                  />
                </Field>

                <Field icon={CalendarDays} label="Start date">
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => {
                      setCheckIn(e.target.value);
                      if (new Date(checkOut) <= new Date(e.target.value)) setCheckOut(addDays(e.target.value, 1));
                    }}
                    className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none"
                  />
                </Field>

                <Field icon={CalendarDays} label="End date">
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none"
                  />
                </Field>

                <Field icon={Users} label="Travelers">
                  <input
                    type="number"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none"
                  />
                </Field>


                <Field icon={Languages} label="Preferred guide language">
                  <select
                    value={languagePreference}
                    onChange={(event) => setLanguagePreference(event.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none"
                  >
                    {TOUR_GUIDE_LANGUAGES.map((language) => <option key={language}>{language}</option>)}
                  </select>
                </Field>
              </div>

              <details open className="group mt-6 rounded-2xl border border-gray-200 bg-gray-50/50 p-4 sm:p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                  <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-500">Step 2</p><h3 className="mt-1 font-bold text-gray-900">Choose a local guide</h3><p className="mt-0.5 text-xs text-gray-400">Optional — expand to compare available guides.</p></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 shadow-sm">View options</span>
                </summary>
                <div className="mt-4">
              <OptionSection
                title="Guide options"
                description={`Available guides ${nearbyGuides.length ? "near this destination" : "for your trip request"}`}
                loading={guidesLoading}
                loadingText="Loading guides..."
                emptyText="No available guides are listed right now. Staff can assign a guide after reviewing your booking."
              >
                {nearbyGuides.map((guide) => {
                  const selected = guide.id === selectedGuideId;
                  return (
                    <button
                      type="button"
                      key={guide.id}
                      onClick={() => setSelectedGuideId(guide.id)}
                      className="text-left rounded-2xl border p-4 transition-colors"
                      style={{
                        borderColor: selected ? "#FF385C" : "#e5e7eb",
                        background: selected ? "#fff5f7" : "#fff",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-900">{guide.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{guide.location || "Sri Lanka"} · {guide.experience} years experience</p>
                        </div>
                        <ChoiceBadge selected={selected} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <RatingStars rating={Number(guide.rating || 0)} reviews={Number(guide.reviews || 0)} compact />
                        <span className="font-semibold text-gray-800">LKR {Number(guide.pricePerDay || 0).toLocaleString()} / day</span>
                        <span className="inline-flex items-center gap-1.5"><Languages className="w-3.5 h-3.5" /> {guide.languages?.slice(0, 2).join(", ") || "Languages pending"}</span>
                        <span>{guide.specialties?.slice(0, 2).join(", ") || "General tours"}</span>
                      </div>
                      {guide.bio && <p className="mt-2 line-clamp-2 text-xs text-gray-400">{guide.bio}</p>}
                    </button>
                  );
                })}
              </OptionSection>

              {selectedGuide && (
                <ResourceReviews
                  targetType="GUIDE"
                  targetId={selectedGuide.id}
                  title={`${selectedGuide.name} reviews`}
                />
              )}
                </div>
              </details>

              <details open className="group mt-4 rounded-2xl border border-gray-200 bg-gray-50/50 p-4 sm:p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                  <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-500">Step 3</p><h3 className="mt-1 font-bold text-gray-900">Choose your stay</h3><p className="mt-0.5 text-xs text-gray-400">Set preferences first, then choose from matching stays.</p></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 shadow-sm">View options</span>
                </summary>
                <div className="mt-4">

              {selectedAccommodation && (
                <div className="mt-5 rounded-2xl border border-gray-200 p-4">
                  <h3 className="font-bold text-gray-900">Accommodation details</h3>
                  <p className="mt-0.5 text-xs text-gray-400">These details are saved with the selected stay.</p>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field icon={BedDouble} label="Rooms">
                      <input type="number" value={rooms} onChange={(event) => setRooms(Number(event.target.value))} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                    </Field>
                    <Field icon={BedDouble} label="Room type">
                      <select value={roomType} onChange={(event) => setRoomType(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none">
                        {roomTypes.map((item) => <option key={item}>{item}</option>)}
                      </select>
                    </Field>
                  </div>
                </div>
              )}

              <div className="mt-5 rounded-2xl border border-gray-200 p-4">
                <h3 className="font-bold text-gray-900">Stay preferences</h3>
                <p className="mt-0.5 text-xs text-gray-400">These preferences improve the accommodation matches shown below.</p>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Field icon={CreditCard} label="Max nightly budget">
                    <input type="number" min="0" value={accommodationBudget || ""} onChange={(event) => setAccommodationBudget(Number(event.target.value))} placeholder="Optional" className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                  </Field>
                  <Field icon={BedDouble} label="Stay type">
                    <select value={accommodationType} onChange={(event) => setAccommodationType(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none">
                      <option value="">Any type</option><option>Hotel</option><option>Villa</option><option>Resort</option><option>Hostel</option><option>Apartment</option>
                    </select>
                  </Field>
                  <Field icon={CheckCircle} label="Preferences">
                    <input value={accommodationPreferences} onChange={(event) => setAccommodationPreferences(event.target.value)} placeholder="pool, wifi, breakfast" className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                  </Field>
                </div>
              </div>

              <OptionSection
                title="Accommodation options"
                description={`Active stays near ${primaryDestinationName(destination) || "this destination"}`}
                loading={accommodationsLoading}
                loadingText="Loading stays..."
                emptyText={`No active accommodations are linked near ${primaryDestinationName(destination) || "this destination"}. Staff can assign a suitable stay after reviewing your booking.`}
              >
                {nearbyAccommodations.map((accommodation) => {
                  const selected = accommodation.id === selectedAccommodationId;
                  return (
                    <button
                      type="button"
                      key={accommodation.id}
                      onClick={() => setSelectedAccommodationId(accommodation.id)}
                      className="text-left rounded-2xl border p-4 transition-colors"
                      style={{
                        borderColor: selected ? "#FF385C" : "#e5e7eb",
                        background: selected ? "#fff5f7" : "#fff",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-gray-900">{accommodation.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{accommodation.type} · {accommodation.location || "Sri Lanka"}</p>
                        </div>
                        <ChoiceBadge selected={selected} />
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <RatingStars rating={Number(accommodation.rating || 0)} reviews={Number(accommodation.reviews || 0)} compact />
                        <span className="font-semibold text-gray-800">LKR {Number(accommodation.price || 0).toLocaleString()} / night</span>
                        <span>{accommodation.rooms} rooms</span>
                        <span>{accommodation.status}</span>
                      </div>
                      {accommodationRecommendations.find((item) => item.accommodation.id === accommodation.id) && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {(() => {
                            const match = accommodationRecommendations.find((item) => item.accommodation.id === accommodation.id)!;
                            return <>
                              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">{match.suitabilityScore}% fit</span>
                              {match.reasons.slice(0, 2).map((reason) => <span key={reason} className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600">{reason}</span>)}
                            </>;
                          })()}
                        </div>
                      )}
                      {accommodation.amenities?.length > 0 && (
                        <p className="mt-2 text-xs text-gray-400">{accommodation.amenities.slice(0, 4).join(" · ")}</p>
                      )}
                    </button>
                  );
                })}
              </OptionSection>

              {selectedAccommodation && (
                <ResourceReviews
                  targetType="ACCOMMODATION"
                  targetId={selectedAccommodation.id}
                  title={`${selectedAccommodation.name} reviews`}
                />
              )}
                </div>
              </details>

              <details open className="group mt-4 rounded-2xl border border-gray-200 bg-gray-50/50 p-4 sm:p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                  <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-500">Step 4</p><h3 className="mt-1 font-bold text-gray-900">Choose your transport</h3><p className="mt-0.5 text-xs text-gray-400">Use your own vehicle or select an available Voyara option.</p></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 shadow-sm">View options</span>
                </summary>
                <div className="mt-4">

              <div className="mt-0">
                    <p className="text-xs text-gray-400 mt-0.5">Choose the transport option for this package request</p>
                  </div>
                  {vehiclesLoading && <span className="text-xs text-gray-400">Loading vehicles...</span>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <OwnOptionCard
                    selected={selectedVehicleId === null}
                    title={OWN_VEHICLE_LABEL}
                    description="You will use your own transport for this trip."
                    detail="No vehicle charge"
                    icon={Fuel}
                    onClick={() => setSelectedVehicleId(null)}
                  />
                  {!vehiclesLoading && vehicles.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-400">
                      No available Voyara vehicles are listed right now.
                    </div>
                  ) : (
                    vehicles.map((vehicle) => {
                      const selected = vehicle.id === selectedVehicleId;
                      return (
                        <button
                          type="button"
                          key={vehicle.id}
                          onClick={() => setSelectedVehicleId(vehicle.id)}
                          className="text-left rounded-2xl border p-4 transition-colors"
                          style={{
                            borderColor: selected ? "#FF385C" : "#e5e7eb",
                            background: selected ? "#fff5f7" : "#fff",
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-bold text-gray-900">{vehicle.name}</p>
                              <p className="text-xs text-gray-400 mt-0.5">{vehicle.brand} {vehicle.model} · {vehicle.type}</p>
                            </div>
                            <ChoiceBadge selected={selected} />
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {vehicle.capacity} seats</span>
                            <span className="inline-flex items-center gap-1.5"><Fuel className="w-3.5 h-3.5" /> {vehicle.fuel}</span>
                            <RatingStars rating={Number(vehicle.rating || 0)} reviews={Number(vehicle.reviews || 0)} compact />
                            <span>{vehicle.transmission}</span>
                            <span className="font-semibold text-gray-800">LKR {Number(vehicle.pricePerDay || 0).toLocaleString()} / day</span>
                          </div>
                          {vehicleRecommendations.find((item) => item.vehicle.id === vehicle.id) && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {(() => {
                                const match = vehicleRecommendations.find((item) => item.vehicle.id === vehicle.id)!;
                                return <>
                                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">{match.suitabilityScore}% fit</span>
                                  {match.reasons.slice(0, 2).map((reason) => <span key={reason} className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600">{reason}</span>)}
                                </>;
                              })()}
                            </div>
                          )}
                          {vehicle.location && <p className="mt-2 text-xs text-gray-400">{vehicle.location}</p>}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {selectedVehicle && (
                <div className="mt-5 rounded-2xl border border-gray-200 p-4">
                  <h3 className="font-bold text-gray-900">Vehicle details</h3>
                  <p className="mt-0.5 text-xs text-gray-400">These pickup and return details are saved with the selected vehicle.</p>
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field icon={MapPin} label="Pickup location">
                      <input value={pickupLocation} onChange={(event) => setPickupLocation(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                    </Field>
                    <Field icon={CalendarDays} label="Pickup time">
                      <input type="time" value={pickupTime} onChange={(event) => setPickupTime(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                    </Field>
                    <Field icon={MapPin} label="Return location">
                      <input value={returnLocation} onChange={(event) => setReturnLocation(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                    </Field>
                    <Field icon={CalendarDays} label="Return time">
                      <input type="time" value={returnTime} onChange={(event) => setReturnTime(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                    </Field>
                    <Field icon={Car} label="Driver">
                      <select value={driverRequired ? "Yes" : "No"} onChange={(event) => setDriverRequired(event.target.value === "Yes")} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none">
                        <option>Yes</option>
                        <option>No</option>
                      </select>
                    </Field>
                    <Field icon={Package} label="Luggage count">
                      <input type="number" value={luggageCount} onChange={(event) => setLuggageCount(Number(event.target.value))} className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none" />
                    </Field>
                  </div>
                </div>
              )}

              {selectedVehicle && (
                <ResourceReviews
                  targetType="VEHICLE"
                  targetId={selectedVehicle.id}
                  title={`${selectedVehicle.name} reviews`}
                />
              )}
                </div>
              </details>

              <details className="group mt-4 rounded-2xl border border-gray-200 bg-gray-50/50 p-4 sm:p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                  <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Optional</p><h3 className="mt-1 font-bold text-gray-900">Special requests</h3><p className="mt-0.5 text-xs text-gray-400">Anything staff should know about your trip.</p></div><span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-500 shadow-sm">Add note</span>
                </summary>
                <div className="mt-4 rounded-2xl bg-white p-4">
                <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Special requests</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-transparent text-sm text-gray-700 outline-none resize-none"
                  placeholder="Pickup location, dietary needs, preferred guide language, or anything staff should know..."
                />
              </div>
                </div>
              </details>
            </section>

            <aside className="h-fit rounded-3xl border border-gray-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
              <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-500">Your trip</p><h2 className="mt-1 text-xl font-extrabold text-gray-900">Review & book</h2><p className="mt-1 text-xs leading-5 text-gray-400">Your selections can be reviewed after this request is created.</p></div>
              <div className="space-y-3 text-sm">
                <SummaryRow label="Tourist" value={user?.fullName || "Current user"} />
                <SummaryRow label="Email" value={user?.email || "Signed-in account"} />
                <SummaryRow label="Type" value={bookingTypeLabel(bookingType)} />
                <SummaryRow label="Duration" value={`${tripDays(checkIn, checkOut)} day${tripDays(checkIn, checkOut) === 1 ? "" : "s"}`} />
                <SummaryRow label="Guide" value={selectedGuide ? guideLabel(selectedGuide) : "Staff assignment"} />
                <SummaryRow label="Language" value={languagePreference} />
                <SummaryRow label="Stay" value={selectedAccommodation ? accommodationLabel(selectedAccommodation) : "Staff assignment"} />
                {selectedAccommodation && <SummaryRow label="Room details" value={`${rooms} ${roomType}`} />}
                <SummaryRow label="Vehicle" value={selectedVehicle ? vehicleLabel(selectedVehicle) : OWN_VEHICLE_LABEL} />
                {selectedVehicle && <SummaryRow label="Pickup" value={`${pickupLocation} ${pickupTime}`} />}
                {selectedVehicle && <SummaryRow label="Return" value={`${returnLocation} ${returnTime}`} />}
                <div className="rounded-2xl bg-gray-50 px-4 py-3"><div className="flex items-end justify-between gap-4"><span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Estimated total</span><span className="text-lg font-extrabold text-gray-900">{total ? `LKR ${total.toLocaleString()}` : "Pending quote"}</span></div><p className="mt-1 text-[11px] leading-4 text-gray-400">Final booking total is determined by the backend.</p></div>
                <SummaryRow label="Status" value="Pending" />
                <SummaryRow label="Payment" value="Pending" />
              </div>

              <div className="mt-5 rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>Your booking will be saved in the database and visible in My Bookings immediately.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-5 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #FF385C, #E31C5F)" }}
              >
                {submitting ? "Creating booking..." : "Continue with booking"}
              </button>
            </aside>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
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
