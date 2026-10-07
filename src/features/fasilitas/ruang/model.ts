import { z } from "zod";

import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
} from "@/config/menu";
import { FetchError } from "@/lib/api/fetcher";
import {
  fromServerAttachment,
  keptAttachments,
  newAttachments,
} from "@/lib/attachment";
import { toFormData } from "@/lib/form-data";
import { formatDateShort, formatWeekday } from "@/lib/format";
import { normalizeName } from "@/lib/name";
import type { AttachmentValue } from "@/types/attachment";

import type { Room, RoomDetail, RoomUsage } from "./types";

export const MAX_DETAIL_PHOTOS = 4;

export const RUANG_LIST_PATH = menuHref(MENU.FASILITAS, MENU.RUANG);

export const RUANG_CREATE_PATH = createHref(MENU.FASILITAS, MENU.RUANG);

export const ruangDetailHref = (code: string) =>
  detailHref(MENU.FASILITAS, MENU.RUANG, code);

export const ruangEditHref = (code: string) =>
  editHref(MENU.FASILITAS, MENU.RUANG, code);

export const loanEditHref = (code: string) =>
  editHref(MENU.FASILITAS, MENU.PEMINJAMAN_RUANG, code);

export const IS_ACTIVE_PARAM: Record<string, string> = {
  aktif: "1",
  nonaktif: "0",
};

export const ruangFormSchema = z.object({
  name: z
    .string()
    .transform(normalizeName)
    .pipe(
      z
        .string()
        .min(4, "Isi nama ruang, minimal 4 karakter")
        .max(100, "Nama ruang maksimal 100 karakter"),
    ),
  capacity: z
    .string()
    .refine(
      (value) => /^\d+$/.test(value) && Number(value) >= 1,
      "Kapasitas minimal 1 orang",
    ),
  isActive: z.enum(["true", "false"]),
  mainImage: z.array(z.custom<AttachmentValue>()).max(1),
  detailImage: z
    .array(z.custom<AttachmentValue>())
    .max(MAX_DETAIL_PHOTOS, `Foto detail maksimal ${MAX_DETAIL_PHOTOS}`),
});

export type RuangFormValues = z.infer<typeof ruangFormSchema>;

export const EMPTY_RUANG_FORM: RuangFormValues = {
  name: "",
  capacity: "",
  isActive: "true",
  mainImage: [],
  detailImage: [],
};

export const toRuangForm = (room: RoomDetail): RuangFormValues => ({
  name: room.name,
  capacity: String(room.capacity),
  isActive: room.isActive ? "true" : "false",
  mainImage: room.mainImage ? [fromServerAttachment(room.mainImage)] : [],
  detailImage: room.detailImage.map(fromServerAttachment),
});

export const toRuangFormData = (values: RuangFormValues, isEdit: boolean) =>
  toFormData(
    {
      name: normalizeName(values.name),
      capacity: Number(values.capacity),
      isActive: values.isActive === "true",
      keepFiles: isEdit
        ? JSON.stringify(keptAttachments(values.detailImage))
        : null,
    },
    [
      ...newAttachments(values.mainImage).map((item) => ({
        field: "mainImage",
        file: item.file,
      })),
      ...newAttachments(values.detailImage).map((item) => ({
        field: "image",
        file: item.file,
      })),
    ],
  );

const SERVER_FIELD_ERROR: ReadonlyArray<[RegExp, string, string?]> = [
  [
    /sudah tersedia/i,
    "name",
    "Ruang dengan nama ini sudah ada. Pakai nama lain.",
  ],
  [/unsupported file type/i, "root", "Pilih foto JPG atau PNG."],
  [/file too large/i, "root", "Ukuran foto maksimal 10 MB."],
  [
    /unexpected field/i,
    "root",
    "Foto utama maksimal 1 dan foto detail maksimal 4.",
  ],
];

export function serverFieldError(
  message: string,
): { field: string; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) return { field, message: override ?? message };
  }

  return null;
}

// be-sada melaporkan foto detail lewat `detailImage` atau `keepFiles`; form hanya punya `detailImage`.
export const toFormError = (error: unknown) =>
  error instanceof FetchError
    ? new FetchError(
        error.status,
        error.message,
        error.issues.map((issue) => ({
          ...issue,
          path: issue.path === "keepFiles" ? "detailImage" : issue.path,
        })),
        error.code,
      )
    : error;

export const roomMetaOf = (room: Pick<Room, "capacity" | "code">) =>
  `${room.capacity} orang · ${room.code}`;

export const usageDayOf = (date: string) =>
  `${formatWeekday(date)}, ${formatDateShort(date)}`;

export type UsageDay = { date: string; rows: RoomUsage[] };

export const groupUsage = (rows: readonly RoomUsage[]): UsageDay[] =>
  rows.reduce<UsageDay[]>((days, row) => {
    const last = days.at(-1);

    if (last?.date === row.date) last.rows.push(row);
    else days.push({ date: row.date, rows: [row] });

    return days;
  }, []);
