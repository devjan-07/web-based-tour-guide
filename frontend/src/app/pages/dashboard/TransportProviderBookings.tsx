import { useEffect, useState } from "react";
import { transportProviderBookingsApi, type Booking } from "../../lib/api";
import { BookingDecisionList } from "./PartnerAccommodationBookings";

export function TransportProviderBookings() {
  const [items, setItems] = useState<Booking[]>([]); const [error, setError] = useState("");
  useEffect(() => { transportProviderBookingsApi.list().then(setItems).catch((e) => setError(e instanceof Error ? e.message : "Could not load bookings")); }, []);
  const decide = async (id: string, decision: "CONFIRM" | "REJECT") => { try { const value = await transportProviderBookingsApi.decide(id, decision); setItems((all) => all.map((item) => item.id === id ? value : item)); } catch (e) { setError(e instanceof Error ? e.message : "Could not update booking"); } };
  return <BookingDecisionList title="Vehicle Bookings" items={items} error={error} resource={(b) => b.vehicle} status={(b) => b.vehicleProviderStatus || "Pending"} detail={(b) => `${b.guest} · ${b.checkIn} to ${b.checkOut} · ${b.guests} passenger(s)`} decide={decide} />;
}
