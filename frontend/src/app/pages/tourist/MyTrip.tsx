import { useMemo, useState } from "react";
import { Link } from "react-router";
import { CalendarDays, CheckCircle2, MapPin, Package, Trash2, Users } from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { Footer } from "../../components/Footer";
import { clearTripItems, loadTripItems, removeTripItem, tripItemTypeLabel, updateTripItemDay, type TripItem } from "../../lib/tripPlanner";

export default function MyTrip() {
  const [items, setItems] = useState<TripItem[]>(() => loadTripItems());
  const [days, setDays] = useState(3);

  const grouped = useMemo(() => Array.from({ length: days }, (_, index) => ({
    day: index + 1,
    items: items.filter((item) => item.day === index + 1),
  })), [days, items]);

  const remove = (key: string) => setItems(removeTripItem(key));
  const changeDay = (key: string, value: string) => setItems(updateTripItemDay(key, Number(value)));

  const clear = () => {
    if (window.confirm("Clear everything from your saved trip?")) {
      clearTripItems();
      setItems([]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#003580] to-[#0057B8] text-white shadow-lg">
          <div className="p-7 md:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-white/70">My Trip</p>
            <h1 className="mt-2 max-w-3xl text-3xl font-extrabold md:text-5xl">Turn saved ideas into a simple itinerary.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 md:text-base">
              Add destinations and travel resources while exploring Voyara. Then organise them into days before you move on to booking.
            </p>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-gray-200 bg-white p-5">
            <MapPin className="h-5 w-5 text-rose-500" />
            <p className="mt-3 text-2xl font-extrabold text-gray-900">{items.length}</p>
            <p className="text-xs text-gray-500">Saved trip items</p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-5">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            <p className="mt-3 text-2xl font-extrabold text-gray-900">{days}</p>
            <p className="text-xs text-gray-500">Planning days</p>
          </div>
          <div className="rounded-3xl border border-gray-200 bg-white p-5">
            <Users className="h-5 w-5 text-emerald-600" />
            <p className="mt-3 text-sm font-extrabold text-gray-900">{items.length ? "Ready to organise" : "Start exploring"}</p>
            <p className="text-xs text-gray-500">Your saved plan stays in this browser</p>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-3 border-b border-gray-100 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900">Itinerary builder</h2>
              <p className="mt-1 text-sm text-gray-500">Move saved resources between days. This does not create a booking.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
                Days
                <select value={days} onChange={(event) => setDays(Math.max(1, Number(event.target.value)))} className="bg-transparent font-bold text-gray-900 outline-none">
                  {[1, 2, 3, 4, 5, 6, 7, 10, 14].map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              {items.length > 0 && (
                <button type="button" onClick={clear} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50">
                  <Trash2 className="h-4 w-4" /> Clear trip
                </button>
              )}
            </div>
          </div>

          {items.length === 0 ? (
            <div className="py-16 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 font-bold text-gray-900">Your trip is empty</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">Explore a destination or package and select “Add to My Trip” to start building your itinerary.</p>
              <div className="mt-5 flex justify-center gap-3">
                <Link to="/explore?tab=destinations" className="rounded-xl bg-[#FF385C] px-4 py-2.5 text-sm font-bold text-white transition hover:opacity-90">Explore destinations</Link>
                <Link to="/tourist/plan" className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800">Plan My Trip</Link>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {grouped.map(({ day, items: dayItems }) => (
                <div key={day} className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-gray-300">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Day {day}</p>
                      <h3 className="mt-1 font-extrabold text-gray-900">{dayItems.length ? dayItems.length + " planned item" + (dayItems.length === 1 ? "" : "s") : "Open day"}</h3>
                    </div>
                    {dayItems.length > 0 && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                  </div>

                  {dayItems.length === 0 ? (
                    <p className="mt-4 rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-400">Add a saved item to this day using the day selector below.</p>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {dayItems.map((item) => (
                        <article key={item.key} className="flex flex-col gap-3 rounded-2xl border border-transparent bg-gray-50 p-4 transition hover:border-gray-200 md:flex-row md:items-center md:justify-between">
                          <div className="min-w-0">
                            <span className="rounded-full bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">{tripItemTypeLabel(item.type)}</span>
                            <h4 className="mt-2 truncate font-bold text-gray-900">{item.title}</h4>
                            {item.subtitle && <p className="mt-1 text-xs text-gray-500">{item.subtitle}</p>}
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <label className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-xs font-semibold text-gray-500">
                              Day
                              <select value={item.day} onChange={(event) => changeDay(item.key, event.target.value)} className="bg-transparent font-bold text-gray-900 outline-none">
                                {Array.from({ length: days }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{value}</option>)}
                              </select>
                            </label>
                            <button type="button" onClick={() => remove(item.key)} className="rounded-lg p-2 text-gray-400 hover:bg-white hover:text-red-500" aria-label={"Remove " + item.title}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-6 flex flex-col gap-4 rounded-3xl bg-gray-900 p-6 text-white md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-extrabold">Ready to turn the plan into a booking?</p>
            <p className="mt-1 text-sm text-white/60">Your saved itinerary is a planning aid. Review availability and dates during the booking process.</p>
          </div>
          {items.some((item) => item.type === "package") ? (() => { const packageItem = items.find((item) => item.type === "package")!; return <Link to={`/tourist/packages/${packageItem.id}/customize`} className="rounded-xl bg-[#FF385C] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:opacity-90">Customize package & book</Link>; })() : <Link to="/tourist/bookings/new" className="rounded-xl bg-[#FF385C] px-5 py-3 text-sm font-bold text-white">Continue to booking</Link>}
        </section>
      </main>
      <Footer />
    </div>
  );
}
