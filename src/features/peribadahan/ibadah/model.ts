import { z } from "zod";

import type { SelectOption } from "@/components/common/control";
import { MENU, createHref, menuHref } from "@/config/menu";
import {
  addDays,
  addMonths,
  startOfMonth,
  toDateInput,
  todayJakarta,
} from "@/lib/date";
import { formatDateShort, formatWeekday } from "@/lib/format";
import { emptyToNull } from "@/lib/utils";

import type {
  Ibadah,
  IbadahCounts,
  IbadahPayload,
  IbadahRelation,
} from "./types";

export const IBADAH_LIST_PATH = menuHref(MENU.PERIBADAHAN, MENU.IBADAH);

export const salinHref = (code: string) =>
  `${createHref(MENU.PERIBADAHAN, MENU.IBADAH)}?salin=${encodeURIComponent(code)}`;

const toClock = (time: string) => time.replace(":", ".");

export const formatServiceTime = (start: string, end: string | null) =>
  end ? `${toClock(start)}–${toClock(end)}` : toClock(start);

export const formatServiceDate = (date: string) =>
  `${formatWeekday(date)}, ${formatDateShort(date)}`;

type CountValues = Record<keyof IbadahCounts, number | string>;

export const attendanceOf = (counts: CountValues) =>
  Number(counts.maleCount || 0) +
  Number(counts.femaleCount || 0) +
  Number(counts.childCount || 0);

const countFormat = new Intl.NumberFormat("id-ID");

export const formatCount = (value: number) => countFormat.format(value);

export function attendanceLabel(
  row: IbadahCounts & { date: string },
  today: string = todayJakarta(),
): string | null {
  const total = attendanceOf(row);

  if (total > 0) return `${formatCount(total)} hadir`;

  return toDateInput(row.date) < today ? "Belum dicatat" : null;
}

const monthFormat = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function monthOptions(today: string = todayJakarta()): SelectOption[] {
  const current = startOfMonth(today);

  return Array.from({ length: 13 }, (_, index) => {
    const month = addMonths(current, 1 - index);

    return {
      value: month.slice(0, 7),
      label: monthFormat.format(new Date(`${month}T00:00:00Z`)),
    };
  });
}

export function monthRange(month: string): { start: string; end: string } {
  const start = /^\d{4}-\d{2}$/.test(month) ? `${month}-01` : "";
  const end = start ? addDays(addMonths(start, 1), -1) : "";

  return end ? { start, end } : { start: "", end: "" };
}

export function toIbadahApiFilters(filters: Record<string, string>) {
  const { start, end } = monthRange(filters.bulan ?? "");

  return {
    typeIbadahId: filters.tipe ?? "",
    startDate: start,
    endDate: end,
  };
}

const DIGITS = /^\d*$/;

const count = z.string().regex(DIGITS, "Isi angka tanpa titik atau koma.");

export const ibadahFormSchema = z
  .object({
    typeIbadahId: z.string().min(1, "Pilih tipe ibadah."),
    date: z.string().min(1, "Tanggal wajib diisi"),
    startTime: z.string().min(1, "Isi jam mulai."),
    endTime: z.string(),
    theme: z.string().max(150, "Tema maksimal 150 karakter."),
    bibleVerse: z.string().max(100, "Ayat maksimal 100 karakter."),
    preacher: z.string().max(150, "Nama pengkhotbah maksimal 150 karakter."),
    roomId: z.string(),
    bapelId: z.string(),
    jadwalPelayanId: z.string(),
    maleCount: count,
    femaleCount: count,
    childCount: count,
    note: z.string().max(250, "Catatan maksimal 250 karakter."),
  })
  .refine(
    (values) =>
      !values.endTime || !values.startTime || values.endTime > values.startTime,
    {
      path: ["endTime"],
      message: "Jam selesai harus sesudah jam mulai.",
      when: () => true,
    },
  );

export type IbadahFormValues = z.infer<typeof ibadahFormSchema>;

