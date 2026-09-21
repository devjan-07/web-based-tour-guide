import { useEffect, useState } from "react";
import { CalendarCheck, Check, X } from "lucide-react";
import { PageHeader } from "../../components/Modal";
import { partnerAccommodationBookingsApi, type Booking } from "../../lib/api";

export function PartnerAccommodationBookings() {
  const [items, setItems] = useState<Booking[]>([]); const [error, setError] = useState("");
  useEffect(() => { partnerAccommodationBookingsApi.list().then(setItems).catch((e) => setError(e instanceof Error ? e.message : "Could not load bookings")); }, []);
  const decide = async (id: string, decision: "CONFIRM" | "REJECT") => { try { const value = await partnerAccommodationBookingsApi.decide(id, decision); setItems((all) => all.map((item) => item.id === id ? value : item)); } catch (e) { setError(e instanceof Error ? e.message : "Could not update booking"); } };
  return <BookingDecisionList title="Property Bookings" items={items} error={error} resource={(b) => b.accommodation} status={(b) => b.accommodationProviderStatus || "Pending"} detail={(b) => `${b.guest} · ${b.checkIn} to ${b.checkOut} · ${b.rooms || 1} room(s)`} decide={decide} />;
}

export function BookingDecisionList({ title, items, error, resource, status, detail, decide }: { title: string; items: Booking[]; error: string; resource: (b: Booking) => string; status: (b: Booking) => string; detail: (b: Booking) => string; decide: (id: string, decision: "CONFIRM" | "REJECT") => void }) {
  return <div><PageHeader icon={CalendarCheck} title={title} subtitle="Confirm or reject bookings assigned to you" />{error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}<div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-800">{items.length === 0 ? <p className="p-8 text-sm text-gray-400">No bookings found.</p> : items.map((booking) => { const decision = status(booking); return <div key={booking.id} className="flex flex-col gap-3 border-b border-gray-100 p-4 last:border-0 sm:flex-row sm:items-center dark:border-slate-700"><div className="min-w-0 flex-1"><p className="font-semibold text-gray-900 dark:text-white">{resource(booking)}</p><p className="mt-1 text-xs text-gray-500">{detail(booking)}</p></div><span className="text-xs font-semibold">{decision}</span>{decision === "Pending" && <div className="flex gap-2"><button onClick={() => decide(booking.id, "CONFIRM")} title="Confirm booking" className="rounded-lg bg-green-600 p-2 text-white"><Check className="h-4 w-4" /></button><button onClick={() => decide(booking.id, "REJECT")} title="Reject booking" className="rounded-lg bg-red-600 p-2 text-white"><X className="h-4 w-4" /></button></div>}</div>; })}</div></div>;
}
