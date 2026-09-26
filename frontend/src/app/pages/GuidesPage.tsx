import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Languages, MapPin, Search, ShieldCheck, Star, UserRound, ArrowRight } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { guidesApi, TOUR_GUIDE_SPECIALTIES, type Guide } from "../lib/api";

export default function GuidesPage() {
  const [guides, setGuides] = useState<Guide[]>([]);
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    guidesApi.list().then(items => setGuides(items.filter(item => item.status === "Available"))).catch(() => setGuides([])).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guides.filter(item => {
      const matchesQuery = !q || [item.name, item.location, item.country, item.bio, ...(item.specialties || []), ...(item.languages || [])].join(" ").toLowerCase().includes(q);
      const matchesSpecialty = !specialty || (item.specialties || []).some(value => value.toLowerCase() === specialty.toLowerCase());
      return matchesQuery && matchesSpecialty;
    }).sort((a,b) => Number(b.rating || 0) - Number(a.rating || 0));
  }, [guides, query, specialty]);

  return <div className="min-h-screen bg-[#f8fafc]">
    <Navbar />
    <header className="bg-[#062a56]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 md:py-18">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-rose-300">Local knowledge</p>
        <h1 className="mt-3 text-4xl font-black text-white md:text-5xl">Meet your local guide.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/75">Find available guides by language, travel style and destination experience, then add a suitable guide while planning your trip.</p>
        <div className="mt-7 flex max-w-3xl flex-col gap-2 rounded-2xl bg-white p-2 md:flex-row">
          <div className="flex flex-1 items-center gap-2 px-3"><Search className="h-5 w-5 text-rose-500" /><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search guides, languages or places..." className="min-w-0 flex-1 py-3 text-sm outline-none" /></div>
          <select value={specialty} onChange={e=>setSpecialty(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none">
            <option value="">All specialties</option>
            {TOUR_GUIDE_SPECIALTIES.map(value=><option key={value} value={value}>{value}</option>)}
          </select>
        </div>
      </div>
    </header>
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-rose-500">Available now</p><h2 className="mt-1 text-2xl font-black text-gray-900">Guides for your kind of trip</h2></div><Link to="/tourist/plan" className="hidden items-center gap-2 text-sm font-bold text-rose-500 transition hover:gap-3 sm:flex">Plan a trip <ArrowRight className="h-4 w-4" /></Link></div>
      {loading ? <div className="rounded-3xl bg-white p-12 text-center text-sm text-gray-400">Finding available guides...</div> : filtered.length ? <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{filtered.map(guide=><article key={guide.id} className="group overflow-hidden rounded-3xl bg-white p-5 shadow-sm ring-1 ring-gray-200 transition duration-200 hover:-translate-y-1 hover:shadow-lg">
        <div className="flex items-start gap-4"><div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#003580] text-lg font-black text-white">{guide.initials || guide.name.slice(0,2).toUpperCase()}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><h3 className="font-extrabold text-gray-900">{guide.name}</h3><span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700"><Star className="h-3 w-3 fill-amber-400 text-amber-400" />{Number(guide.rating || 0).toFixed(1)}</span></div><p className="mt-1 flex items-center gap-1 text-xs text-gray-500"><MapPin className="h-3.5 w-3.5" />{guide.location}, {guide.country}</p></div></div>
        <p className="mt-4 line-clamp-3 text-sm leading-6 text-gray-600">{guide.bio || "Local guide ready to help you experience the destination."}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">{(guide.specialties || []).slice(0,3).map(value=><span key={value} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">{value}</span>)}</div>
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500"><span className="inline-flex items-center gap-1"><Languages className="h-3.5 w-3.5" />{(guide.languages || []).slice(0,2).join(", ") || "Flexible"}</span><span className="inline-flex items-center gap-1"><UserRound className="h-3.5 w-3.5" />{guide.toursCompleted || 0} tours</span></div>
        <div className="mt-4 flex items-center justify-between"><span className="font-black text-gray-900">LKR {Number(guide.pricePerDay || 0).toLocaleString()} <span className="text-xs font-medium text-gray-400">/ day</span></span><span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"><ShieldCheck className="h-4 w-4" /> Available</span></div>
        <Link to="/tourist/plan" className="mt-4 flex items-center justify-center rounded-xl bg-[#FF385C] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#e31c5f]">Use in trip planner</Link>
      </article>)}</div> : <div className="rounded-3xl bg-white p-12 text-center ring-1 ring-gray-200"><UserRound className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-3 font-bold text-gray-900">No guides matched your search.</p><p className="mt-1 text-sm text-gray-500">Try a different specialty or search term.</p></div>}
    </main>
    <Footer />
  </div>;
}