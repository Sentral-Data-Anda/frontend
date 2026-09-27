export type ParsedDate =
  { iso: string; error?: never } | { iso?: never; error: string };

export const DATE_ERROR = {
  invalid: "Tanggal tidak ada. Contoh: 12/05/1990.",
  shortYear: "Tulis empat angka, mis. 1990.",
} as const;

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

const daysInMonth = (month: number, year: number): number =>
  month === 2 && isLeapYear(year) ? 29 : DAYS_IN_MONTH[month - 1];

const pad = (value: number): string => String(value).padStart(2, "0");

export function toIsoDate(
  day: number,
  month: number,
  year: number,
): string | null {
  if (!Number.isInteger(day) || !Number.isInteger(month)) return null;
  if (!Number.isInteger(year)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(month, year)) return null;

  return `${String(year).padStart(4, "0")}-${pad(month)}-${pad(day)}`;
}

export function toInputText(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());

  return match ? `${match[3]}/${match[2]}/${match[1]}` : "";
}

export function parseDateInput(text: string): ParsedDate {
  const trimmed = text.trim();

  if (!trimmed) return { iso: "" };

  const digitsOnly = /^\d{8}$/.exec(trimmed);

  if (digitsOnly) {
    const iso = toIsoDate(
      Number(trimmed.slice(0, 2)),
      Number(trimmed.slice(2, 4)),
      Number(trimmed.slice(4, 8)),
    );

    return iso ? { iso } : { error: DATE_ERROR.invalid };
  }

  const parts = trimmed.split(/[^\d]+/).filter(Boolean);

  if (parts.length !== 3) return { error: DATE_ERROR.invalid };

  const [day, month, year] = parts;

  if (year.length !== 4) return { error: DATE_ERROR.shortYear };
  if (day.length > 2 || month.length > 2) return { error: DATE_ERROR.invalid };

  const iso = toIsoDate(Number(day), Number(month), Number(year));

  return iso ? { iso } : { error: DATE_ERROR.invalid };
}

const jakartaDateFormat = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const todayJakarta = (now: Date = new Date()): string =>
  jakartaDateFormat.format(now);

export const endOfYearIso = (
  yearsAhead: number,
  now: Date = new Date(),
): string => `${Number(todayJakarta(now).slice(0, 4)) + yearsAhead}-12-31`;

export function ageInYears(
  birthIso: string,
  today: string = todayJakarta(),
): number | null {
  const birth = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthIso.trim());
  const now = /^(\d{4})-(\d{2})-(\d{2})$/.exec(today.trim());

  if (!birth || !now) return null;

  let age = Number(now[1]) - Number(birth[1]);

  if (`${now[2]}-${now[3]}` < `${birth[2]}-${birth[3]}`) age -= 1;

  return age < 0 ? null : age;
}

const toUtc = (iso: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());

  return match
    ? new Date(
        Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])),
      )
    : null;
};

const fromUtc = (date: Date): string =>
  `${String(date.getUTCFullYear()).padStart(4, "0")}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

export function addDays(iso: string, days: number): string {
  const date = toUtc(iso);

  if (!date) return "";

  date.setUTCDate(date.getUTCDate() + days);

  return fromUtc(date);
}

export function addMonths(iso: string, months: number): string {
  const date = toUtc(iso);

  if (!date) return "";

  const day = date.getUTCDate();
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1),
  );
  const lastDay = daysInMonth(
    target.getUTCMonth() + 1,
    target.getUTCFullYear(),
  );

  target.setUTCDate(Math.min(day, lastDay));

  return fromUtc(target);
}

export const startOfMonth = (iso: string): string =>
  /^(\d{4})-(\d{2})/.test(iso.trim()) ? `${iso.slice(0, 7)}-01` : "";

export function weekdayIndex(iso: string): number {
  const date = toUtc(iso);

  if (!date) return -1;

  return (date.getUTCDay() + 6) % 7;
}

export function monthGrid(iso: string): string[] {
  const first = startOfMonth(iso);

  if (!first) return [];

  const start = addDays(first, -weekdayIndex(first));

  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

export const isSameMonth = (iso: string, monthIso: string): boolean =>
  iso.slice(0, 7) === monthIso.slice(0, 7);

export const isWithin = (iso: string, min?: string, max?: string): boolean =>
  (!min || iso >= min) && (!max || iso <= max);

export const toDateInput = (value: string | null | undefined): string =>
  value ? value.slice(0, 10) : "";
