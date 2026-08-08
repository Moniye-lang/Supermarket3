// Store hours and pickup slot utilities for AMStores (WAT = UTC+1)
// All times are in Nigeria local time (WAT)

export interface PickupSlot {
  label: string;
  startHour: number; // 24h
  endHour: number;   // 24h
}

// Business hours: Monday–Saturday, 8 AM – 7 PM WAT
export const STORE_OPEN_HOUR = 8;   // 8:00 AM
export const STORE_CLOSE_HOUR = 19; // 7:00 PM
export const STORE_OPEN_DAYS = [1, 2, 3, 4, 5, 6]; // Mon=1 … Sat=6 (0=Sun)

// Latest pickup cutoff — must order 30 mins before slot ends
const SLOT_CUTOFF_MINUTES = 30;

export const ALL_PICKUP_SLOTS: PickupSlot[] = [
  { label: "09:00 AM – 11:00 AM", startHour: 9,  endHour: 11 },
  { label: "11:00 AM – 01:00 PM", startHour: 11, endHour: 13 },
  { label: "01:00 PM – 03:00 PM", startHour: 13, endHour: 15 },
  { label: "03:00 PM – 05:00 PM", startHour: 15, endHour: 17 },
  { label: "05:00 PM – 07:00 PM", startHour: 17, endHour: 19 },
];

/** Returns the current time as a Date object in WAT (UTC+1). */
export function getNowWAT(): Date {
  // WAT is UTC+1. We shift the UTC time by +1h.
  const now = new Date();
  return new Date(now.getTime() + (1 * 60 * 60 * 1000 - now.getTimezoneOffset() * 60 * 1000));
}

/** Returns true if the store is currently open. */
export function isStoreOpen(now?: Date): boolean {
  const t = now ?? getNowWAT();
  const day = t.getDay();   // 0=Sun … 6=Sat
  const hour = t.getHours();
  const minute = t.getMinutes();
  const minutesFromMidnight = hour * 60 + minute;
  return (
    STORE_OPEN_DAYS.includes(day) &&
    minutesFromMidnight >= STORE_OPEN_HOUR * 60 &&
    minutesFromMidnight < STORE_CLOSE_HOUR * 60
  );
}

/** Returns a human-readable "store opens …" string for when the store is closed. */
export function nextOpeningMessage(now?: Date): string {
  const t = now ?? getNowWAT();
  const day = t.getDay();
  const hour = t.getHours();

  // If it's Sunday, next opening is Monday
  if (day === 0) return "Opens Monday at 8:00 AM";

  // If it's Saturday after close, next is Monday
  if (day === 6 && hour >= STORE_CLOSE_HOUR) return "Opens Monday at 8:00 AM";

  // If it's before opening today
  if (hour < STORE_OPEN_HOUR) return "Opens today at 8:00 AM";

  // After close on a weekday
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const nextDay = day === 6 ? 1 : day + 1; // wrap Sat→Mon
  return `Opens ${days[nextDay]} at 8:00 AM`;
}

/**
 * Returns available pickup slots for a given day offset.
 * 0 = today, 1 = tomorrow, 2 = day after tomorrow.
 * For today: only slots that haven't closed yet (with cutoff buffer).
 * For future days: all slots (store must be open that day).
 */
export function getAvailableSlots(dayOffset: number, now?: Date): PickupSlot[] {
  const t = now ?? getNowWAT();

  if (dayOffset === 0) {
    // Today — only slots whose end time is still >= now + cutoff
    const currentMinutes = t.getHours() * 60 + t.getMinutes();
    return ALL_PICKUP_SLOTS.filter(
      (s) => s.endHour * 60 - SLOT_CUTOFF_MINUTES > currentMinutes
    );
  }

  // For future days — check if that day is a trading day
  const targetDay = (t.getDay() + dayOffset) % 7;
  if (!STORE_OPEN_DAYS.includes(targetDay)) return []; // store closed
  return ALL_PICKUP_SLOTS;
}

/**
 * Returns a display label for a given day offset.
 * 0 → "Today (Mon 11 Aug)", 1 → "Tomorrow (Tue 12 Aug)", etc.
 */
export function getDayLabel(dayOffset: number, now?: Date): string {
  const t = now ?? getNowWAT();
  const target = new Date(t);
  target.setDate(t.getDate() + dayOffset);
  const weekdays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const label = `${weekdays[target.getDay()]} ${target.getDate()} ${months[target.getMonth()]}`;
  if (dayOffset === 0) return `Today (${label})`;
  if (dayOffset === 1) return `Tomorrow (${label})`;
  return label;
}

/**
 * Returns the 3 selectable pickup days (today + 2 future trading days),
 * each with a day offset and whether slots are available.
 */
export function getPickupDays(now?: Date): { offset: number; label: string; hasSlots: boolean }[] {
  const t = now ?? getNowWAT();
  const result: { offset: number; label: string; hasSlots: boolean }[] = [];
  let checked = 0;
  let offset = 0;

  while (result.length < 3 && checked < 14) {
    const targetDay = (t.getDay() + offset) % 7;
    if (STORE_OPEN_DAYS.includes(targetDay)) {
      const slots = getAvailableSlots(offset, t);
      result.push({
        offset,
        label: getDayLabel(offset, t),
        hasSlots: slots.length > 0,
      });
    }
    offset++;
    checked++;
  }

  return result;
}
