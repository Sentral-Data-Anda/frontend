const calendarFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeZone: "UTC",
});

const instantFormat = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "long",
  timeStyle: "short",
});

const toDate = (value: string | Date): Date | null => {
  const date = typeof value === "string" ? new Date(value) : value;

  return Number.isNaN(date.getTime()) ? null : date;
};

export function formatDate(value: string | Date) {
  const date = toDate(value);

  return date ? calendarFormat.format(date) : "-";
}

const shortDateFormat = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

// "1 Jan 2025": kolom sempit dan rentang periode.
export function formatDateShort(value: string | Date) {
  const date = toDate(value);

  return date ? shortDateFormat.format(date) : "-";
}

export function formatDateTime(value: string | Date) {
  const date = toDate(value);

  return date ? instantFormat.format(date) : "-";
}

const weekdayFormat = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  timeZone: "UTC",
});

export function formatWeekday(value: string | Date) {
  const date = toDate(value);

  return date ? weekdayFormat.format(date) : "-";
}

const rupiahFormat = new Intl.NumberFormat("id-ID");

const rupiahCompactFormat = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const rupiahCentsFormat = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatRupiah = (
  value: number,
  options: { isCents?: boolean } = {},
) =>
  `${value < 0 ? "−" : ""}Rp ${(options.isCents || !Number.isInteger(value) ? rupiahCentsFormat : rupiahFormat).format(Math.abs(value))}`;

export const formatNumber = (value: number) => rupiahFormat.format(value);

/**
 * API mengembalikan setiap `Decimal` sebagai STRING: gaji pokok, setiap angka
 * slip, jumlah hari cuti (`Decimal(4,1)`). Satu pembulatan untuk semuanya,
 * bukan satu per layar. Pola `formatRupiah(Number(x))` yang terulang ~45 kali
 * di repo ini adalah bentuk yang digantikannya.
 */
export const formatAmount = (
  value: string | number | null | undefined,
  empty = "\u2014",
) =>
  value === null || value === undefined || value === ""
    ? empty
    : formatRupiah(Number(value));

const dayFormat = new Intl.NumberFormat("id-ID");

/** `"12.5"` \u2192 `"12,5 hari"`. Hari cuti juga `Decimal`-sebagai-string. */
export const formatDays = (value: string | number) =>
  `${dayFormat.format(Number(value))} hari`;

const fractionDigitsOf = (currencyCode: string) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currencyCode,
  }).resolvedOptions().maximumFractionDigits ?? 2;

export const formatMoney = (value: number, currencyCode: string) => {
  if (currencyCode === "IDR") return formatRupiah(value);

  const digits = fractionDigitsOf(currencyCode);
  const amount = new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Math.abs(value));

  return `${value < 0 ? "−" : ""}${currencyCode} ${amount}`;
};

export const formatRupiahCompact = (value: number) =>
  `${value < 0 ? "−" : ""}Rp ${rupiahCompactFormat.format(Math.abs(value))}`;

export const firstNameOf = (fullName: string): string => {
  const words = fullName.trim().split(/\s+/);
  return words.find((word) => !word.endsWith(".")) ?? words[0] ?? "";
};

export const formatClock = (time: string) => time.replace(":", ".");

export const formatTimeRange = (start: string, end?: string | null) =>
  end ? `${formatClock(start)}–${formatClock(end)}` : formatClock(start);
