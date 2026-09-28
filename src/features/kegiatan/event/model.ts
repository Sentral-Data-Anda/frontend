import { z } from "zod";

import type { SelectOption } from "@/components/common/control";
import { MENU, menuHref } from "@/config/menu";
import { fromServerAttachment, newAttachments } from "@/lib/attachment";
import {
  addDays,
  addMonths,
  startOfMonth,
  toDateInput,
  todayJakarta,
} from "@/lib/date";
import { toFormData } from "@/lib/form-data";
import { formatDateShort, formatRupiah } from "@/lib/format";
import type { AttachmentValue } from "@/types/attachment";

import type { ChurchEvent, EventStatus } from "./types";

export const EVENT_LIST_PATH = menuHref(MENU.KEGIATAN, MENU.EVENT);

export const registrationsHref = (event: Pick<ChurchEvent, "id">) =>
  `${menuHref(MENU.KEGIATAN, MENU.PENDAFTARAN_EVENT)}?event=${event.id}`;

const toClock = (time: string) => time.replace(":", ".");

const withoutYear = (date: string) =>
  formatDateShort(date).replace(/ \d{4}$/, "");

export function formatEventDates(startDate: string, endDate: string) {
  const start = toDateInput(startDate);
  const end = toDateInput(endDate);

  if (start === end) return formatDateShort(start);
  if (start.slice(0, 7) === end.slice(0, 7)) {
    return `${Number(start.slice(8))}–${formatDateShort(end)}`;
  }
  if (start.slice(0, 4) === end.slice(0, 4)) {
    return `${withoutYear(start)} – ${formatDateShort(end)}`;
  }

  return `${formatDateShort(start)} – ${formatDateShort(end)}`;
}

type EventWhen = Pick<
  ChurchEvent,
  "startDate" | "endDate" | "startTime" | "endTime"
>;

export const isSingleDay = (event: Pick<EventWhen, "startDate" | "endDate">) =>
  toDateInput(event.startDate) === toDateInput(event.endDate);

export function formatEventTime(event: EventWhen): string | null {
  if (!event.startTime) return null;

  return isSingleDay(event) && event.endTime
    ? `${toClock(event.startTime)}–${toClock(event.endTime)}`
    : toClock(event.startTime);
}

export const formatEventWhen = (event: EventWhen) =>
  [formatEventDates(event.startDate, event.endDate), formatEventTime(event)]
    .filter(Boolean)
    .join(", ");

export const placeOf = (
  event: Pick<ChurchEvent, "isIndoor" | "room" | "location">,
) => (event.isIndoor ? event.room?.name : event.location) ?? null;

export const priceLabel = (event: Pick<ChurchEvent, "isPaid" | "price">) =>
  event.isPaid && event.price ? formatRupiah(Number(event.price)) : "Gratis";

export const isFull = (
  event: Pick<ChurchEvent, "capacity" | "registeredCount">,
) => event.registeredCount >= event.capacity;

export function eventStatusOf(
  event: Pick<ChurchEvent, "isPublish" | "startDate" | "endDate">,
  today: string = todayJakarta(),
): EventStatus {
  if (!event.isPublish) return "DRAFT";
  if (toDateInput(event.endDate) < today) return "DONE";
  if (toDateInput(event.startDate) <= today) return "ONGOING";

  return "UPCOMING";
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

  return start
    ? { start, end: addDays(addMonths(start, 1), -1) }
    : { start: "", end: "" };
}

const PUBLISH_FILTER: Record<string, string> = { terbit: "1", draf: "0" };

export function toEventApiFilters(
  filters: Record<string, string>,
  status: string,
) {
  const { start, end } = monthRange(filters.bulan ?? "");

  return {
    bapelId: filters.bapel ?? "",
    startDate: start,
    endDate: end,
    isPublish: PUBLISH_FILTER[status] ?? "",
    order: "desc",
  };
}

const DIGITS = /^\d*$/;

const eventFields = z.object({
  name: z
    .string()
    .trim()
    .min(4, "Isi nama event, minimal 4 karakter")
    .max(150, "Nama event maksimal 150 karakter"),
  description: z
    .string()
    .trim()
    .min(10, "Isi deskripsi, minimal 10 karakter")
    .max(250, "Deskripsi maksimal 250 karakter"),
  bapelId: z.string().min(1, "Pilih badan pelayanan"),
  image: z.array(z.custom<AttachmentValue>()),
  startDate: z.string().min(1, "Isi tanggal mulai"),
  endDate: z.string().min(1, "Isi tanggal selesai"),
  startTime: z.string().min(1, "Isi jam mulai"),
  endTime: z.string(),
  isIndoor: z.enum(["1", "0"]),
  roomId: z.string(),
  location: z.string(),
  capacity: z
    .string()
    .regex(DIGITS, "Isi angka tanpa titik atau koma.")
    .refine((value) => Number(value) >= 1, "Kapasitas minimal 1 orang"),
  isPaid: z.enum(["0", "1"]),
  price: z.string().regex(DIGITS, "Isi angka tanpa titik atau koma."),
  urlForm: z.string().trim().max(150, "Tautan maksimal 150 karakter"),
  isPublish: z.enum(["0", "1"]),
});

