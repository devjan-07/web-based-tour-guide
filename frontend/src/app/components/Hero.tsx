import { useEffect, useState } from "react";
import { Search, X, Waves, Landmark, Mountain, UtensilsCrossed, Trees, ArrowDown } from "lucide-react";
import heroImage from "../../imports/image-4.png";

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
    const onScroll = () => setScrollY(Math.min(window.scrollY, 500));
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

  const scrollOpacity = Math.max(0, 1 - scrollY / 260);
  const imageScale = 1 + scrollY * 0.00012;

  return (
    <section className="relative min-h-[680px] md:min-h-[760px] overflow-hidden bg-slate-950">
      <img
        src={heroImage}
        alt="Sri Lanka travel landscape"
        className="absolute inset-0 w-full h-full object-cover will-change-transform transition-transform duration-100"
        style={{ transform: `scale(${imageScale}) translateY(${scrollY * 0.08}px)` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.28)_0%,rgba(0,0,0,0.15)_35%,rgba(0,0,0,0.72)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,transparent_0%,rgba(0,0,0,0.18)_70%)]" />

      <div
        className="relative z-10 min-h-[680px] md:min-h-[760px] max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 pt-32 pb-20 flex flex-col justify-center"
        style={{ transform: `translateY(-${scrollY * 0.04}px)`, opacity: Math.max(0.72, 1 - scrollY / 800) }}
      >
        <div className="max-w-4xl">
          <div className={`flex items-center gap-3 mb-5 transition-all duration-1000 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <span className="h-px w-10 bg-white/70" />
            <p className="text-white/85 text-xs sm:text-sm tracking-[0.28em] uppercase font-semibold">Discover Sri Lanka</p>
          </div>

          <h1
            className={`text-white font-semibold tracking-[-0.04em] leading-[0.9] transition-all duration-1000 delay-100 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{ fontSize: "clamp(3.4rem, 9vw, 7.8rem)", textWrap: "balance" }}
          >
            Go beyond<br />
            <span className="italic font-normal text-white/90">the ordinary.</span>
          </h1>

          <p className={`mt-7 max-w-xl text-base sm:text-lg text-white/80 leading-relaxed transition-all duration-1000 delay-200 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            Discover remarkable places, local experiences, stays and journeys across Sri Lanka — all in one place.
          </p>

          <div className={`mt-8 w-full max-w-3xl transition-all duration-1000 delay-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
            <div className="rounded-2xl sm:rounded-full bg-white/95 backdrop-blur-xl p-2 shadow-2xl ring-1 ring-white/30">
              <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3">
                <Search className="h-5 w-5 sm:h-6 sm:w-6 shrink-0 text-emerald-700" />
                <input
                  type="search"
                  aria-label="Search destinations, tours, accommodations, and vehicles"
                  placeholder="Where do you want to go?"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="min-w-0 flex-1 bg-transparent py-3 sm:py-3.5 text-sm sm:text-base text-gray-900 outline-none placeholder-gray-500"
                />
                {(query || hasActiveFilter) && (
                  <button type="button" onClick={() => { setQuery(""); onClear?.(); }} className="hidden sm:flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100">
                    <X className="h-3.5 w-3.5" /> Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSearch}
                  className="shrink-0 rounded-full bg-emerald-800 px-4 sm:px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-emerald-700 hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span className="hidden sm:inline">Explore</span>
                  <Search className="w-4 h-4 sm:hidden" />
                </button>
              </div>
            </div>
          </div>

          <div className={`flex flex-wrap gap-2 mt-5 transition-all duration-1000 delay-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
            {quickTags.map(({ icon: Icon, label, cat }) => (
              <button
                key={label}
                onClick={() => {
                  onCategoryChange?.(cat);
                  document.getElementById("listings-section")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs sm:text-sm font-medium text-white backdrop-blur-md transition-all hover:bg-white/20 hover:border-white/45 hover:-translate-y-0.5"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div
          className="absolute bottom-7 left-5 sm:left-8 lg:left-12 flex items-center gap-3 text-white/65 transition-opacity duration-700"
          style={{ opacity: scrollOpacity }}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-white/10 backdrop-blur-sm">
            <ArrowDown className="h-4 w-4 animate-bounce" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.25em] font-medium">Scroll to explore</span>
        </div>

        <div className="absolute bottom-8 right-5 sm:right-8 lg:right-12 hidden sm:flex items-center gap-2 text-white/60 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          Curated journeys across Sri Lanka
        </div>
      </div>
    </section>
  );
}
