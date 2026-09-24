import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, ChevronLeft, ChevronRight, MapPinned, Pause, Play } from "lucide-react";
import type { Destination } from "../lib/api";

interface DestinationShowcaseProps {
  destinations: Destination[];
  onExplore: (destinationId: number) => void;
}

export function DestinationShowcase({ destinations, onExplore }: DestinationShowcaseProps) {
  const items = useMemo(
    () =>
      destinations
        .filter((destination) => Boolean(destination.id && destination.name && destination.image))
        .slice(0, 8),
    [destinations],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    if (activeIndex >= items.length && items.length > 0) setActiveIndex(0);
  }, [activeIndex, items.length]);

  useEffect(() => {
    if (paused || items.length < 2) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((current) => (current + 1) % items.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (items.length < 2) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, [contenteditable='true']")) return;
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setDirection(1);
        setActiveIndex((current) => (current + 1) % items.length);
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setDirection(-1);
        setActiveIndex((current) => (current - 1 + items.length) % items.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [items.length]);

  if (items.length === 0) {
    return (
      <section className="bg-slate-950 px-5 py-24 text-white sm:px-8 lg:px-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-300">Explore Sri Lanka</p>
          <div className="mt-8 flex min-h-[420px] items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04]">
            <p className="text-sm text-white/45">Destinations will appear here when they are available.</p>
          </div>
        </div>
      </section>
    );
  }

  const active = items[activeIndex];

  const goTo = (index: number) => {
    if (items.length < 2) return;
    const nextIndex = (index + items.length) % items.length;
    setDirection(nextIndex > activeIndex ? 1 : -1);
    setActiveIndex(nextIndex);
  };

  const visiblePreviews = Array.from({ length: Math.min(4, items.length - 1) }, (_, offset) => {
    return items[(activeIndex + offset + 1) % items.length];
  });

  return (
    <section
      id="destination-showcase"
      className="relative overflow-hidden bg-[#07110e] text-white"
    >
      <div className="mx-auto max-w-[1600px] px-4 py-16 sm:px-6 md:py-24 lg:px-10 lg:py-28">
        <div className="mb-8 flex flex-col gap-6 sm:mb-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.32em] text-emerald-300">
              <span className="h-px w-10 bg-emerald-300/70" />
              Explore Sri Lanka
            </p>
            <h2 className="max-w-4xl text-4xl font-semibold leading-[0.94] tracking-[-0.05em] sm:text-5xl md:text-7xl">
              Choose a place.
              <span className="block text-white/45">Let the journey begin.</span>
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/55 md:text-right">
            Discover real destinations from Voyara. Open a place to explore its experiences, routes and available journeys.
          </p>
        </div>

        <div className="relative min-h-[680px] overflow-hidden rounded-[2rem] border border-white/10 bg-black sm:min-h-[720px] md:min-h-[760px]">
          <AnimatePresence initial={false} custom={direction} mode="sync">
            <motion.div
              key={active.id}
              custom={direction}
              initial={{ opacity: 0, scale: 1.06, x: direction * 70 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 1.03, x: -direction * 55 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <img
                src={active.image}
                alt={active.name}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.opacity = "0";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/25 to-black/5" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-x-0 bottom-0 z-20 p-6 sm:p-8 md:p-12 lg:p-14">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.55, delay: 0.08 }}
                className="max-w-2xl"
              >
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/65">
                  <MapPinned className="h-3.5 w-3.5" />
                  <span>{active.country || "Sri Lanka"}</span>
                  {active.status === "Featured" && (
                    <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 tracking-[0.12em] text-white backdrop-blur-md">
                      Featured
                    </span>
                  )}
                </div>

                <h3 className="mt-3 text-5xl font-semibold leading-[0.9] tracking-[-0.055em] sm:text-6xl md:text-8xl">
                  {active.name}
                </h3>

                <p className="mt-5 max-w-xl text-sm leading-6 text-white/72 md:text-base">
                  {active.description || "Discover " + active.name + " and build your Sri Lankan journey around it."}
                </p>

                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onExplore(active.id)}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition-transform hover:-translate-y-0.5"
                  >
                    Explore destination
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaused((value) => !value)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/15"
                    aria-label={paused ? "Resume destination carousel" : "Pause destination carousel"}
                  >
                    {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    {paused ? "Play" : "Pause"}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute right-5 top-5 z-30 flex gap-2 sm:right-8 sm:top-8">
            <button
              type="button"
              onClick={() => {
                setDirection(-1);
                setActiveIndex((current) => (current - 1 + items.length) % items.length);
              }}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md transition hover:bg-white hover:text-slate-950"
              aria-label="Previous destination"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDirection(1);
                setActiveIndex((current) => (current + 1) % items.length);
              }}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/20 bg-black/20 text-white backdrop-blur-md transition hover:bg-white hover:text-slate-950"
              aria-label="Next destination"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="absolute right-5 top-24 z-20 hidden w-[34%] max-w-[430px] flex-col gap-3 lg:flex">
            {visiblePreviews.map((destination, index) => (
              <button
                key={destination.id}
                type="button"
                onClick={() => goTo(items.findIndex((item) => item.id === destination.id))}
                className="group relative h-[92px] overflow-hidden rounded-2xl border border-white/10 bg-black/25 text-left backdrop-blur-sm transition hover:border-white/30"
              >
                <img src={destination.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-65 transition duration-500 group-hover:scale-105 group-hover:opacity-85" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/10" />
                <div className="relative flex h-full items-center gap-4 px-4">
                  <span className="text-xs font-bold tracking-[0.2em] text-white/45">0{index + 2}</span>
                  <span className="text-lg font-semibold tracking-tight">{destination.name}</span>
                  <ArrowUpRight className="ml-auto h-4 w-4 text-white/55 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </button>
            ))}
          </div>

          <div className="absolute bottom-5 right-5 z-30 flex items-center gap-3 rounded-full border border-white/15 bg-black/25 px-4 py-2.5 backdrop-blur-md sm:bottom-8 sm:right-8">
            <span className="text-xs font-bold tracking-[0.18em] text-white/55">
              {String(activeIndex + 1).padStart(2, "0")} / {String(items.length).padStart(2, "0")}
            </span>
            <div className="h-px w-16 bg-white/15">
              <motion.div
                key={active.id + "-" + paused}
                className="h-full bg-emerald-300"
                initial={{ width: "0%" }}
                animate={{ width: paused ? "0%" : "100%" }}
                transition={{ duration: paused ? 0.2 : 6.5, ease: "linear" }}
              />
            </div>
          </div>
        </div>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((destination, index) => (
            <button
              key={destination.id}
              type="button"
              onClick={() => goTo(index)}
              className={
                "min-w-max rounded-full border px-4 py-2 text-xs font-semibold transition " +
                (index === activeIndex
                  ? "border-white bg-white text-slate-950"
                  : "border-white/15 bg-white/5 text-white/60")
              }
            >
              {destination.name}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
