import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { toDateInput, todayJakarta } from "@/lib/date";
import { formatDate, formatDateShort, formatWeekday } from "@/lib/format";

import {
  HOLIDAY_TYPE_LABEL,
  type Holiday,
  type HolidayPayload,
  type HolidayType,
} from "./types";

export const HARI_LIBUR_LIST_PATH = menuHref(MENU.PENGATURAN, MENU.HARI_LIBUR);

const HOLIDAY_TYPES = Object.keys(HOLIDAY_TYPE_LABEL) as [
  HolidayType,
  ...HolidayType[],
];

const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ");

export const holidayFormSchema = z.object({
  date: z.string().min(1, "Tanggal wajib diisi"),
  name: z
    .string()
    .overwrite(normalizeName)
    .min(1, "Mohon lengkapi nama hari libur, mis. HUT Gereja.")
    .min(3, "Nama hari libur minimal 3 karakter")
    .max(100, "Nama hari libur maksimal 100 karakter"),
  type: z
    .enum(HOLIDAY_TYPES)
    .or(z.literal(""))
    .refine(Boolean, "Tipe hari libur wajib dipilih"),
  isRecurring: z.enum(["true", "false"]),
});

export type HolidayFormValues = z.infer<typeof holidayFormSchema>;

export const EMPTY_HOLIDAY_FORM: HolidayFormValues = {
  date: "",
  name: "",
  type: "",
  isRecurring: "false",
};

export const RECURRING_HINT =
  "Pakai untuk tanggal tetap, mis. HUT gereja. Libur yang tanggalnya berubah tiap tahun (Paskah, Idul Fitri) dicatat per tahun.";

export const toHolidayPayload = (
  values: HolidayFormValues,
): HolidayPayload => ({
  date: values.date,
  name: normalizeName(values.name),
  type: values.type as HolidayType,
  isRecurring: values.isRecurring === "true",
});

export const toHolidayForm = (holiday: Holiday): HolidayFormValues => ({
  date: toDateInput(holiday.date),
  name: holiday.name,
  type: holiday.type,
  isRecurring: holiday.isRecurring ? "true" : "false",
});

export const formatHolidayDate = (date: string) =>
  `${formatWeekday(date)}, ${formatDate(date)}`;

export const formatHolidayDateShort = (date: string) =>
  `${formatWeekday(date)}, ${formatDateShort(date)}`;

export const holidayDateMax = (today: string = todayJakarta()) =>
  `${Number(today.slice(0, 4)) + 5}-12-31`;

export function yearOptions(today: string = todayJakarta()) {
  const year = Number(today.slice(0, 4));
  const years = [2, 1, 0, -1, -2].map((offset) => String(year + offset));

  return [
    { value: "", label: "Semua tahun" },
    ...years.map((value) => ({ value, label: value })),
  ];
}

export function serverFieldError(
  message: string,
): { field: keyof HolidayFormValues; message: string } | null {
  return /hari libur sudah tersedia/i.test(message)
    ? {
        field: "name",
        message: "Nama ini sudah dipakai hari libur lain di tanggal yang sama.",
      }
    : null;
}
