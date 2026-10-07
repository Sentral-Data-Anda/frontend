import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { APP_TIMEZONE } from "@/config/site";
import { FetchError } from "@/lib/api/fetcher";
import {
  monthRange,
  toDateInput,
  todayJakarta,
  weekdayDates,
} from "@/lib/date";
import { formatClock, formatDateShort, formatTimeRange } from "@/lib/format";

import {
  BOOKING_KIND_LABEL,
  type CheckResult,
  type Clash,
  type LoanPayload,
  type LoanRoom,
  type LoanRoomDetail,
  type LoanStatus,
} from "./types";

export const LOAN_LIST_PATH = menuHref(MENU.FASILITAS, MENU.PEMINJAMAN_RUANG);

export const REPEAT_MAX = 26;

export const PURPOSE_MAX = 150;

const weekdayShort = new Intl.DateTimeFormat("id-ID", {
  weekday: "short",
  timeZone: "UTC",
});

const clockFormat = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: APP_TIMEZONE,
});

export const formatLoanDate = (date: string) =>
  `${weekdayShort.format(new Date(`${toDateInput(date)}T00:00:00Z`))}, ${formatDateShort(date)}`;

export const isClash = (
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string },
) => a.startTime < b.endTime && b.startTime < a.endTime;

export function loanStatusOf(
  row: Pick<LoanRoom, "date" | "startTime" | "endTime">,
  now: Date = new Date(),
): LoanStatus {
  const today = todayJakarta(now);
  const date = toDateInput(row.date);
  const clock = clockFormat.format(now);

  if (date < today || (date === today && clock >= row.endTime)) return "DONE";
  if (date > today || clock < row.startTime) return "UPCOMING";

  return "ONGOING";
}

export function toLoanApiFilters(
  filters: Record<string, string>,
  today: string = todayJakarta(),
) {
  const range = filters.bulan
    ? monthRange(filters.bulan)
    : { startDate: today, endDate: "" };

  return {
    ...range,
    roomId: filters.ruang ?? "",
    bapelId: filters.bapel ?? "",
  };
}

const DAY_END = "23:59";

// be-sada memberi event tanpa jam selesai (dan hari antara event menerus) "23:59";
// angkanya tidak membedakan "belum diisi" dari jam selesai sungguhan.
export const bookingTimeOf = (
  item: Pick<Clash, "kind" | "startTime" | "endTime">,
) => {
  if (item.kind !== "EVENT" || item.endTime !== DAY_END) {
    return formatTimeRange(item.startTime, item.endTime);
  }

  return item.startTime === "00:00"
    ? "sepanjang hari"
    : `mulai ${formatClock(item.startTime)}`;
};

export const bookingTitle = (item: Pick<Clash, "kind" | "name">) => {
  const kind = BOOKING_KIND_LABEL[item.kind];

  return item.name.toLowerCase().startsWith(kind.toLowerCase())
    ? item.name
    : `${kind} ${item.name}`;
};

export const clashSummary = (clashes: readonly Clash[]) => {
  const [first] = clashes;
  const more = clashes.length > 1 ? ` +${clashes.length - 1} lainnya` : "";

  return first
    ? `Bentrok: ${bookingTitle(first)} ${bookingTimeOf(first)}${more}`
    : "Tersedia";
};

export const loanFormSchema = z
  .object({
    roomId: z.string().min(1, "Pilih ruang"),
    date: z.string().min(1, "Tanggal wajib diisi"),
    startTime: z.string().min(1, "Isi jam mulai"),
    endTime: z.string().min(1, "Isi jam selesai"),
    purpose: z
      .string()
      .trim()
      .min(1, "Isi keperluan")
      .max(PURPOSE_MAX, "Keperluan maksimal 150 karakter"),
    bapelId: z.string(),
    jemaatId: z.string().min(1, "Pilih peminjam"),
    repeat: z.enum(["ONCE", "WEEKLY"]),
    weekdays: z.array(z.string()),
    until: z.string(),
  })
  .superRefine((values, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (
      values.startTime &&
      values.endTime &&
      values.endTime <= values.startTime
    )
      issue("endTime", "Jam selesai harus setelah jam mulai");
    if (values.repeat !== "WEEKLY") return;
    if (values.weekdays.length === 0) {
      issue("weekdays", "Pilih minimal satu hari");
    }
    if (!values.until) {
      issue("until", "Isi tanggal akhir");
    } else if (values.date && values.until <= values.date) {
      issue("until", "Tanggal akhir harus sesudah tanggal mulai");
    } else if (repeatDatesOf(values).length > REPEAT_MAX) {
      issue("until", "Paling banyak 26 tanggal. Majukan tanggal akhir.");
    }
  });

