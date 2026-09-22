import { APP_TIMEZONE } from "@/config/site";

/**
 * Tanggal dan jam "sekarang" menurut gereja, bukan menurut perangkat.
 *
 * Jangan `new Date().toISOString().slice(0, 10)`: itu tanggal UTC, dan antara
 * 00.00–07.00 WIB tanggal UTC masih kemarin — Beranda akan meminta jadwal
 * kemarin selama tujuh jam setiap hari.
 */
const dateKeyFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: APP_TIMEZONE,
});

const hourFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  hourCycle: "h23",
  timeZone: APP_TIMEZONE,
});

const clockFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: APP_TIMEZONE,
});

const longDateFormat = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: APP_TIMEZONE,
});

/** "YYYY-MM-DD" — bentuk yang diterima `?date=` be-sada. */
export const toDateKey = (now: Date): string => dateKeyFormat.format(now);

/** "Minggu, 16 Agustus 2026". */
export const formatLongDate = (now: Date): string => longDateFormat.format(now);

export function greetingOf(now: Date): string {
  const hour = Number(hourFormat.format(now));

  if (hour >= 4 && hour < 11) return "Selamat pagi";
  if (hour >= 11 && hour < 15) return "Selamat siang";
  if (hour >= 15 && hour < 18) return "Selamat sore";

  return "Selamat malam";
}

/** "HH:mm" WIB — bentuk yang sama dengan `startTime` be-sada. */
export const toClockKey = (now: Date): string => clockFormat.format(now);

/**
 * Ibadah berikutnya: yang pertama dengan jam mulai ≥ sekarang (WIB).
 * `items` harus sudah urut jam naik (`sortByStartTime`). Semua sudah lewat →
 * `undefined`. Durasi ibadah tidak ada di data, jadi ibadah yang sedang
 * berlangsung tidak ditandai.
 */
export const findNextService = <T extends { startTime: string }>(
  items: readonly T[],
  now: Date,
): T | undefined => {
  const clock = toClockKey(now);

  return items.find((item) => item.startTime >= clock);
};

/** "YYYY-MM-DD" + n hari (kalender, bukan 24 jam — aman dari DST/zona). */
export const addDaysKey = (key: string, days: number): string => {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

/** Tujuh hari mulai hari ini (WIB). */
export const weekKeys = (now: Date): string[] => {
  const today = toDateKey(now);
  return Array.from({ length: 7 }, (_, i) => addDaysKey(today, i));
};

const weekdayShortFormat = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  timeZone: "UTC",
});

const dayMonthFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

const monthYearFormat = new Intl.DateTimeFormat("id-ID", {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/**
 * Tanggal kalender be-sada (`@db.Date` → "…T00:00:00.000Z") atau
 * "YYYY-MM-DD". Diformat di UTC supaya tidak bergeser sehari.
 */
const calendarDate = (value: string) =>
  new Date(value.length === 10 ? `${value}T00:00:00Z` : value);

/** "Sel". */
export const formatWeekdayShort = (key: string): string =>
  weekdayShortFormat.format(calendarDate(key));

/** "20 Sep". */
export const formatDayMonth = (value: string): string =>
  dayMonthFormat.format(calendarDate(value));

/** "Sep 2026" — periode persembahan. */
export const formatMonthYear = (value: string): string =>
  monthYearFormat.format(calendarDate(value));

/** Bulan WIB, 1–12. */
export const monthOf = (now: Date): number =>
  Number(toDateKey(now).slice(5, 7));

/** Hari kalender WIB antara instant `iso` dan `now` (≥ 0). */
export const daysSince = (iso: string, now: Date): number => {
  const from = Date.parse(`${toDateKey(new Date(iso))}T00:00:00Z`);
  const to = Date.parse(`${toDateKey(now)}T00:00:00Z`);
  return Math.max(0, Math.round((to - from) / 86_400_000));
};
