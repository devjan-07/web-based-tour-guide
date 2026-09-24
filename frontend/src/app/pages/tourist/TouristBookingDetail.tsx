import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  CalendarDays,
  Car,
  Check,
  CheckCircle,
  ChevronRight,
  CreditCard,
  Hotel,
  MapPin,
  MessageSquare,
  Package,
  Send,
  Star,
  Users,
  UserRoundCheck,
  XCircle,
} from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import {
  touristBookingsApi,
  touristReviewsApi,
  type Booking,
  type Payment,
  type Review,
} from "../../lib/api";

const timeline = ["Pending", "Confirmed", "Completed"];

const statusStyle: Record<string, { bg: string; color: string }> = {
  Confirmed: { bg: "#dcfce7", color: "#15803d" },
  Pending: { bg: "#fef3c7", color: "#b45309" },
  Completed: { bg: "#dbeafe", color: "#0369a1" },
  Cancelled: { bg: "#fee2e2", color: "#b91c1c" },
};

function formatDate(value?: string) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function canCancel(booking: Booking) {
  return (
    (booking.status === "Pending" || booking.status === "Confirmed") &&
    booking.payment !== "Paid"
  );
}

function canReview(booking: Booking) {
  if (booking.status === "Cancelled" || !booking.checkOut) return false;
  const checkout = new Date(booking.checkOut);
  if (Number.isNaN(checkout.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  checkout.setHours(0, 0, 0, 0);
  return checkout <= today;
}

function ratingDescription(rating: number) {
  if (rating >= 5) return "Excellent";
  if (rating >= 4) return "Very good";
  if (rating >= 3) return "Good";
  if (rating >= 2) return "Needs improvement";
  return "Poor";
}

function bookingType(booking: Booking) {
  return booking.bookingType || "PACKAGE";
}

function bookingTypeLabel(booking: Booking) {
  const type = bookingType(booking);
  if (type === "ACCOMMODATION") return "Accommodation";
  if (type === "VEHICLE") return "Vehicle";
  if (type === "CUSTOM") return "Custom journey";
  return "Tour package";
}

function bookingTitle(booking: Booking) {
  if (bookingType(booking) === "ACCOMMODATION") {
    return accommodationName(booking.accommodation) || booking.pkg || "Accommodation booking";
  }
  if (bookingType(booking) === "VEHICLE") {
    return booking.vehicle || booking.pkg || "Vehicle booking";
  }
  return booking.pkg || "Voyara journey";
}

function bookingLocationLabel(booking: Booking) {
  if (bookingType(booking) === "VEHICLE") {
    return booking.pickupLocation || booking.destination || "Pickup location pending";
  }
  return booking.destination || "Destination not assigned";
}

function durationLabel(booking: Booking) {
  if (!booking.checkIn || !booking.checkOut) return "Dates to be confirmed";
  const start = new Date(booking.checkIn).getTime();
  const end = new Date(booking.checkOut).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return "Dates to be confirmed";
  const days = Math.max(1, Math.ceil((end - start) / 86400000));
  return `${days} day${days === 1 ? "" : "s"}`;
}

export default function TouristBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("Card (demo)");
  const [paying, setPaying] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("Booking id is missing.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    touristBookingsApi
      .detail(id)
      .then((item) => {
        if (!cancelled) {
          setBooking(item);
          setError("");
          touristBookingsApi.payment(item.id).then(setPayment).catch(() => setPayment(null));
          touristReviewsApi
            .list()
            .then((items) => setReviews(items.filter((review) => review.bookingId === item.id)))
            .catch(() => setReviews([]));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load booking");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const timelineIndex = useMemo(() => {
    if (!booking || booking.status === "Cancelled") return -1;
    return timeline.indexOf(booking.status);
  }, [booking]);

  const handleCancel = async () => {
    if (!booking) return;
    const confirmed = window.confirm(
      `Cancel booking ${booking.id}? This action cannot be undone.`,
    );
    if (!confirmed) return;

    setCancelling(true);
    setError("");
    try {
      const updated = await touristBookingsApi.cancel(booking.id);
      setBooking(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel booking");
    } finally {
      setCancelling(false);
    }
  };

  const handlePayment = async () => {
    if (!booking) return;
    setPaying(true);
    setError("");
    try {
      const savedPayment = await touristBookingsApi.pay(booking.id, paymentMethod);
      setPayment(savedPayment);
      const refreshedBooking = await touristBookingsApi.detail(booking.id);
      setBooking(refreshedBooking);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete payment");
    } finally {
      setPaying(false);
    }
  };

  const style = booking
    ? statusStyle[booking.status] || { bg: "#f3f4f6", color: "#6b7280" }
    : statusStyle.Pending;
  const reviewTargets = useMemo(
    () => (booking ? buildReviewTargets(booking) : []),
    [booking],
  );
  const reviewAvailable = !!booking && canReview(booking);
  const pendingReviewCount = reviewTargets.filter(
    (target) => !reviews.some((review) => review.targetType === target.targetType),
  ).length;

  useEffect(() => {
    if (reviewAvailable && pendingReviewCount > 0) {
      setReviewDialogOpen(true);
    }
  }, [reviewAvailable, pendingReviewCount]);

  return (
    <div className="min-h-screen bg-[#f6f3ec]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to my journey
        </button>

        {loading && (
          <div className="rounded-[2rem] border border-gray-200 bg-white p-10 text-sm text-gray-400">
            Loading your journey...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-[2rem] border border-red-100 bg-white p-8">
            <p className="font-semibold text-red-600">{error}</p>
            <Link
              to="/tourist/dashboard"
              className="mt-4 inline-flex text-sm font-semibold"
              style={{ color: "#FF385C" }}
            >
              Return to My Journey
            </Link>
          </div>
        )}

        {!loading && !error && booking && (
          <>
            <section className="relative mb-6 overflow-hidden rounded-[2rem] bg-[#12372f] text-white shadow-xl">
              <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-[#d9b77a]/20 blur-3xl" />
              <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-[#6f9f86]/20 blur-3xl" />

              <div className="relative grid gap-8 p-7 md:p-10 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wide text-white/75">
                      {booking.id}
                    </span>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-bold"
                      style={{ background: style.bg, color: style.color }}
                    >
                      {booking.status}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
                      {booking.payment}
                    </span>
                  </div>

                  <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-[#d9b77a]">
                    Your journey is taking shape
                  </p>
                  <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-5xl">
                    {bookingTitle(booking)}
                  </h1>
                  <p className="mt-4 flex items-center gap-2 text-sm text-white/70">
                    <MapPin className="h-4 w-4" />
                    {bookingLocationLabel(booking)}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-md lg:min-w-[220px]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/50">
                    Journey dates
                  </p>
                  <p className="mt-2 text-lg font-bold">
                    {formatDate(booking.checkIn)}
                  </p>
                  <p className="text-sm text-white/60">to {formatDate(booking.checkOut)}</p>
                  <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                    <span className="text-white/60">{durationLabel(booking)}</span>
                    <span className="font-bold">LKR {Number(booking.total || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-6 rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-7 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c49b58]">
                    Trip progress
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-gray-900">
                    Your reservation timeline
                  </h2>
                </div>
                <p className="text-sm text-gray-500">
                  {booking.status === "Cancelled"
                    ? "This reservation is closed."
                    : booking.status === "Completed"
                      ? "Your journey has been completed."
                      : "We will keep the booking status up to date."}
                </p>
              </div>

              {booking.status === "Cancelled" ? (
                <div className="flex items-center gap-4 rounded-2xl bg-red-50 p-5 text-sm font-semibold text-red-700">
                  <XCircle className="h-6 w-6 shrink-0" />
                  This booking has been cancelled.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-3">
                  {timeline.map((step, index) => {
                    const active = index <= timelineIndex;
                    const current = index === timelineIndex;
                    return (
                      <div
                        key={step}
                        className="relative rounded-2xl border p-5 transition"
                        style={{
                          borderColor: active ? "#12372f" : "#e5e7eb",
                          background: active ? "#f3f8f4" : "#fff",
                        }}
                      >
                        <div className="mb-4 flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-black"
                            style={{
                              background: active ? "#12372f" : "#f3f4f6",
                              color: active ? "white" : "#9ca3af",
                            }}
                          >
                            {active ? <Check className="h-4 w-4" /> : index + 1}
                          </span>
                          {current && (
                            <span className="rounded-full bg-[#d9b77a]/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#8a682f]">
                              Current
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-gray-900">{step}</p>
                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          {step === "Pending"
                            ? "Your request is being processed."
                            : step === "Confirmed"
                              ? "Your trip is confirmed and ready."
                              : "Your travel dates have passed."}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
              <div className="space-y-6">
                <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
                  <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c49b58]">
                      At a glance
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-gray-900">
                      Everything for this trip
                    </h2>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Info icon={CalendarDays} label={bookingType(booking) === "VEHICLE" ? "Rental dates" : "Travel dates"} value={`${formatDate(booking.checkIn)} – ${formatDate(booking.checkOut)}`} />
                    <Info icon={Users} label={bookingType(booking) === "VEHICLE" ? "Passengers" : "Travelers"} value={`${booking.guests || 1} guest${booking.guests === 1 ? "" : "s"}`} />
                    {bookingType(booking) === "ACCOMMODATION" && <Info icon={Hotel} label="Rooms" value={`${booking.rooms || 1}`} />}
                    {booking.roomType && <Info icon={Hotel} label="Room type" value={booking.roomType} />}
                    {booking.languagePreference && <Info icon={MessageSquare} label="Guide language" value={booking.languagePreference} />}
                    {(bookingType(booking) === "PACKAGE" || bookingType(booking) === "CUSTOM") && (
                      <Info icon={UserRoundCheck} label="Assigned guide" value={booking.guide || "Pending assignment"} />
                    )}
                    {bookingType(booking) !== "VEHICLE" && (
                      <Info icon={Hotel} label="Accommodation" value={accommodationName(booking.accommodation) || "Pending assignment"} />
                    )}
                    {bookingType(booking) !== "ACCOMMODATION" && (
                      <Info icon={Car} label="Vehicle" value={booking.vehicle || "Pending assignment"} />
                    )}
                    {bookingType(booking) === "VEHICLE" && (
                      <>
                        <Info icon={MapPin} label="Pickup" value={booking.pickupLocation || booking.destination || "Pickup location pending"} />
                        {booking.pickupTime && <Info icon={CalendarDays} label="Pickup time" value={booking.pickupTime} />}
                        <Info icon={MapPin} label="Return" value={booking.returnLocation || booking.pickupLocation || "Return location pending"} />
                        {booking.returnTime && <Info icon={CalendarDays} label="Return time" value={booking.returnTime} />}
                        <Info icon={Car} label="Driver" value={booking.driverRequired === false ? "Self-drive" : "Required"} />
                        <Info icon={Package} label="Luggage" value={`${booking.luggageCount || 0}`} />
                      </>
                    )}
                    <Info icon={CreditCard} label="Payment" value={`${booking.payment} · LKR ${Number(booking.total || 0).toLocaleString()}`} />
                    <Info icon={Package} label="Booking created" value={formatDate(booking.createdAt)} />
                  </div>

                  {booking.notes && (
                    <div className="mt-5 rounded-2xl bg-[#f7f5ef] p-5">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">Special requests</p>
                      <p className="text-sm leading-6 text-gray-600">{booking.notes}</p>
                    </div>
                  )}

                  {(booking.accommodationProviderStatus || booking.vehicleProviderStatus) && (
                    <div className="mt-5 rounded-2xl border border-gray-200 p-5">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
                        Partner confirmation
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {booking.accommodationProviderStatus && (
                          <ProviderStatus label="Accommodation" value={booking.accommodationProviderStatus} />
                        )}
                        {booking.vehicleProviderStatus && (
                          <ProviderStatus label="Transport provider" value={booking.vehicleProviderStatus} />
                        )}
                      </div>
                      <p className="mt-3 text-xs leading-5 text-gray-400">
                        Your booking remains pending while a selected partner resource is awaiting confirmation.
                      </p>
                    </div>
                  )}
                </section>

                {reviewAvailable && (
                  <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c49b58]">
                          After the journey
                        </p>
                        <h2 className="mt-1 text-2xl font-black text-gray-900">Ratings and reviews</h2>
                        <p className="mt-2 text-sm text-gray-500">
                          Share feedback for each booked item and the overall trip.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setReviewDialogOpen(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#12372f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1b4c40]"
                      >
                        <Star className="h-4 w-4" />
                        {pendingReviewCount
                          ? `Review ${pendingReviewCount} item${pendingReviewCount === 1 ? "" : "s"}`
                          : "View reviews"}
                      </button>
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-2">
                      {reviewTargets.map((target) => {
                        const submitted = reviews.find((review) => review.targetType === target.targetType);
                        return (
                          <div key={target.targetType} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{target.label}</p>
                            <h3 className="mt-1 font-bold text-gray-900">{target.name}</h3>
                            {submitted ? (
                              <p className="mt-2 text-sm text-gray-600">{ratingDescription(submitted.rating)} · {submitted.rating}/5</p>
                            ) : (
                              <p className="mt-2 text-sm text-gray-400">Pending review</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}
              </div>

              <aside className="space-y-5">
                {(booking.status === "Pending" || booking.status === "Confirmed") &&
                  booking.payment !== "Paid" &&
                  !payment && (
                    <section className="sticky top-24 rounded-[2rem] bg-[#12372f] p-6 text-white shadow-xl">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d9b77a]">
                        One more step
                      </p>
                      <h2 className="mt-2 text-2xl font-black">Complete your payment</h2>
                      <p className="mt-2 text-sm leading-6 text-white/65">
                        Pay the current booking total to complete the reservation.
                      </p>
                      <div className="mt-5 rounded-2xl bg-white/10 p-4">
                        <p className="text-xs text-white/50">Total</p>
                        <p className="mt-1 text-2xl font-black">
                          LKR {Number(booking.total || 0).toLocaleString()}
                        </p>
                      </div>
                      <select
                        value={paymentMethod}
                        onChange={(event) => setPaymentMethod(event.target.value)}
                        className="mt-4 w-full rounded-xl border border-white/10 bg-white px-3 py-3 text-sm text-gray-800 outline-none"
                      >
                        <option>Card (demo)</option>
                        <option>Bank transfer</option>
                        <option>Pay at Voyara office</option>
                      </select>
                      <button
                        onClick={handlePayment}
                        disabled={paying}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#d9b77a] px-4 py-3 text-sm font-black text-[#12372f] transition hover:bg-[#e6ca96] disabled:opacity-50"
                      >
                        <CheckCircle className="h-4 w-4" />
                        {paying ? "Processing..." : "Pay now"}
                      </button>
                      <p className="mt-3 text-[11px] leading-4 text-white/40">
                        Payment uses the current Voyara demo payment workflow.
                      </p>
                    </section>
                  )}

                {payment && (
                  <section className="rounded-[2rem] border border-green-200 bg-green-50 p-6">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="mt-0.5 h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-bold text-green-900">Payment completed</p>
                        <p className="mt-2 text-sm leading-5 text-green-700">
                          Reference: {payment.transactionReference}
                        </p>
                        <p className="text-sm text-green-700">
                          LKR {Number(payment.amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </section>
                )}

                <section className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c49b58]">Booking actions</p>
                  <h2 className="mt-1 text-xl font-black text-gray-900">Manage this trip</h2>

                  {canCancel(booking) ? (
                    <button
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      <XCircle className="h-4 w-4" />
                      {cancelling ? "Cancelling..." : "Cancel booking"}
                    </button>
                  ) : (
                    <div className="mt-5 rounded-2xl bg-gray-50 p-4 text-sm leading-5 text-gray-500">
                      No cancellation action is available for this booking status.
                    </div>
                  )}

                  <Link
                    to="/tourist/dashboard"
                    className="mt-3 flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                  >
                    View all my trips
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </section>

                <section className="rounded-[2rem] bg-white p-6 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c49b58]">Your journey</p>
                  <h2 className="mt-2 text-xl font-black text-gray-900">Keep this page handy</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    Your booking status, selected resources, payment details and review entry point stay together here.
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-gray-500">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Booking details are loaded from your account.
                  </div>
                </section>
              </aside>
            </div>

            {booking.overallRating && (
              <section className="mt-6 rounded-[2rem] bg-[#fff7df] p-6 md:p-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a4772f]">Your feedback</p>
                <h2 className="mt-1 text-2xl font-black text-gray-900">
                  {booking.overallRatingDescription || ratingDescription(booking.overallRating)} · {booking.overallRating}/5
                </h2>
                {booking.overallReview && <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">{booking.overallReview}</p>}
              </section>
            )}
          </>
        )}
      </main>

      {reviewDialogOpen && booking && reviewAvailable && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#c49b58]">After the journey</p>
                <h2 className="mt-1 text-2xl font-black text-gray-900">Rate your booking</h2>
                <p className="mt-1 text-sm text-gray-500">Use 1 to 5 stars, then add a short descriptive review.</p>
              </div>
              <button
                type="button"
                onClick={() => setReviewDialogOpen(false)}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {reviewTargets.map((target) => (
                <ReviewForm
                  key={target.targetType}
                  bookingId={booking.id}
                  target={target}
                  submitted={reviews.some((review) => review.targetType === target.targetType)}
                  onSaved={(review) => {
                    setReviews((items) => {
                      const updatedReviews = [
                        review,
                        ...items.filter((item) => item.targetType !== review.targetType),
                      ];
                      const allSubmitted = reviewTargets.every((item) =>
                        updatedReviews.some((saved) => saved.targetType === item.targetType),
                      );
                      setBooking((current) =>
                        current
                          ? {
                              ...current,
                              ...(review.targetType === "BOOKING"
                                ? {
                                    overallRating: review.rating,
                                    overallRatingDescription: ratingDescription(review.rating),
                                    overallReview: review.comment || "",
                                  }
                                : {}),
                              ...(allSubmitted ? { status: "Completed" } : {}),
                            }
                          : current,
                      );
                      return updatedReviews;
                    });
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

type ReviewTarget = {
  targetType: "GUIDE" | "ACCOMMODATION" | "VEHICLE" | "BOOKING";
  targetId?: number;
  label: string;
  name: string;
};

function buildReviewTargets(booking: Booking): ReviewTarget[] {
  const targets: ReviewTarget[] = [];
  if (booking.guideId) {
    targets.push({
      targetType: "GUIDE",
      targetId: booking.guideId,
      label: "Tour guide",
      name: booking.guide || "Tour guide",
    });
  }
  if (booking.accommodationId) {
    targets.push({
      targetType: "ACCOMMODATION",
      targetId: booking.accommodationId,
      label: "Accommodation",
      name: accommodationName(booking.accommodation) || "Accommodation",
    });
  }
  if (booking.vehicleId) {
    targets.push({
      targetType: "VEHICLE",
      targetId: booking.vehicleId,
      label: "Vehicle",
      name: booking.vehicle || "Vehicle",
    });
  }
  targets.push({
    targetType: "BOOKING",
    label: "Overall trip",
    name: booking.pkg || "Voyara booking",
  });
  return targets;
}

function ReviewForm({
  bookingId,
  target,
  submitted,
  onSaved,
}: {
  bookingId: string;
  target: ReviewTarget;
  submitted: boolean;
  onSaved: (review: Review) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const review = await touristReviewsApi.create(bookingId, {
        targetType: target.targetType,
        targetId: target.targetId,
        rating,
        comment: comment.trim() || undefined,
      });
      onSaved(review);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save review");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <div className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">{target.label}</p>
        <h3 className="mt-1 font-bold text-gray-900">{target.name}</h3>
      </div>

      {submitted ? (
        <div className="rounded-xl bg-green-50 p-3 text-sm font-semibold text-green-700">
          Review submitted
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded-lg p-1 transition hover:bg-white"
                aria-label={`Rate ${value} out of 5 stars`}
              >
                <Star
                  className="h-5 w-5"
                  style={{
                    color: "#f59e0b",
                    fill: value <= rating ? "#f59e0b" : "transparent",
                  }}
                />
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-gray-400"
            placeholder="Write your feedback..."
          />

          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={saving || rating === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-[#12372f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1b4c40] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {saving ? "Saving..." : "Submit review"}
          </button>
        </div>
      )}
    </div>
  );
}

function ProviderStatus({ label, value }: { label: string; value: string }) {
  const normalized = value.toLowerCase();
  const confirmed = normalized === "confirmed";
  const rejected = normalized === "rejected";

  return (
    <div className="rounded-xl bg-gray-50 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span
          className="rounded-full px-2.5 py-1 text-xs font-semibold"
          style={{
            background: confirmed ? "#f0fdf4" : rejected ? "#fef2f2" : "#fffbeb",
            color: confirmed ? "#16a34a" : rejected ? "#dc2626" : "#d97706",
          }}
        >
          {value}
        </span>
      </div>
    </div>
  );
}

function accommodationName(value?: string) {
  return value?.split(" · ")[0]?.trim() || "";
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f7f5ef] p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="text-sm font-semibold leading-5 text-gray-800">{value}</p>
    </div>
  );
}
