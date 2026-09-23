import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, CalendarDays, CheckCircle, Clock, CreditCard, HelpCircle, MapPin, ShieldCheck, Tag, Users, Star } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { destinationsApi, packagesApi, type Destination, type TourPackage, type Route } from "../lib/api";

type DetailMode = "destination" | "package";

type DetailItem =
  | { mode: "destination"; data: Destination }
  | { mode: "package"; data: TourPackage };

export function DestinationDetailPage() {
  return <PlaceDetailPage mode="destination" />;
}

export function PackageDetailPage() {
  return <PlaceDetailPage mode="package" />;
}

function PlaceDetailPage({ mode }: { mode: DetailMode }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [item, setItem] = useState<DetailItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [packageRoutes, setPackageRoutes] = useState<Route[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const isTourist = isAuthenticated && user?.roles.includes("TOURIST");

  useEffect(() => {
    const numericId = Number(id);
    if (!id || Number.isNaN(numericId)) {
      setError("This place could not be found.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");
    setPackageRoutes([]);

    const request = mode === "destination"
      ? destinationsApi.get(numericId).then((data) => ({ mode: "destination" as const, data }))
      : packagesApi.get(numericId).then((data) => ({ mode: "package" as const, data }));

    request
      .then((data) => {
        if (data.mode === "package") {
          setRoutesLoading(true);
          packagesApi.routes(data.data.id)
            .then((routes) => { if (!cancelled) setPackageRoutes(routes); })
            .catch(() => { if (!cancelled) setPackageRoutes([]); })
            .finally(() => { if (!cancelled) setRoutesLoading(false); });
        }
        if (!cancelled) setItem(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "This place could not be loaded.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, mode]);

  const detail = useMemo(() => item ? toDetail(item) : null, [item]);
  const bookingPath = detail && item?.mode === "package"
    ? `/book?packageId=${item.data.id}`
    : detail
      ? `/book?destination=${encodeURIComponent(detail.title)}${item?.mode === "destination" ? `&destinationId=${item.data.id}` : ""}`
      : "/book";
  const loginPath = `/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;

  return (
    <div className="min-h-screen bg-[#f7f5ef]">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-5">
          <ArrowLeft className="w-4 h-4" /> Back to explore
        </Link>

        {loading && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-sm text-gray-500">
            Loading details...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-8">
            <p className="font-bold text-rose-700">Could not load this place</p>
            <p className="mt-1 text-sm text-rose-600">{error}</p>
          </div>
        )}

        {!loading && detail && (
          <article className="overflow-hidden rounded-[2rem] bg-white shadow-sm">
            <section className="relative min-h-[70vh] overflow-hidden md:min-h-[76vh]">
              <motion.img initial={{ scale: 1.06 }} animate={{ scale: 1 }} transition={{ duration: 1.2, ease: "easeOut" }}
                src={detail.image || "https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=1600"} alt={detail.title}
                className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white md:p-12">
                <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .7, delay: .2 }}>
                  <div className="mb-4 flex flex-wrap gap-2"><span className="rounded-full border border-white/25 bg-black/20 px-3 py-1.5 text-xs font-bold uppercase tracking-[.18em] backdrop-blur-md">{detail.typeLabel}</span>{detail.status && <span className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold">{detail.status}</span>}</div>
                  <h1 className="max-w-5xl text-5xl font-semibold leading-[.95] tracking-[-.045em] md:text-7xl">{detail.title}</h1>
                  <div className="mt-5 flex items-center gap-2 text-sm text-white/75"><MapPin className="h-4 w-4" />{detail.location}</div>
                </motion.div>
              </div>
            </section>
            <div className="grid grid-cols-1 gap-12 p-6 md:grid-cols-[1fr_340px] md:p-12">
              <section>
                <div className="flex flex-wrap gap-2">{detail.tags.map((tag) => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">{tag}</span>)}</div>
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-10">
                  <p className="text-xs font-bold uppercase tracking-[.25em] text-emerald-700">Discover</p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] text-slate-950 md:text-4xl">A place worth slowing down for.</h2>
                  <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">{detail.description}</p>
                </motion.div>
                {detail.included.length > 0 && <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-14">
                  <p className="text-xs font-bold uppercase tracking-[.25em] text-emerald-700">Highlights</p>
                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">{detail.included.map((value, index) => <div key={value} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-[#f7f5ef] p-5"><span className="text-xs font-bold text-emerald-700">0{index + 1}</span><span className="text-sm leading-6 text-slate-700">{value}</span></div>)}</div>
                </motion.div>}
                {item?.mode === "package" && <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-14">
                  <p className="text-xs font-bold uppercase tracking-[.25em] text-emerald-700">The route</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] text-slate-950">Follow the journey.</h2>
                  {routesLoading && <p className="mt-5 text-sm text-slate-500">Loading route details...</p>}
                  {!routesLoading && packageRoutes.length === 0 && <p className="mt-5 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No active route details are linked to this package's destinations yet.</p>}
                  {!routesLoading && packageRoutes.length > 0 && <div className="mt-6 space-y-3">{packageRoutes.map((route, index) => <div key={route.id} className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">{index + 1}</span><div className="min-w-0"><p className="font-semibold text-slate-900">{route.routeName}</p><p className="mt-1 text-sm text-slate-600">{route.startLocation} → {route.endLocation}</p><p className="mt-2 text-xs text-slate-400">{route.distanceKm ? String(route.distanceKm) + " km" : "Distance not specified"}{route.estimatedDuration ? " · " + String(route.estimatedDuration) + " min" : ""}</p></div></div>)}</div>}
                </motion.div>}
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-14">
                  <p className="text-xs font-bold uppercase tracking-[.25em] text-emerald-700">Good to know</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.03em] text-slate-950">Everything you need to plan.</h2>
                  <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">{[{ icon: CalendarDays, title: "Choose dates", text: "Select travel dates and group size during booking." }, { icon: ShieldCheck, title: "Check availability", text: "Voyara validates available guides, stays and transport." }, { icon: CreditCard, title: "Pay when ready", text: "Payment becomes available after the booking is created." }].map(({ icon: Icon, title, text }) => <div key={title} className="rounded-2xl bg-[#f7f5ef] p-5"><Icon className="h-5 w-5 text-emerald-700" /><p className="mt-4 text-sm font-bold text-slate-900">{title}</p><p className="mt-2 text-xs leading-5 text-slate-500">{text}</p></div>)}</div>
                </motion.div>
              </section>
              <aside className="md:sticky md:top-24 md:h-fit"><div className="rounded-[1.5rem] bg-slate-950 p-6 text-white shadow-xl">
                <p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-300">Plan your journey</p><h2 className="mt-3 text-2xl font-semibold">Make this place part of your trip.</h2>
                <div className="mt-6 space-y-3">{detail.facts.map(({ icon: Icon, label, value }) => <div key={label} className="flex items-start gap-3 border-b border-white/10 pb-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-white/50" /><div><p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div></div>)}</div>
                {isTourist && <button onClick={() => navigate(bookingPath)} className="mt-6 w-full rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition-transform hover:scale-[1.02]">Book this trip</button>}
                {!isAuthenticated && <Link to={loginPath} className="mt-6 flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950">Log in to book</Link>}
                {!isTourist && isAuthenticated && <div className="mt-6 rounded-xl bg-white/10 p-4 text-xs leading-5 text-white/60">Tourist accounts can create trip bookings from this page.</div>}
                <Link to="/help" className="mt-3 flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 hover:bg-white/10"><HelpCircle className="h-4 w-4" /> Need help?</Link>
              </div></aside>
            </div>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}

function toDetail(item: DetailItem) {
  if (item.mode === "destination") {
    const data = item.data;
    return {
      typeLabel: "Destination",
      title: data.name,
      location: [data.name, data.country].filter(Boolean).join(", "),
      image: data.image,
      status: data.status,
      tags: data.categories || [],
      description: data.description || "Explore this Sri Lankan destination with Voyara's curated travel planning details.",
      included: splitList(data.highlights),
      facts: [
        { icon: MapPin, label: "Country", value: data.country || "Sri Lanka" },
        { icon: Tag, label: "Best season", value: data.bestSeason || "Year round" },
      ],
    };
  }

  const data = item.data;
  return {
    typeLabel: "Tour Package",
    title: data.name,
    location: data.destinations.join(", "),
    image: data.image,
    status: data.status,
    tags: [data.category, data.difficulty].filter(Boolean),
    description: data.description || "Review this package's travel details before deciding whether to book.",
    included: splitList(data.included),
    facts: [
      { icon: Clock, label: "Duration", value: `${Number(data.duration || 0)} day${Number(data.duration || 0) === 1 ? "" : "s"}` },
      { icon: Users, label: "Group size", value: `Up to ${Number(data.maxGroup || 0)} people` },
      { icon: Tag, label: "Price", value: `LKR ${Number(data.price || 0).toLocaleString()} / person` },
      { icon: CalendarDays, label: "Difficulty", value: data.difficulty || "Easy" },
    ],
  };
}

function splitList(value?: string) {
  if (!value) return [];
  return value
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}
