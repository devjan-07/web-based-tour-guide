import { useEffect, useState } from "react";
import {
  Search,
  X,
  Waves,
  Landmark,
  Mountain,
  UtensilsCrossed,
  Trees,
  ArrowDown,
  ArrowUpRight,
  MapPin,
  Sparkles,
} from "lucide-react";

interface HeroProps {
  onSearch?: (query: string) => void;
  onClear?: () => void;
  hasActiveFilter?: boolean;
  onCategoryChange?: (category: string) => void;
}

export function Hero({ onSearch, onClear, hasActiveFilter = false, onCategoryChange }: HeroProps) {
  const [query, setQuery] = useState("");
  const [scrollY, setScrollY] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 120);
    const onScroll = () => setScrollY(Math.min(window.scrollY, 620));
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const handleSearch = () => {
    onSearch?.(query.trim());
    document.getElementById("listings-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const quickTags = [
    { icon: Waves, label: "Beaches", cat: "Beaches" },
    { icon: Landmark, label: "Culture", cat: "Cultural" },
    { icon: Mountain, label: "Adventure", cat: "Hiking" },
    { icon: UtensilsCrossed, label: "Food", cat: "Food & Drink" },
    { icon: Trees, label: "Nature", cat: "Nature" },
  ];

  const scrollFade = Math.max(0, 1 - scrollY / 360);
  return (
    <section id="top" className="relative min-h-[760px] md:min-h-[860px] overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,12,18,0.48)_0%,rgba(5,12,18,0.06)_38%,rgba(5,12,18,0.12)_58%,rgba(5,12,18,0.78)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgba(255,255,255,0.16),transparent_28%),linear-gradient(90deg,rgba(0,0,0,0.22),transparent_58%)]" />

      <div className="absolute left-4 top-1/2 hidden -translate-y-1/2 md:flex flex-col items-center gap-4 text-white/55" style={{ opacity: scrollFade }}>
        <span className="text-[9px] font-bold tracking-[0.35em] [writing-mode:vertical-rl]">SCROLL TO EXPLORE</span>
        <span className="h-20 w-px bg-gradient-to-b from-white/60 to-transparent" />
      </div>

      <div
        className="relative z-10 mx-auto flex min-h-[760px] md:min-h-[860px] max-w-[1440px] flex-col justify-center px-5 pb-24 pt-36 sm:px-8 lg:px-16"
        style={{ transform: `translate3d(0,-${scrollY * 0.035}px,0)` }}
      >
        <div className="max-w-5xl">
          <div className={`mb-6 flex items-center gap-3 transition-all duration-[1200ms] ${visible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"}`}>
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </span>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.32em] text-white/80">The island, your way</span>
          </div>

          <h1
            className={`font-semibold leading-[0.86] tracking-[-0.065em] text-white transition-all duration-[1200ms] delay-100 ${visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"}`}
            style={{ fontSize: "clamp(4rem, 10.5vw, 9.6rem)" }}
          >
            Go beyond
            <br />
            <span className="font-normal italic text-white/90">the ordinary.</span>
          </h1>

          <div className={`mt-7 flex max-w-2xl flex-col gap-5 transition-all duration-[1200ms] delay-200 sm:flex-row sm:items-end sm:gap-8 ${visible ? "translate-y-0 opacity-100" : "translate-y-7 opacity-0"}`}>
            <p className="max-w-xl text-sm leading-7 text-white/78 sm:text-base">
              Discover remarkable places, local experiences, stays and journeys across Sri Lanka — thoughtfully brought together in one place.
            </p>
            <div className="hidden shrink-0 items-center gap-2 text-xs font-medium text-white/70 sm:flex">
              <MapPin className="h-4 w-4" />
              <span>Sri Lanka</span>
            </div>
          </div>

          <div className={`mt-8 max-w-4xl transition-all duration-[1200ms] delay-300 ${visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
            <div className="rounded-[26px] border border-white/35 bg-white/95 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.30)] backdrop-blur-xl sm:rounded-full">
              <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
                  <Search className="h-5 w-5" />
                </span>
                <input
                  type="search"
                  aria-label="Search destinations, tours, accommodations, and vehicles"
                  placeholder="Search a place, experience or stay..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 sm:text-base"
                />
                {(query || hasActiveFilter) && (
                  <button
                    type="button"
                    onClick={() => { setQuery(""); onClear?.(); }}
                    className="hidden shrink-0 items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-100 sm:flex"
                  >
                    <X className="h-3.5 w-3.5" /> Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSearch}
                  className="group shrink-0 rounded-full bg-emerald-800 px-5 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-xl active:translate-y-0"
                >
                  <span className="hidden sm:inline">Explore</span>
                  <ArrowUpRight className="h-4 w-4 sm:hidden" />
                </button>
              </div>
            </div>
          </div>

          <div className={`mt-5 flex flex-wrap gap-2 transition-all duration-[1200ms] delay-500 ${visible ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>
            {quickTags.map(({ icon: Icon, label, cat }) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  onCategoryChange?.(cat);
                  document.getElementById("listings-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="group flex items-center gap-2 rounded-full border border-white/25 bg-black/10 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/15 sm:text-sm"
              >
                <Icon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div
          className={`absolute bottom-7 right-5 flex items-center gap-3 transition-all duration-700 sm:right-8 lg:right-16 ${visible ? "opacity-100" : "opacity-0"}`}
          style={{ opacity: scrollFade }}
        >
          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-white/55">A journey is waiting</p>
            <p className="mt-1 text-xs text-white/80">Start with a place you have never been.</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-md">
            <ArrowDown className="h-4 w-4 animate-bounce text-white" />
          </div>
        </div>

        <div className="absolute bottom-8 left-5 hidden items-center gap-2 sm:flex lg:left-16" style={{ opacity: scrollFade }}>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.8)]" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/55">Curated in Sri Lanka</span>
        </div>
      </div>
    </section>
  );
}
