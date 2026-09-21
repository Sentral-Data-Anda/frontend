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
