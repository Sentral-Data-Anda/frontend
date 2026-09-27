import { z } from "zod";

import { FetchError } from "@/lib/api/fetcher";
import {
  addDays,
  addMonths,
  startOfMonth,
  toDateInput,
  todayJakarta,
  weekdayIndex,
} from "@/lib/date";
import { formatWeekday } from "@/lib/format";

import {
  EMPTY_IBADAH_FORM,
  formatServiceDate,
  serverFieldError,
  toIbadahPayload,
} from "../../model";
import type { Ibadah, IbadahPayload } from "../../types";

export const BATCH_MAX = 60;

export type RotationPattern = "WEEKLY" | "MONTHLY";

export const PATTERN_LABEL: Record<RotationPattern, string> = {
  WEEKLY: "Mingguan",
  MONTHLY: "Bulanan",
};

const dayOfMonth = (iso: string) => Number(iso.slice(8, 10));

export const weekOfMonth = (iso: string) => Math.ceil(dayOfMonth(iso) / 7);

export const monthlyLabel = (start: string) =>
  `${formatWeekday(start)} ke-${weekOfMonth(start)}`;

export function rotationDates(
  start: string,
  pattern: RotationPattern,
  count: number,
): string[] {
  if (pattern === "WEEKLY") {
    return Array.from({ length: count }, (_, index) =>
      addDays(start, index * 7),
    );
  }

  const weekday = weekdayIndex(start);
  const week = weekOfMonth(start);

  return Array.from({ length: count }, (_, index) => {
    const first = addMonths(startOfMonth(start), index);
    const offset = (weekday - weekdayIndex(first) + 7) % 7;

    return addDays(first, offset + (week - 1) * 7);
  });
}

const refineOn = (path: string, message: string) => ({
  path: [path],
  message,
  when: () => true,
});

export const giliranSettingsSchema = z
  .object({
    typeIbadahId: z.string().min(1, "Pilih tipe ibadah."),
    zoneChurchId: z.string().min(1, "Pilih wilayah."),
    startTime: z.string().min(1, "Isi jam mulai."),
    endTime: z.string(),
    startDate: z.string().min(1, "Tanggal wajib diisi"),
    pattern: z.enum(["WEEKLY", "MONTHLY"]),
    count: z
      .string()
      .refine(
        (value) =>
          /^\d+$/.test(value) &&
          Number(value) >= 1 &&
          Number(value) <= BATCH_MAX,
        "Isi 1 sampai 60.",
      ),
  })
  .refine(
    (values) => !values.endTime || values.endTime > values.startTime,
    refineOn("endTime", "Jam selesai harus sesudah jam mulai."),
  )
  .refine(
    (values) =>
      values.pattern !== "MONTHLY" ||
      !values.startDate ||
      dayOfMonth(values.startDate) <= 28,
    refineOn("startDate", "Untuk pola bulanan pilih tanggal 1–28."),
  );

export type GiliranSettings = z.infer<typeof giliranSettingsSchema>;

export const EMPTY_SETTINGS: GiliranSettings = {
  typeIbadahId: "",
  zoneChurchId: "",
  startTime: "",
  endTime: "",
  startDate: "",
  pattern: "WEEKLY",
  count: "8",
};

export function defaultsFromLatest(
  latest: Pick<Ibadah, "date" | "startTime" | "endTime"> | null,
  today: string = todayJakarta(),
): Pick<GiliranSettings, "startTime" | "endTime" | "startDate"> {
  if (!latest) return { startTime: "", endTime: "", startDate: today };

  const next = addDays(toDateInput(latest.date), 7);

  return {
    startTime: latest.startTime,
    endTime: latest.endTime ?? "",
    startDate: next > today ? next : today,
  };
}

export type PreviewRow = { date: string; hostId: string; isTicked: boolean };

export function assignHosts(
  dates: readonly string[],
  isTicked: readonly boolean[],
  suggestion: readonly string[],
): PreviewRow[] {
  let turn = 0;

  return dates.map((date, index) => {
    if (!isTicked[index] || suggestion.length === 0) {
      return { date, hostId: "", isTicked: isTicked[index] };
    }

    const hostId = suggestion[turn % suggestion.length];

    turn += 1;

    return { date, hostId, isTicked: true };
  });
}

export type RowWarning = {
  isExisting: boolean;
  hostWarning: string | null;
  dateError: string | null;
};

const dayNumber = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 86_400_000;