export type EventFormValues = z.infer<typeof eventFields>;

type SchemaContext = { isEdit: boolean; registeredCount: number };

export const eventFormSchema = (context: SchemaContext) =>
  eventFields.superRefine((values, issues) => {
    const onIssue = (path: keyof EventFormValues, message: string) =>
      issues.addIssue({ code: "custom", path: [path], message });

    if (!context.isEdit && values.image.length === 0) {
      onIssue("image", "Pilih foto utama event");
    }
    if (
      values.startDate &&
      values.endDate &&
      values.endDate < values.startDate
    ) {
      onIssue("endDate", "Tanggal selesai tidak boleh sebelum tanggal mulai");
    }
    if (
      values.startDate === values.endDate &&
      values.startTime &&
      values.endTime &&
      values.endTime <= values.startTime
    ) {
      onIssue("endTime", "Jam selesai harus setelah jam mulai");
    }
    if (values.isIndoor === "1" && !values.roomId) {
      onIssue("roomId", "Pilih ruang");
    }
    if (values.isIndoor === "0") {
      const location = values.location.trim();

      if (location.length < 4) {
        onIssue("location", "Isi lokasi, minimal 4 karakter");
      } else if (location.length > 100) {
        onIssue("location", "Lokasi maksimal 100 karakter");
      }
    }
    if (
      context.registeredCount > 0 &&
      Number(values.capacity) < context.registeredCount
    ) {
      onIssue(
        "capacity",
        `Kapasitas minimal ${context.registeredCount}, sudah ada ${context.registeredCount} pendaftar.`,
      );
    }
    if (values.isPaid === "1" && !(Number(values.price) >= 1)) {
      onIssue("price", "Isi harga, minimal Rp1");
    }
  });

export const EMPTY_EVENT_FORM: EventFormValues = {
  name: "",
  description: "",
  bapelId: "",
  image: [],
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  isIndoor: "1",
  roomId: "",
  location: "",
  capacity: "",
  isPaid: "0",
  price: "",
  urlForm: "",
  isPublish: "0",
};

const flagOf = (value: boolean) => (value ? "1" : "0");

export const toEventForm = (event: ChurchEvent): EventFormValues => ({
  name: event.name,
  description: event.description,
  bapelId: String(event.bapel.id),
  image: event.image ? [fromServerAttachment(event.image)] : [],
  startDate: toDateInput(event.startDate),
  endDate: toDateInput(event.endDate),
  startTime: event.startTime ?? "",
  endTime: event.endTime ?? "",
  isIndoor: flagOf(event.isIndoor),
  roomId: event.room ? String(event.room.id) : "",
  location: event.location ?? "",
  capacity: String(event.capacity),
  isPaid: flagOf(event.isPaid),
  price: event.price ? String(Math.round(Number(event.price))) : "",
  urlForm: event.urlForm ?? "",
  isPublish: flagOf(event.isPublish),
});

export function toEventFormData(values: EventFormValues): FormData {
  const isIndoor = values.isIndoor === "1";
  const isPaid = values.isPaid === "1";

  return toFormData(
    {
      name: values.name.trim(),
      description: values.description.trim(),
      bapelId: values.bapelId,
      isIndoor,
      roomId: isIndoor ? values.roomId : null,
      location: isIndoor ? null : values.location.trim(),
      capacity: Number(values.capacity),
      isPaid,
      price: isPaid ? Number(values.price) : null,
      startDate: values.startDate,
      endDate: values.endDate,
      startTime: values.startTime,
      endTime: values.endTime || null,
      urlForm: values.urlForm.trim() || null,
      isPublish: values.isPublish === "1",
    },
    newAttachments(values.image).map((item) => ({
      field: "mainImage",
      file: item.file,
    })),
  );
}

const thousands = new Intl.NumberFormat("id-ID");

export const formatThousands = (digits: string) =>
  digits ? thousands.format(Number(digits)) : "";

export const toDigits = (value: string, maxLength: number) =>
  value
    .replace(/\D/g, "")
    .replace(/^0+(?=\d)/, "")
    .slice(0, maxLength);
