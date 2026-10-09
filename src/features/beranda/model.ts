import { APP_TIMEZONE } from "@/config/site";
import { todayJakarta } from "@/lib/date";

const hourFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
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

export const toDateKey = (now: Date): string => todayJakarta(now);

export const formatLongDate = (now: Date): string => longDateFormat.format(now);

export function greetingOf(now: Date): string {
  const hour = Number(hourFormat.format(now));

  if (hour >= 4 && hour < 11) return "Selamat pagi";
  if (hour >= 11 && hour < 15) return "Selamat siang";
  if (hour >= 15 && hour < 18) return "Selamat sore";

  return "Selamat malam";
}

export const addDaysKey = (key: string, days: number): string => {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

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

const calendarDate = (value: string) =>
  new Date(value.length === 10 ? `${value}T00:00:00Z` : value);

export const formatWeekdayShort = (key: string): string =>
  weekdayShortFormat.format(calendarDate(key));

export const formatDayMonth = (value: string): string =>
  dayMonthFormat.format(calendarDate(value));

export const formatMonthYear = (value: string): string =>
  monthYearFormat.format(calendarDate(value));

export const monthOf = (now: Date): number =>
  Number(toDateKey(now).slice(5, 7));
