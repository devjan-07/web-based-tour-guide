import { motion } from "motion/react";
import { useState } from "react";
import { Search, X, Waves, Landmark, Mountain, UtensilsCrossed, Trees, ArrowDown } from "lucide-react";
import heroImage from "../../imports/image-4.png";

interface HeroProps {
  onSearch?: (query: string) => void;
  onClear?: () => void;
  hasActiveFilter?: boolean;
  onCategoryChange?: (category: string) => void;
}

const quickCategories = [
  { icon: Waves, label: "Beaches", cat: "Beaches" },
  { icon: Landmark, label: "Cultural", cat: "Cultural" },
  { icon: Mountain, label: "Adventure", cat: "Hiking" },
  { icon: UtensilsCrossed, label: "Food Tours", cat: "Food & Drink" },
  { icon: Trees, label: "Nature", cat: "Nature" },
];

export function Hero({ onSearch, onClear, hasActiveFilter = false, onCategoryChange }: HeroProps) {
  const [query, setQuery] = useState("");

  const handleSearch = () => {
    onSearch?.(query.trim());
    document.getElementById("discovery")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCategory = (category: string) => {
    onCategoryChange?.(category);
    document.getElementById("discovery")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative isolate min-h-[620px] overflow-hidden bg-[#062a56] md:min-h-[680px]">
      <img src={heroImage} alt="Sri Lanka travel landscape" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/45 to-[#062a56]/90" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#062a56] to-transparent" />

      <div className="relative mx-auto flex min-h-[620px] max-w-7xl flex-col items-center justify-center px-4 pb-16 pt-20 text-center md:min-h-[680px] md:px-6">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: "easeOut" }} className="max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-white/80 sm:text-sm">Sri Lanka, your way</p>
          <h1 className="mt-4 text-balance text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl md:text-7xl">
            Plan the trip
            <span className="block text-rose-300">you will remember.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-white/75 sm:text-base md:text-lg">
            Discover destinations, local guides, stays and experiences — then build your itinerary around what matters to you.
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }} className="mt-9 w-full max-w-3xl">
          <div className="rounded-[1.35rem] bg-white p-2 shadow-2xl ring-1 ring-black/10 sm:p-2.5">
            <div className="flex items-center gap-2 rounded-xl px-2 py-1 sm:gap-3 sm:px-3">
              <Search className="ml-1 h-5 w-5 shrink-0 text-rose-500 sm:h-6 sm:w-6" />
              <input
                type="search"
                aria-label="Search destinations, tours, accommodations, and vehicles"
                placeholder="Where do you want to go?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="min-w-0 flex-1 bg-transparent py-3 text-sm text-gray-800 outline-none placeholder:text-gray-400 sm:text-base"
              />
              {(query || hasActiveFilter) && (
                <button type="button" onClick={() => { setQuery(""); onClear?.(); }} className="hidden shrink-0 items-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold text-gray-500 hover:bg-gray-100 sm:flex">
                  <X className="h-4 w-4" /> Clear
                </button>
              )}
              <button type="button" onClick={handleSearch} className="flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF385C] to-[#E31C5F] px-4 py-3 text-sm font-bold text-white shadow-sm hover:-translate-y-0.5 hover:shadow-md sm:px-5">
                <Search className="h-4 w-4" /> <span className="hidden sm:inline">Search</span>
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45, delay: 0.16 }} className="mt-5 flex max-w-3xl flex-wrap justify-center gap-2">
          {quickCategories.map(({ icon: Icon, label, cat }) => (
            <button key={label} type="button" onClick={() => handleCategory(cat)} className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/20 sm:text-sm">
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </motion.div>

        <button type="button" onClick={() => document.getElementById("discovery")?.scrollIntoView({ behavior: "smooth" })} className="absolute bottom-7 hidden items-center gap-2 text-xs font-semibold text-white/60 transition hover:text-white md:flex">
          Start exploring <ArrowDown className="h-4 w-4 animate-bounce" />
        </button>
      </div>
    </section>
  );
}
