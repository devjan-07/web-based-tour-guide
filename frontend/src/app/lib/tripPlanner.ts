export type TripItemType = "destination" | "package" | "guide" | "accommodation" | "vehicle";

export interface TripItem {
  key: string;
  type: TripItemType;
  id: number;
  title: string;
  subtitle?: string;
  destination?: string;
  day: number;
}

const STORAGE_KEY = "voyara_trip_plan_v1";

export function loadTripItems(): TripItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTripItems(items: TripItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addTripItem(item: Omit<TripItem, "key">) {
  const items = loadTripItems();
  const key = `${item.type}-${item.id}`;
  if (items.some((existing) => existing.key === key)) return items;
  const nextDay = Math.max(1, ...items.map((existing) => existing.day));
  const updated = [...items, { ...item, key, day: items.length ? nextDay : 1 }];
  saveTripItems(updated);
  return updated;
}

export function removeTripItem(key: string) {
  const updated = loadTripItems().filter((item) => item.key !== key);
  saveTripItems(updated);
  return updated;
}

export function updateTripItemDay(key: string, day: number) {
  const safeDay = Math.max(1, Math.floor(day));
  const updated = loadTripItems().map((item) => item.key === key ? { ...item, day: safeDay } : item);
  saveTripItems(updated);
  return updated;
}

export function clearTripItems() {
  saveTripItems([]);
}

export function tripItemTypeLabel(type: TripItemType) {
  if (type === "destination") return "Destination";
  if (type === "package") return "Package";
  if (type === "guide") return "Guide";
  if (type === "accommodation") return "Accommodation";
  return "Vehicle";
}