export const EMPTY_IBADAH_FORM: IbadahFormValues = {
  typeIbadahId: "",
  date: "",
  startTime: "",
  endTime: "",
  theme: "",
  bibleVerse: "",
  preacher: "",
  roomId: "",
  bapelId: "",
  jadwalPelayanId: "",
  maleCount: "",
  femaleCount: "",
  childCount: "",
  note: "",
};

const toId = (value: string) => (value ? Number(value) : null);

const idOf = (relation: IbadahRelation | null) => String(relation?.id ?? "");

const countOf = (value: number) => (value ? String(value) : "");

export const toIbadahPayload = (values: IbadahFormValues): IbadahPayload => ({
  typeIbadahId: Number(values.typeIbadahId),
  date: values.date,
  startTime: values.startTime,
  endTime: values.endTime || null,
  theme: emptyToNull(values.theme),
  bibleVerse: emptyToNull(values.bibleVerse),
  preacher: emptyToNull(values.preacher),
  roomId: toId(values.roomId),
  bapelId: toId(values.bapelId),
  jadwalPelayanId: toId(values.jadwalPelayanId),
  maleCount: Number(values.maleCount || 0),
  femaleCount: Number(values.femaleCount || 0),
  childCount: Number(values.childCount || 0),
  note: emptyToNull(values.note),
});

export const toIbadahForm = (ibadah: Ibadah): IbadahFormValues => ({
  typeIbadahId: idOf(ibadah.typeIbadah),
  date: toDateInput(ibadah.date),
  startTime: ibadah.startTime,
  endTime: ibadah.endTime ?? "",
  theme: ibadah.theme ?? "",
  bibleVerse: ibadah.bibleVerse ?? "",
  preacher: ibadah.preacher ?? "",
  roomId: idOf(ibadah.room),
  bapelId: idOf(ibadah.bapel),
  jadwalPelayanId: idOf(ibadah.jadwalPelayan),
  maleCount: countOf(ibadah.maleCount),
  femaleCount: countOf(ibadah.femaleCount),
  childCount: countOf(ibadah.childCount),
  note: ibadah.note ?? "",
});

export const toIbadahCopy = (
  source: Ibadah,
  activeTypeIds: readonly string[],
): IbadahFormValues => ({
  ...EMPTY_IBADAH_FORM,
  typeIbadahId: activeTypeIds.includes(idOf(source.typeIbadah))
    ? idOf(source.typeIbadah)
    : "",
  startTime: source.startTime,
  endTime: source.endTime ?? "",
  roomId: idOf(source.room),
  bapelId: idOf(source.bapel),
});

export const withSavedOption = (
  options: readonly SelectOption[],
  saved: IbadahRelation | null | undefined,
): readonly SelectOption[] =>
  !saved || options.some((option) => option.value === String(saved.id))
    ? options
    : [...options, { value: String(saved.id), label: saved.name }];

export function serverFieldError(
  message: string,
  typeName: string,
): { field: keyof IbadahFormValues; message: string } | null {
  if (/sudah tercatat/i.test(message)) {
    return {
      field: "startTime",
      message: `${typeName} pada tanggal dan jam ini sudah tercatat. Ubah jam mulai, atau buka data yang sudah ada dari daftar.`,
    };
  }
  if (/^tipe ibadah tersebut sudah tidak aktif/i.test(message)) {
    return {
      field: "typeIbadahId",
      message: "Tipe ibadah ini sudah nonaktif. Pilih tipe lain.",
    };
  }
  if (/^tipe ibadah tidak ditemukan/i.test(message)) {
    return {
      field: "typeIbadahId",
      message: "Tipe ibadah ini sudah dihapus. Pilih tipe lain.",
    };
  }
  if (/^ruangan tidak ditemukan/i.test(message)) {
    return {
      field: "roomId",
      message: "Ruang ini sudah dihapus. Pilih ruang lain atau kosongkan.",
    };
  }
  if (/^bapel tidak ditemukan/i.test(message)) {
    return {
      field: "bapelId",
      message:
        "Badan pelayanan ini sudah dihapus. Pilih yang lain atau kosongkan.",
    };
  }

  return null;
}
