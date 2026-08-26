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

// Business hours:
// Monday–Saturday: 8:00 AM – 8:00 PM WAT
// Sunday: 1:00 PM – 8:00 PM WAT
export const STORE_WEEKDAY_OPEN_HOUR  = 8;   // 8:00 AM
export const STORE_SUNDAY_OPEN_HOUR   = 13;  // 1:00 PM
export const STORE_CLOSE_HOUR         = 20;  // 8:00 PM
export const STORE_OPEN_DAYS          = [0, 1, 2, 3, 4, 5, 6]; // Sunday=0, Monday=1 … Saturday=6

// Must order at least 30 min before slot ends
const SLOT_CUTOFF_MINUTES = 30;

export const WEEKDAY_PICKUP_SLOTS: PickupSlot[] = [
  { label: "09:00 AM – 11:00 AM", startHour: 9,  endHour: 11 },
  { label: "11:00 AM – 01:00 PM", startHour: 11, endHour: 13 },
  { label: "01:00 PM – 03:00 PM", startHour: 13, endHour: 15 },
  { label: "03:00 PM – 05:00 PM", startHour: 15, endHour: 17 },
  { label: "05:00 PM – 07:00 PM", startHour: 17, endHour: 19 },
  { label: "07:00 PM – 08:00 PM", startHour: 19, endHour: 20 },
];

export const SUNDAY_PICKUP_SLOTS: PickupSlot[] = [
  { label: "01:00 PM – 03:00 PM", startHour: 13, endHour: 15 },
  { label: "03:00 PM – 05:00 PM", startHour: 15, endHour: 17 },
  { label: "05:00 PM – 07:00 PM", startHour: 17, endHour: 19 },
  { label: "07:00 PM – 08:00 PM", startHour: 19, endHour: 20 },
];

// Fallback / legacy export
export const ALL_PICKUP_SLOTS = WEEKDAY_PICKUP_SLOTS;

/** Returns the current time as a Date in WAT (UTC+1). */
export function getNowWAT(): Date {
  const now = new Date();
  // Strip local tz offset to get UTC, then add WAT (+1h)
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  return new Date(utcMs + 60 * 60_000);
}

/** Get store open and close hour for a given date */
export function getStoreHoursForDay(date?: Date): { openHour: number; closeHour: number } {
  const t = date ?? getNowWAT();
  const isSunday = t.getDay() === 0;
  return {
    openHour: isSunday ? STORE_SUNDAY_OPEN_HOUR : STORE_WEEKDAY_OPEN_HOUR,
    closeHour: STORE_CLOSE_HOUR,
  };
}

/** Is the store open right now? */
export function isStoreOpen(now?: Date): boolean {
  const t = now ?? getNowWAT();
  const { openHour, closeHour } = getStoreHoursForDay(t);
  const mins = t.getHours() * 60 + t.getMinutes();
  return mins >= openHour * 60 && mins < closeHour * 60;
}

/** Human-readable message for when store is closed. */
export function nextOpeningMessage(now?: Date): string {
  const t = now ?? getNowWAT();
  const day = t.getDay();
  const hour = t.getHours();

  if (day === 0) {
    if (hour < STORE_SUNDAY_OPEN_HOUR) return "Opens today at 1:00 PM";
    return "Opens Monday at 8:00 AM";
  }

  if (day === 6) {
    if (hour < STORE_WEEKDAY_OPEN_HOUR) return "Opens today at 8:00 AM";
    if (hour >= STORE_CLOSE_HOUR) return "Opens Sunday at 1:00 PM";
  }

  if (hour < STORE_WEEKDAY_OPEN_HOUR) return "Opens today at 8:00 AM";
  if (hour >= STORE_CLOSE_HOUR) {
    const nextDay = day + 1;
    if (nextDay === 0) return "Opens Sunday at 1:00 PM";
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
    return `Opens ${days[nextDay]} at 8:00 AM`;
  }

  return "Closed right now";
}

/** Get all defined slots for today (day-aware: Sunday vs Mon-Sat) */
export function getAllSlotsForToday(now?: Date): PickupSlot[] {
  const t = now ?? getNowWAT();
  return t.getDay() === 0 ? SUNDAY_PICKUP_SLOTS : WEEKDAY_PICKUP_SLOTS;
}

/**
 * Today's available pickup slots — slots whose end window hasn't passed yet
 * (with SLOT_CUTOFF_MINUTES buffer). Returns [] if store is closed.
 */
export function getTodaySlots(now?: Date): PickupSlot[] {
  const t = now ?? getNowWAT();
  if (!isStoreOpen(t)) return [];
  const currentMins = t.getHours() * 60 + t.getMinutes();
  const allSlots = getAllSlotsForToday(t);
  return allSlots.filter(
    (s) => s.endHour * 60 - SLOT_CUTOFF_MINUTES > currentMins
  );
}