export function previewWarnings(
  rows: readonly PreviewRow[],
  existingDates: ReadonlySet<string>,
): RowWarning[] {
  return rows.map((row, index) => {
    const others = rows.filter(
      (other, otherIndex) =>
        otherIndex !== index && other.isTicked && row.isTicked,
    );
    const sameHost = row.hostId
      ? others
          .filter((other) => other.hostId === row.hostId && other.date)
          .sort(
            (a, b) =>
              Math.abs(dayNumber(a.date) - dayNumber(row.date)) -
              Math.abs(dayNumber(b.date) - dayNumber(row.date)),
          )[0]
      : undefined;
    const isSameDate =
      Boolean(row.date) && others.some((other) => other.date === row.date);

    return {
      isExisting: existingDates.has(row.date),
      hostWarning: sameHost
        ? `Juga tuan rumah pada ${formatServiceDate(sameHost.date)}`
        : null,
      dateError: isSameDate ? "Tanggal ini sudah dipakai baris lain." : null,
    };
  });
}

export type RowError = { field: "date" | "host"; message: string };

export function rowProblems(
  rows: readonly PreviewRow[],
  warnings: readonly RowWarning[],
  addresses: Readonly<Record<string, string>>,
): Map<number, RowError> {
  const problems = new Map<number, RowError>();

  rows.forEach((row, index) => {
    if (!row.isTicked) return;

    const problem: RowError | null = !row.date
      ? { field: "date", message: "Isi tanggal ibadah." }
      : warnings[index]?.dateError
        ? { field: "date", message: warnings[index].dateError }
        : !row.hostId
          ? { field: "host", message: "Pilih tuan rumah." }
          : addresses[row.hostId] === undefined
            ? { field: "host", message: "Alamat belum termuat." }
            : null;

    if (problem) problems.set(index, problem);
  });

  return problems;
}

export function toBatchRows(
  settings: GiliranSettings,
  rows: readonly PreviewRow[],
  addresses: Readonly<Record<string, string>>,
): { body: IbadahPayload[]; previewIndexOf: number[] } {
  const previewIndexOf = rows.flatMap((row, index) =>
    row.isTicked ? [index] : [],
  );

  return {
    previewIndexOf,
    body: previewIndexOf.map((index) =>
      toIbadahPayload({
        ...EMPTY_IBADAH_FORM,
        typeIbadahId: settings.typeIbadahId,
        date: rows[index].date,
        startTime: settings.startTime,
        endTime: settings.endTime,
        placeType: "RUMAH_JEMAAT",
        hostKeluargaId: rows[index].hostId,
        address: addresses[rows[index].hostId] ?? "",
        zoneChurchId: settings.zoneChurchId,
      }),
    ),
  };
}

export type BatchFailure = {
  rowErrors: Map<number, RowError>;
  root: string | null;
  isRace: boolean;
};

const ROW_PATH = /^rows\.(\d+)\.(\w+)/;

const SAME_ROW = /^ibadah ini sama dengan baris (\d+)/i;

const HOST_FIELDS = new Set(["hostKeluargaId", "address"]);

export function batchRowErrors(
  error: unknown,
  previewIndexOf: readonly number[],
  rows: readonly PreviewRow[],
  typeName: string,
): BatchFailure {
  const rowErrors = new Map<number, RowError>();

  if (!(error instanceof FetchError)) {
    return {
      rowErrors,
      root: "Tidak dapat menghubungi server. Periksa koneksi Anda.",
      isRace: false,
    };
  }
  if (error.issues.length === 0) {
    return {
      rowErrors,
      root: error.status === 409 ? null : error.message,
      isRace: error.status === 409,
    };
  }

  let root: string | null = null;

  for (const issue of error.issues) {
    const match = ROW_PATH.exec(issue.path);
    const previewIndex = match ? previewIndexOf[Number(match[1])] : undefined;

    if (previewIndex === undefined) {
      root ??= issue.message;
      continue;
    }
    if (rowErrors.has(previewIndex)) continue;

    const same = SAME_ROW.exec(issue.message);
    const sameDate = same
      ? rows[previewIndexOf[Number(same[1]) - 1] ?? -1]?.date
      : undefined;
    const message = same
      ? `Sama dengan baris ${sameDate ? formatServiceDate(sameDate) : same[1]}.`
      : /sudah tercatat/i.test(issue.message)
        ? "Sudah ada ibadah pada tanggal dan jam ini. Ganti tanggal atau lewati baris ini."
        : (serverFieldError(issue.message, typeName)?.message ?? issue.message);

    rowErrors.set(previewIndex, {
      field: HOST_FIELDS.has(match?.[2] ?? "") ? "host" : "date",
      message,
    });
  }

  return { rowErrors, root, isRace: false };
}