export type LoanFormValues = z.infer<typeof loanFormSchema>;

export const EMPTY_LOAN_FORM: LoanFormValues = {
  roomId: "",
  date: "",
  startTime: "",
  endTime: "",
  purpose: "",
  bapelId: "",
  jemaatId: "",
  repeat: "ONCE",
  weekdays: [],
  until: "",
};

export function repeatDatesOf(
  values: Pick<LoanFormValues, "repeat" | "date" | "until" | "weekdays">,
): string[] {
  if (values.repeat !== "WEEKLY" || !values.date || values.until <= values.date)
    return [];

  return weekdayDates(
    values.date,
    values.until,
    values.weekdays.map(Number),
    REPEAT_MAX + 1,
  );
}

export const toLoanForm = (loan: LoanRoomDetail): LoanFormValues => ({
  ...EMPTY_LOAN_FORM,
  roomId: String(loan.room.id),
  date: toDateInput(loan.date),
  startTime: loan.startTime,
  endTime: loan.endTime,
  purpose: loan.purpose,
  bapelId: loan.bapel ? String(loan.bapel.id) : "",
  jemaatId: String(loan.jemaat.id),
});

export const toLoanBody = (
  values: LoanFormValues,
  date: string = values.date,
): LoanPayload => ({
  roomId: Number(values.roomId),
  date,
  startTime: values.startTime,
  endTime: values.endTime,
  purpose: values.purpose.trim(),
  jemaatId: Number(values.jemaatId),
  ...(values.bapelId ? { bapelId: Number(values.bapelId) } : {}),
});

export type PreviewRow = {
  date: string;
  clashes: readonly Clash[];
  isTicked: boolean;
};

export function previewRowsOf(
  dates: readonly string[],
  results: readonly CheckResult[],
  unticked: ReadonlySet<string>,
): PreviewRow[] {
  const byDate = new Map(results.map((result) => [result.date, result]));

  return dates.map((date) => {
    const clashes = byDate.get(date)?.clashes ?? [];

    return {
      date,
      clashes,
      isTicked: clashes.length === 0 && !unticked.has(date),
    };
  });
}

export function toBatchRows(
  values: LoanFormValues,
  rows: readonly PreviewRow[],
): { rows: LoanPayload[]; previewIndexOf: number[] } {
  const previewIndexOf = rows.flatMap((row, index) =>
    row.isTicked ? [index] : [],
  );

  return {
    previewIndexOf,
    rows: previewIndexOf.map((index) => toLoanBody(values, rows[index].date)),
  };
}

const ROW_PATH = /^rows\.(\d+)\.(\w+)$/;

const SAME_BATCH = /^bentrok dengan baris (\d+)/i;

const ROW_FIELDS = new Set(["date", "startTime", "endTime"]);

export type SharedField = "roomId" | "purpose" | "bapelId" | "jemaatId";

export type BatchFailure = {
  rowErrors: Map<number, string>;
  fieldErrors: Map<SharedField, string>;
  root: string | null;
  isRace: boolean;
};

export function batchRowErrors(
  error: unknown,
  previewIndexOf: readonly number[],
  rows: readonly Pick<PreviewRow, "date">[],
): BatchFailure {
  const failure: BatchFailure = {
    rowErrors: new Map(),
    fieldErrors: new Map(),
    root: null,
    isRace: false,
  };

  if (!(error instanceof FetchError)) {
    return {
      ...failure,
      root: "Tidak dapat menghubungi server. Periksa koneksi Anda.",
    };
  }
  if (error.issues.length === 0) {
    return error.status === 409
      ? { ...failure, isRace: true }
      : { ...failure, root: error.message };
  }

  for (const issue of error.issues) {
    const match = ROW_PATH.exec(issue.path);
    const previewIndex = match ? previewIndexOf[Number(match[1])] : undefined;
    const field = match?.[2] ?? "";

    if (previewIndex === undefined) {
      failure.root ??= issue.message;
    } else if (ROW_FIELDS.has(field)) {
      const same = SAME_BATCH.exec(issue.message);
      const other = same
        ? rows[previewIndexOf[Number(same[1]) - 1] ?? -1]?.date
        : undefined;

      if (!failure.rowErrors.has(previewIndex)) {
        failure.rowErrors.set(
          previewIndex,
          other ? `Bentrok dengan ${formatLoanDate(other)}` : issue.message,
        );
      }
    } else if (!failure.fieldErrors.has(field as SharedField)) {
      failure.fieldErrors.set(field as SharedField, issue.message);
    }
  }

  return failure;
}
