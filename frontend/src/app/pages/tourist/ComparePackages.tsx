import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Check, Clock3, GitCompare, MapPin, Star, Users } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { packagesApi, type TourPackage } from "../../lib/api";

const STORAGE_KEY = "voyara_package_compare_v1";
const fallbackImages = [
  "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1586500036706-41963de24d8b?auto=format&fit=crop&w=1400&q=85",
];

function packageImage(pkg: TourPackage, index: number) {
  return pkg.image || fallbackImages[index % fallbackImages.length];
}

function includedItems(pkg: TourPackage) {
  return (pkg.included || "").split(",").map((item) => item.trim()).filter(Boolean).slice(0, 6);
}

export default function ComparePackages() {
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [selected, setSelected] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
  });

  useEffect(() => {
    packagesApi.list()
      .then((items) => setPackages(items.filter((item) => item.status === "Active")))
      .catch(() => setPackages([]));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(selected));
  }, [selected]);

  const selectedPackages = useMemo(
    () => selected.map((id) => packages.find((item) => item.id === id)).filter(Boolean) as TourPackage[],
    [packages, selected]
  );

  const toggle = (id: number) => setSelected((items) =>
    items.includes(id)
      ? items.filter((item) => item !== id)
      : items.length >= 3 ? items : [...items, id]
  );

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-[#071a33] text-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-rose-300">
                <GitCompare className="h-4 w-4" /> Compare escapes
              </div>
              <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Find the trip that fits your travel style.</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
                Explore the experiences, places and inclusions behind each package before you decide how you want to travel.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">Your shortlist</p>
              <h2 className="mt-1 text-2xl font-black text-[#10213b] md:text-3xl">Choose up to three experiences</h2>
            </div>
            <span className="w-fit rounded-full bg-white px-4 py-2 text-xs font-black text-gray-600 shadow-sm ring-1 ring-gray-200">{selected.length}/3 selected</span>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg, index) => {
              const active = selected.includes(pkg.id);
              return (
                <article key={pkg.id} className={"overflow-hidden rounded-[1.75rem] bg-white shadow-sm ring-1 transition hover:-translate-y-1 hover:shadow-xl " + (active ? "ring-rose-400 shadow-lg" : "ring-gray-200")}>
                  <button type="button" onClick={() => toggle(pkg.id)} aria-pressed={active} className="block w-full text-left">
                    <div className="relative h-56 overflow-hidden">
                      <img src={packageImage(pkg, index)} alt={pkg.name} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 pt-20 text-white">
                        <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-gray-800">{pkg.category}</span>
                        <h3 className="mt-2 text-xl font-black">{pkg.name}</h3>
                      </div>
                      {active && <span className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg"><Check className="h-5 w-5" /></span>}
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" />{pkg.duration} days</span>
                        <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-current text-amber-400" />{Number(pkg.rating || 0).toFixed(1)}</span>
                        <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" />{pkg.maxGroup || "—"}</span>
                      </div>
                      <p className="mt-4 text-2xl font-black text-[#10213b]">LKR {Number(pkg.price || 0).toLocaleString()}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {pkg.destinations.slice(0, 3).map((destination) => <span key={destination} className="rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-bold text-gray-600">{destination}</span>)}
                      </div>
                    </div>
                  </button>
                  <div className="flex gap-2 border-t border-gray-100 p-4">
                    <Link to={"/packages/" + pkg.id} className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-center text-xs font-black text-gray-700 hover:bg-gray-50">View details</Link>
                    <Link to={"/tourist/packages/" + pkg.id + "/customize"} className="flex-1 rounded-xl bg-[#FF385C] px-3 py-2.5 text-center text-xs font-black text-white hover:bg-[#e91f47]">Customize</Link>
                  </div>
                </article>
              );
            })}
          </div>

          {selectedPackages.length >= 2 && (
            <section className="mt-12 rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-gray-200 md:p-8">
              <div className="flex flex-col gap-2 border-b border-gray-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-500">At a glance</p>
                  <h2 className="mt-1 text-2xl font-black text-[#10213b]">Compare the experience</h2>
                </div>
                <button type="button" onClick={() => setSelected([])} className="text-sm font-bold text-gray-500 hover:text-gray-900">Clear selection</button>
              </div>

              <div className="mt-6 grid gap-5 lg:grid-cols-3">
                {selectedPackages.map((pkg) => (
                  <article key={pkg.id} className="rounded-2xl bg-[#f8fafc] p-5 ring-1 ring-gray-100">
                    <p className="text-xs font-black uppercase tracking-wider text-gray-400">{pkg.category}</p>
                    <h3 className="mt-1 font-black text-[#10213b]">{pkg.name}</h3>
                    <p className="mt-4 text-2xl font-black text-[#10213b]">LKR {Number(pkg.price || 0).toLocaleString()}</p>
                    <div className="mt-5 space-y-3 text-sm">
                      <CompareRow icon={Clock3} label="Duration" value={pkg.duration + " days"} />
                      <CompareRow icon={Users} label="Group" value={"Up to " + (pkg.maxGroup || "flexible") + " travellers"} />
                      <CompareRow icon={Star} label="Guest rating" value={Number(pkg.rating || 0).toFixed(1) + " / 5"} />
                      <CompareRow icon={MapPin} label="Places" value={pkg.destinations.join(", ")} />
                    </div>
                    <div className="mt-5 border-t border-gray-200 pt-4">
                      <p className="text-xs font-black uppercase tracking-wider text-gray-400">Included in this experience</p>
                      <div className="mt-3 space-y-2">
                        {includedItems(pkg).map((item) => <div key={item} className="flex items-start gap-2 text-sm font-semibold text-gray-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{item}</div>)}
                      </div>
                    </div>
                    <Link to={"/tourist/packages/" + pkg.id + "/customize"} className="mt-5 flex items-center justify-center gap-2 rounded-xl bg-[#10213b] px-4 py-3 text-sm font-black text-white">Choose this trip <ArrowRight className="h-4 w-4" /></Link>
                  </article>
                ))}
              </div>
            </section>
          )}

          {selectedPackages.length < 2 && (
            <div className="mt-10 rounded-[2rem] border border-dashed border-gray-300 bg-white/70 p-10 text-center">
              <p className="font-black text-[#10213b]">Select two or three packages to compare them.</p>
              <p className="mt-2 text-sm text-gray-500">You can still open any package above and start customizing it immediately.</p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function CompareRow({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return <div className="flex items-start gap-3"><Icon className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" /><div><p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</p><p className="mt-0.5 font-bold text-gray-800">{value}</p></div></div>;
}
