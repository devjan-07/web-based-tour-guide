import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, Check, Clock, Star, GitCompare, ArrowRight } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { packagesApi, type TourPackage } from "../../lib/api";

const STORAGE_KEY = "voyara_package_compare_v1";

export default function ComparePackages() {
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [selected, setSelected] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });

  useEffect(() => { packagesApi.list().then((items) => setPackages(items.filter((item) => item.status === "Active"))).catch(() => setPackages([])); }, []);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(selected)); }, [selected]);

  const selectedPackages = useMemo(() => selected.map((id) => packages.find((item) => item.id === id)).filter(Boolean) as TourPackage[], [packages, selected]);

  const toggle = (id: number) => setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : items.length >= 3 ? items : [...items, id]);

  return <div className="min-h-screen bg-gray-50"><Navbar /><main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <Link to="/explore?tab=tours" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Back to tour packages</Link>
    <div className="mt-5 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#062a56] via-[#003580] to-[#0057B8] p-7 text-white shadow-xl md:p-10">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/70"><GitCompare className="h-4 w-4" /> Package comparison</div>
      <h1 className="mt-2 text-3xl font-extrabold md:text-5xl">Compare tours before you choose.</h1>
      <p className="mt-3 max-w-2xl text-sm text-white/80">Select up to three active packages and compare price, duration, group size, difficulty and rating side by side.</p>
    </div>
    <section className="mt-6 rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-center justify-between gap-3"><h2 className="font-extrabold text-gray-900">Choose packages</h2><span className={"rounded-full px-3 py-1 text-xs font-bold " + (selected.length === 3 ? "bg-rose-50 text-rose-600" : "bg-gray-100 text-gray-500")}>{selected.length}/3 selected</span></div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => <button key={pkg.id} type="button" onClick={() => toggle(pkg.id)} aria-pressed={selected.includes(pkg.id)} className={"group text-left rounded-2xl border p-4 transition duration-200 " + (selected.includes(pkg.id) ? "border-rose-400 bg-rose-50 shadow-sm" : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md")}>
          <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-gray-900">{pkg.name}</p><p className="mt-1 text-xs text-gray-500">{pkg.category} · {pkg.destinations.join(", ")}</p></div>{selected.includes(pkg.id) && <Check className="h-5 w-5 text-rose-500" />}</div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="font-extrabold text-gray-900">LKR {Number(pkg.price || 0).toLocaleString()}</span>
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {pkg.duration} days</span>
            <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5" /> {Number(pkg.rating || 0).toFixed(1)}</span>
          </div>
        </button>)}
      </div>
    </section>
    {selectedPackages.length >= 2 && <section className="mt-6 overflow-x-auto rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-500">Side by side</p><h2 className="mt-1 font-extrabold text-gray-900">Comparison</h2></div><button type="button" onClick={() => setSelected([])} className="text-xs font-semibold text-gray-500">Clear</button></div>
      <table className="mt-4 min-w-[760px] w-full text-left text-sm"><thead><tr><th className="sticky left-0 z-10 bg-white p-3 text-xs uppercase tracking-wide text-gray-400">Feature</th>{selectedPackages.map((pkg) => <th key={pkg.id} className="p-3 font-bold text-gray-900">{pkg.name}</th>)}</tr></thead>
      <tbody>{[
        ["Price", ...selectedPackages.map((p) => "LKR " + Number(p.price || 0).toLocaleString())],
        ["Duration", ...selectedPackages.map((p) => p.duration + " days")],
        ["Max group", ...selectedPackages.map((p) => String(p.maxGroup))],
        ["Difficulty", ...selectedPackages.map((p) => p.difficulty)],
        ["Rating", ...selectedPackages.map((p) => Number(p.rating || 0).toFixed(1) + " ★")],
        ["Destinations", ...selectedPackages.map((p) => p.destinations.join(", "))],
      ].map((row) => <tr key={row[0]} className="border-t border-gray-100"><td className="sticky left-0 z-10 bg-white p-3 font-semibold text-gray-500">{row[0]}</td>{row.slice(1).map((value, index) => <td key={index} className="p-3 font-semibold text-gray-800">{value}</td>)}</tr>)}</tbody></table>
    </section>}
    {selectedPackages.length < 2 && <div className="mt-6 rounded-[2rem] border border-dashed border-gray-200 bg-white p-10 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Check className="h-6 w-6" /></div>
      <h2 className="mt-4 font-extrabold text-gray-900">Your comparison is waiting</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">Select two or three packages above to compare their existing details side by side.</p>
    </div>}
  </main><Footer /></div>;
}
