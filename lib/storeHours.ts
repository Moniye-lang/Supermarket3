// Store hours and pickup slot utilities for AMStores (WAT = UTC+1)
// Pickup is same-day only.

export interface PickupSlot {
  label: string;
  startHour: number; // 24h
  endHour: number;   // 24h
}

// ─── Store coordinates & delivery fee calculations ───────────────────────────
export const STORE_LAT = 7.3775;
export const STORE_LNG = 3.9470;
export const DELIVERY_BASE_FEE = 500;     // ₦ flat fee up to 2 km
export const DELIVERY_PER_KM = 200;       // ₦ per km after 2 km

/** Haversine distance in km between two lat/lng pairs */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Calculate delivery fee from distance */
export function calcDeliveryFee(distanceKm: number): number {
  if (distanceKm <= 2) return DELIVERY_BASE_FEE;
  return DELIVERY_BASE_FEE + Math.ceil(distanceKm - 2) * DELIVERY_PER_KM;
}

// Business hours: Monday–Saturday, 8 AM – 7 PM WAT
export const STORE_OPEN_HOUR  = 8;   // 8:00 AM
export const STORE_CLOSE_HOUR = 19;  // 7:00 PM
export const STORE_OPEN_DAYS  = [1, 2, 3, 4, 5, 6]; // Mon=1 … Sat=6 (0=Sun)

// Must order at least 30 min before slot ends
const SLOT_CUTOFF_MINUTES = 30;

export const ALL_PICKUP_SLOTS: PickupSlot[] = [
  { label: "09:00 AM – 11:00 AM", startHour: 9,  endHour: 11 },
  { label: "11:00 AM – 01:00 PM", startHour: 11, endHour: 13 },
  { label: "01:00 PM – 03:00 PM", startHour: 13, endHour: 15 },
  { label: "03:00 PM – 05:00 PM", startHour: 15, endHour: 17 },
  { label: "05:00 PM – 07:00 PM", startHour: 17, endHour: 19 },
];

/** Returns the current time as a Date in WAT (UTC+1). */
export function getNowWAT(): Date {
  const now = new Date();
  // Strip local tz offset to get UTC, then add WAT (+1h)
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  return new Date(utcMs + 60 * 60_000);
}

/** Is the store open right now? */
export function isStoreOpen(now?: Date): boolean {
  const t = now ?? getNowWAT();
  const day = t.getDay();
  const mins = t.getHours() * 60 + t.getMinutes();
  return (
    STORE_OPEN_DAYS.includes(day) &&
    mins >= STORE_OPEN_HOUR * 60 &&
    mins < STORE_CLOSE_HOUR * 60
  );
}

/** Human-readable message for when store is closed. */
export function nextOpeningMessage(now?: Date): string {
  const t = now ?? getNowWAT();
  const day = t.getDay();
  const hour = t.getHours();
  if (day === 0) return "Opens Monday at 8:00 AM";
  if (day === 6 && hour >= STORE_CLOSE_HOUR) return "Opens Monday at 8:00 AM";
  if (hour < STORE_OPEN_HOUR) return "Opens today at 8:00 AM";
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const next = day === 6 ? 1 : day + 1;
  return `Opens ${days[next]} at 8:00 AM`;
}

/**
 * Today's available pickup slots — slots whose end window hasn't passed yet
 * (with SLOT_CUTOFF_MINUTES buffer). Returns [] if store is closed.
 */
export function getTodaySlots(now?: Date): PickupSlot[] {
  const t = now ?? getNowWAT();
  if (!isStoreOpen(t)) return [];
  const currentMins = t.getHours() * 60 + t.getMinutes();
  return ALL_PICKUP_SLOTS.filter(
    (s) => s.endHour * 60 - SLOT_CUTOFF_MINUTES > currentMins
  );
}
