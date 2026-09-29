import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, Check, Clock3, GitCompare, MapPin, Star, Users, X } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { packagesApi, type TourPackage } from "../../lib/api";

const fallbackImages = [
  "https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1586500036706-41963de24d8b?auto=format&fit=crop&w=1400&q=85",
  "https://images.unsplash.com/photo-1588598198321-9735fd52455b?auto=format&fit=crop&w=1400&q=85",
];

function imageFor(pkg: TourPackage, index: number) {
  return pkg.image || fallbackImages[index % fallbackImages.length];
}

function inclusions(pkg: TourPackage) {
  return (pkg.included || "").split(",").map((value) => value.trim()).filter(Boolean);
}

function hasInclusion(pkg: TourPackage, terms: string[]) {
  const value = (pkg.included || "").toLowerCase();
  return terms.some((term) => value.includes(term));
}

export default function ComparePackages() {
  const [packages, setPackages] = useState<TourPackage[]>([]);
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    packagesApi.list()
      .then((items) => setPackages(items.filter((item) => item.status === "Active")))
      .catch(() => setPackages([]));
  }, []);

  const selectedPackages = useMemo(
    () => selected.map((id) => packages.find((pkg) => pkg.id === id)).filter(Boolean) as TourPackage[],
    [packages, selected]
  );

  const toggle = (id: number) => {
    setSelected((current) => current.includes(id)
      ? current.filter((value) => value !== id)
      : current.length < 3 ? [...current, id] : current);
  };

  return (
    <div className="min-h-screen bg-[#f6f7f5]">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-[#0b1f3a] text-white">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #ff385c 0, transparent 28%), radial-gradient(circle at 80% 10%, #4f8cff 0, transparent 30%)" }} />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-rose-300">
              <GitCompare className="h-4 w-4" /> Compare journeys
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">
              Find your way around Sri Lanka.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
              Shortlist journeys visually, understand what is already included, and move directly into the package you want to personalise.
            </p>
            <div className="mt-7 flex flex-wrap gap-2 text-xs font-bold text-white/80">
              <span className="rounded-full bg-white/10 px-3 py-2">01 · Shortlist</span>
              <span className="rounded-full bg-white/10 px-3 py-2">02 · Compare</span>
              <span className="rounded-full bg-white/10 px-3 py-2">03 · Personalise</span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">Your shortlist</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#10213b]">Choose up to three escapes</h2>
              <p className="mt-2 text-sm text-gray-500">Select a card to bring it into the comparison.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-gray-600 shadow-sm ring-1 ring-gray-200">{selected.length}/3 selected</span>
              {selected.length > 0 && <button type="button" onClick={() => setSelected([])} className="text-sm font-bold text-gray-500 hover:text-gray-900">Clear</button>}
            </div>
          </div>

          {packages.length === 0 ? (
            <div className="mt-8 rounded-[2rem] bg-white p-12 text-center shadow-sm ring-1 ring-gray-200">
              <p className="font-bold text-gray-900">No active packages are available right now.</p>
              <Link to="/explore?tab=tours" className="mt-4 inline-flex rounded-full bg-[#ff385c] px-5 py-3 text-sm font-black text-white">Explore tours</Link>
            </div>
          ) : (
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {packages.map((pkg, index) => {
                const active = selected.includes(pkg.id);
                return (
                  <article key={pkg.id} className={"group overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 transition duration-300 hover:-translate-y-1 hover:shadow-xl " + (active ? "ring-2 ring-rose-400" : "ring-gray-200")}>
                    <button type="button" onClick={() => toggle(pkg.id)} className="block w-full text-left" aria-pressed={active}>
                      <div className="relative h-64 overflow-hidden">
                        <img src={imageFor(pkg, index)} alt={pkg.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                        <div className="absolute left-5 top-5 flex items-center gap-2">
                          <span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#10213b]">{pkg.category}</span>
                          {active && <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff385c] text-white"><Check className="h-4 w-4" /></span>}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                          <h3 className="text-2xl font-black leading-tight">{pkg.name}</h3>
                          <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-white/80"><MapPin className="h-3.5 w-3.5" /> {pkg.destinations.join(" · ")}</p>
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="flex flex-wrap gap-3 text-xs font-semibold text-gray-500">
                          <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" /> {pkg.duration} days</span>
                          <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" /> Up to {pkg.maxGroup}</span>
                          <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {Number(pkg.rating || 0).toFixed(1)}</span>
                        </div>
                        <div className="mt-5 flex items-end justify-between gap-4">
                          <div><p className="text-[10px] font-black uppercase tracking-wider text-gray-400">From</p><p className="text-2xl font-black text-[#10213b]">LKR {Number(pkg.price || 0).toLocaleString()}</p></div>
                          <span className="text-xs font-bold text-gray-400">per traveller</span>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          {inclusions(pkg).slice(0, 4).map((item) => <span key={item} className="rounded-full bg-[#f4f6f8] px-2.5 py-1 text-[11px] font-bold text-gray-600">{item}</span>)}
                        </div>
                      </div>
                    </button>
                    <div className="grid grid-cols-2 gap-2 border-t border-gray-100 p-4">
                      <Link to={"/packages/" + pkg.id} className="rounded-xl border border-gray-200 px-3 py-3 text-center text-xs font-black text-gray-700 hover:bg-gray-50">View journey</Link>
                      <Link to={"/tourist/packages/" + pkg.id + "/customize"} className="rounded-xl bg-[#ff385c] px-3 py-3 text-center text-xs font-black text-white hover:bg-[#e91f47]">Customize</Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {selectedPackages.length >= 2 && (
            <section className="mt-14">
              <div className="mb-7 flex items-end justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-500">Side by side</p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-[#10213b]">Compare the experience</h2>
                </div>
                <p className="hidden text-sm text-gray-500 md:block">A quick visual guide — not a spreadsheet.</p>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                {selectedPackages.map((pkg, index) => {
                  const items = inclusions(pkg);
                  return (
                    <article key={pkg.id} className="overflow-hidden rounded-[2rem] bg-white shadow-sm ring-1 ring-gray-200">
                      <div className="relative h-44 overflow-hidden">
                        <img src={imageFor(pkg, index)} alt="" className="h-full w-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/70">{pkg.category}</p>
                          <h3 className="mt-1 text-xl font-black">{pkg.name}</h3>
                        </div>
                      </div>
                      <div className="p-5">
                        <div className="grid grid-cols-2 gap-3">
                          <MiniStat icon={Clock3} label="Duration" value={pkg.duration + " days"} />
                          <MiniStat icon={Users} label="Group" value={"Up to " + pkg.maxGroup} />
                          <MiniStat icon={Star} label="Rating" value={Number(pkg.rating || 0).toFixed(1)} />
                          <MiniStat icon={MapPin} label="Places" value={pkg.destinations[0] || "Sri Lanka"} />
                        </div>

                        <div className="mt-6 rounded-2xl bg-[#f7f8fa] p-4">
                          <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Included</p>
                          <div className="mt-3 space-y-2.5">
                            {items.slice(0, 6).map((item) => <div key={item} className="flex items-start gap-2 text-sm font-bold text-gray-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{item}</div>)}
                            {!items.length && <p className="text-sm text-gray-500">Package inclusions have not been listed.</p>}
                          </div>
                        </div>

                        <div className="mt-4 space-y-2 text-sm">
                          <ComparisonLine label="Accommodation" included={hasInclusion(pkg, ["accommodation", "hotel", "lodge", "villa", "stay"])} />
                          <ComparisonLine label="Guide" included={hasInclusion(pkg, ["guide", "naturalist"])} />
                          <ComparisonLine label="Transport" included={hasInclusion(pkg, ["transport", "transfer", "van", "vehicle", "jeep"])} />
                          <ComparisonLine label="Breakfast" included={hasInclusion(pkg, ["breakfast"])} />
                        </div>

                        <div className="mt-6 flex items-end justify-between border-t border-gray-100 pt-5">
                          <div><p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Package price</p><p className="text-xl font-black text-[#10213b]">LKR {Number(pkg.price || 0).toLocaleString()}</p></div>
                          <Link to={"/tourist/packages/" + pkg.id + "/customize"} className="inline-flex items-center gap-1.5 rounded-full bg-[#10213b] px-4 py-2.5 text-xs font-black text-white">Choose <ArrowRight className="h-3.5 w-3.5" /></Link>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {selectedPackages.length < 2 && (
            <div className="mt-10 flex items-center justify-center gap-3 rounded-[2rem] border border-dashed border-gray-300 bg-white/60 p-8 text-center">
              <GitCompare className="h-5 w-5 text-gray-400" />
              <p className="text-sm font-semibold text-gray-500">Select at least two journeys to compare them here.</p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: typeof Clock3; label: string; value: string }) {
  return <div className="rounded-2xl bg-gray-50 p-3"><Icon className="h-4 w-4 text-gray-400" /><p className="mt-2 text-[10px] font-black uppercase tracking-wider text-gray-400">{label}</p><p className="mt-1 truncate text-xs font-black text-[#10213b]">{value}</p></div>;
}

function ComparisonLine({ label, included }: { label: string; included: boolean }) {
  return <div className="flex items-center justify-between rounded-xl px-3 py-2.5 odd:bg-gray-50"><span className="font-semibold text-gray-600">{label}</span>{included ? <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600"><Check className="h-4 w-4" /> Included</span> : <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-400"><X className="h-4 w-4" /> Optional</span>}</div>;
}
