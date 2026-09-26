import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { toDateInput, todayJakarta } from "@/lib/date";
import { formatDateShort } from "@/lib/format";

import type { RoleJemaatItem, RoleJemaatPayload } from "./types";

export const ROLE_JEMAAT_LIST_PATH = menuHref(
  MENU.KEJEMAATAN,
  MENU.ROLE_JEMAAT,
);

const required = (message: string) => z.string().min(1, message);

export const roleJemaatFormSchema = z
  .object({
    jemaatId: required("Mohon lengkapi jemaat"),
    bapelId: required("Mohon lengkapi badan pelayanan"),
    name: z
      .string()
      .trim()
      .min(1, "Mohon lengkapi nama jabatan, mis. Ketua atau Sekretaris.")
      .min(2, "Nama jabatan setidaknya 2 karakter")
      .max(50, "Nama jabatan maksimal 50 karakter"),
    startPeriode: required("Mohon lengkapi tanggal mulai periode"),
    endPeriode: required("Mohon lengkapi tanggal selesai periode"),
    status: z.enum(["true", "false"], "Mohon lengkapi status jabatan"),
  })
  .refine(
    (values) =>
      !values.startPeriode ||
      !values.endPeriode ||
      values.endPeriode > values.startPeriode,
    {
      path: ["endPeriode"],
      message: "Tanggal selesai harus setelah tanggal mulai periode.",
    },
  );

export type RoleJemaatFormValues = z.input<typeof roleJemaatFormSchema>;

export const EMPTY_ROLE_JEMAAT_FORM: RoleJemaatFormValues = {
  jemaatId: "",
  bapelId: "",
  name: "",
  startPeriode: "",
  endPeriode: "",
  status: "true",
};

export function toRoleJemaatPayload(
  values: RoleJemaatFormValues,
): RoleJemaatPayload {
  return {
    name: values.name.trim(),
    startPeriode: values.startPeriode,
    endPeriode: values.endPeriode,
    status: values.status === "true",
    jemaatId: Number(values.jemaatId),
    bapelId: Number(values.bapelId),
  };
}

export function toRoleJemaatForm(detail: RoleJemaatItem): RoleJemaatFormValues {
  return {
    jemaatId: String(detail.jemaat.id),
    bapelId: detail.bapel ? String(detail.bapel.id) : "",
    name: detail.name,
    startPeriode: toDateInput(detail.startPeriode),
    endPeriode: toDateInput(detail.endPeriode),
    status: detail.status ? "true" : "false",
  };
}

type ServerField = keyof RoleJemaatFormValues | "root";

const SERVER_FIELD_ERROR: ReadonlyArray<[RegExp, ServerField, string]> = [
  [
    /bertumpang tindih/i,
    "root",
    "Jemaat ini sudah memegang jabatan dengan nama yang sama di badan pelayanan ini pada periode yang bertumpang tindih. Ubah periodenya atau akhiri dulu jabatan yang lama. Tanggal mulai boleh sama dengan tanggal selesai jabatan lama.",
  ],
  [
    /periode selesai harus setelah/i,
    "endPeriode",
    "Tanggal selesai harus setelah tanggal mulai periode.",
  ],
  [
    /^jemaat tidak ditemukan/i,
    "jemaatId",
    "Jemaat tidak ditemukan; pilih ulang dari daftar.",
  ],
  [
    /^bapel tidak ditemukan/i,
    "bapelId",
    "Badan pelayanan tidak ditemukan; pilih ulang dari daftar.",
  ],
];

export function serverFieldError(
  message: string,
): { field: ServerField; message: string } | null {
  const hit = SERVER_FIELD_ERROR.find(([pattern]) => pattern.test(message));

  return hit ? { field: hit[1], message: hit[2] } : null;
}

export const formatPeriode = (item: RoleJemaatItem): string =>
  `${formatDateShort(item.startPeriode)} – ${formatDateShort(item.endPeriode)}`;

export function yearOptions(today: string = todayJakarta()) {
  const year = Number(today.slice(0, 4));
  const years = Array.from({ length: 11 }, (_, index) =>
    String(year + 5 - index),
  );

  return [
    { value: "", label: "Semua tahun" },
    ...years.map((value) => ({ value, label: value })),
  ];
}
