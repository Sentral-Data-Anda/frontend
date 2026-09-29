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

export const formatRupiahCompact = (value: number) =>
  `${value < 0 ? "−" : ""}Rp ${rupiahCompactFormat.format(Math.abs(value))}`;

export const firstNameOf = (fullName: string): string => {
  const words = fullName.trim().split(/\s+/);
  return words.find((word) => !word.endsWith(".")) ?? words[0] ?? "";
};

export const formatClock = (time: string) => time.replace(":", ".");

export const formatTimeRange = (start: string, end?: string | null) =>
  end ? `${formatClock(start)}–${formatClock(end)}` : formatClock(start);
