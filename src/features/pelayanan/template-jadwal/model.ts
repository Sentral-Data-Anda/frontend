import { z } from "zod";

import type { SelectOption } from "@/components/common/control";
import { MENU, menuHref } from "@/config/menu";
import { FetchError } from "@/lib/api/fetcher";

import type {
  TemplateJadwalDetail,
  TemplateJadwalListItem,
  TemplateJadwalPayload,
} from "./types";

export const TEMPLATE_JADWAL_LIST_PATH = menuHref(
  MENU.PELAYANAN,
  MENU.TEMPLATE_JADWAL,
);

const normalizeName = (name: string) => name.trim().replace(/\s+/g, " ");

export const templateJadwalFormSchema = z
  .object({
    name: z
      .string()
      .transform(normalizeName)
      .pipe(
        z
          .string()
          .min(1, "Isi nama template, mis. Ibadah Minggu Pagi.")
          .min(4, "Nama template minimal 4 karakter.")
          .max(50, "Nama template maksimal 50 karakter."),
      ),
    bapelId: z.string().min(1, "Pilih badan pelayanan."),
    startTime: z.string().min(1, "Isi jam mulai."),
    endTime: z.string().min(1, "Isi jam selesai."),
    slots: z
      .array(z.object({ roleId: z.string().min(1, "Pilih tugas.") }))
      .min(1, "Tambahkan minimal satu tugas."),
  })
  .refine(
    (values) =>
      !values.startTime || !values.endTime || values.endTime > values.startTime,
    {
      path: ["endTime"],
      message: "Jam selesai harus sesudah jam mulai.",
    },
  );

export type TemplateJadwalFormValues = z.input<typeof templateJadwalFormSchema>;

export type SlotValues = TemplateJadwalFormValues["slots"][number];

export const EMPTY_SLOT: SlotValues = { roleId: "" };

export const EMPTY_TEMPLATE_JADWAL_FORM: TemplateJadwalFormValues = {
  name: "",
  bapelId: "",
  startTime: "",
  endTime: "",
  slots: [EMPTY_SLOT],
};

const byOrder = (a: { order: number }, b: { order: number }) =>
  a.order - b.order;

export const toTemplateJadwalPayload = (
  values: TemplateJadwalFormValues,
): TemplateJadwalPayload => ({
  bapelId: Number(values.bapelId),
  name: normalizeName(values.name),
  startTime: values.startTime,
  endTime: values.endTime,
  detail: values.slots.map((slot, index) => ({
    order: index + 1,
    rolePelayanId: Number(slot.roleId),
  })),
});

export const toTemplateJadwalForm = (
  detail: TemplateJadwalDetail,
): TemplateJadwalFormValues => ({
  name: detail.name,
  bapelId: String(detail.bapel.id),
  startTime: detail.startTime,
  endTime: detail.endTime,
  slots: [...detail.detail]
    .sort(byOrder)
    .map((slot) => ({ roleId: String(slot.rolePelayanId) })),
});

export const rolesOf = (item: TemplateJadwalListItem) =>
  [...item.detail].sort(byOrder).map((slot) => slot.roleName);

export const timeRangeOf = (item: { startTime: string; endTime: string }) =>
  `${item.startTime}–${item.endTime}`;

export const withSavedRole = (
  options: readonly SelectOption[],
  value: string,
  isLoading: boolean,
): readonly SelectOption[] =>
  !value || isLoading || options.some((option) => option.value === value)
    ? options
    : [...options, { value, label: "Tugas terhapus" }];

const NAME_TAKEN = /nama template sudah tersedia/i;
const BAPEL_GONE = /^bapel tidak ditemukan/i;
const ROLE_GONE = /^role pelayan tidak ditemukan/i;

const NAME_TAKEN_MESSAGE =
  "Template dengan nama ini sudah ada. Pakai nama lain.";
const BAPEL_GONE_MESSAGE =
  "Badan pelayanan ini sudah dihapus. Pilih yang lain.";

type ServerField = "name" | "bapelId" | "root";

const SERVER_FIELD_ERROR: ReadonlyArray<[RegExp, ServerField, string]> = [
  [NAME_TAKEN, "name", NAME_TAKEN_MESSAGE],
  [BAPEL_GONE, "bapelId", BAPEL_GONE_MESSAGE],
  [
    ROLE_GONE,
    "root",
    "Salah satu tugas sudah dihapus. Muat ulang halaman lalu pilih lagi.",
  ],
];

export function serverFieldError(
  message: string,
): { field: ServerField; message: string } | null {
  const hit = SERVER_FIELD_ERROR.find(([pattern]) => pattern.test(message));

  return hit ? { field: hit[1], message: hit[2] } : null;
}

const ISSUE_MESSAGE: ReadonlyArray<[RegExp, string]> = [
  [NAME_TAKEN, NAME_TAKEN_MESSAGE],
  [BAPEL_GONE, BAPEL_GONE_MESSAGE],
  [ROLE_GONE, "Tugas ini sudah dihapus. Pilih tugas lain."],
];

const SLOT_ROLE_PATH = /^detail\.(\d+)\.rolePelayanId$/;

const toFormPath = (path: string) => {
  const index = SLOT_ROLE_PATH.exec(path)?.[1];

  if (index !== undefined) return `slots.${index}.roleId`;

  return path === "detail" ? "slots" : path;
};

export function withFormIssues(error: unknown): unknown {
  if (!(error instanceof FetchError) || error.issues.length === 0) return error;

  const issues = error.issues.map((issue) => ({
    path: toFormPath(issue.path),
    message:
      ISSUE_MESSAGE.find(([pattern]) => pattern.test(issue.message))?.[1] ??
      issue.message,
  }));

  return new FetchError(error.status, error.message, issues, error.code);
}
