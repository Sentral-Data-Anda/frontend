import { z } from "zod";

import { MENU, createHref, menuHref } from "@/config/menu";
import { toDateInput } from "@/lib/date";
import { normalizeName } from "@/lib/name";

import {
  EMPLOYMENT_STATUS_LABEL,
  type EmploymentStatus,
  type Karyawan,
  type KaryawanPayload,
} from "./types";

export const KARYAWAN_LIST_PATH = menuHref(MENU.SDM, MENU.KARYAWAN);

export const KARYAWAN_CREATE_PATH = createHref(MENU.SDM, MENU.KARYAWAN);

export const EMPTY_TITLE = "Belum ada karyawan";

export const EMPTY_DESCRIPTION =
  "Pegawai kantor gereja yang digaji bulanan dicatat di sini. Yang dibayar per ibadah atau per hari lewat Kas Keluar.";

export const FILTERED_DESCRIPTION =
  "Tidak ada karyawan yang cocok dengan pencarian ini.";

const EMPLOYMENT_STATUSES = Object.keys(EMPLOYMENT_STATUS_LABEL) as [
  EmploymentStatus,
  ...EmploymentStatus[],
];

export const karyawanFormSchema = z
  .object({
    jemaatId: z.string(),
    name: z
      .string()
      .overwrite(normalizeName)
      .min(1, "Isi nama karyawan.")
      .max(150, "Nama karyawan maksimal 150 karakter."),
    phone: z.string(),
    email: z.string(),
    address: z.string().max(250, "Alamat maksimal 250 karakter."),
    position: z
      .string()
      .overwrite((value) => value.trim())
      .min(1, "Isi jabatan karyawan, mis. Koster.")
      .max(100, "Jabatan maksimal 100 karakter."),
    joinDate: z.string().min(1, "Isi tanggal bergabung."),
    resignDate: z.string(),
    status: z.enum(EMPLOYMENT_STATUSES),
  })
  .superRefine((values, ctx) => {
    const fail = (path: string, message: string) =>
      ctx.addIssue({ code: "custom", path: [path], message });

    if (!values.phone) fail("phone", "Isi nomor HP karyawan.");
    else if (!/^\d+$/.test(values.phone)) {
      fail("phone", "Nomor HP hanya boleh angka.");
    } else if (values.phone.length > 15) {
      fail("phone", "Nomor HP maksimal 15 angka.");
    }

    if (values.email && !/^[^@\s]+@[^@\s]+$/.test(values.email)) {
      fail("email", "Email harus berbentuk nama@domain.");
    } else if (values.email.length > 150) {
      fail("email", "Email maksimal 150 karakter.");
    }

    if (values.status === "ACTIVE" && values.resignDate) {
      fail(
        "resignDate",
        "Hapus tanggal berhenti, atau ubah status jadi Berhenti.",
      );
    }

    if (values.status !== "ACTIVE" && !values.resignDate) {
      fail("resignDate", "Isi tanggal berhenti untuk status ini.");
    }

    if (
      values.joinDate &&
      values.resignDate &&
      values.resignDate < values.joinDate
    ) {
      fail(
        "resignDate",
        "Tanggal berhenti tidak boleh lebih awal dari tanggal bergabung.",
      );
    }
  });

export type KaryawanFormValues = z.infer<typeof karyawanFormSchema>;

export const EMPTY_KARYAWAN_FORM: KaryawanFormValues = {
  jemaatId: "",
  name: "",
  phone: "",
  email: "",
  address: "",
  position: "",
  joinDate: "",
  resignDate: "",
  status: "ACTIVE",
};

export const toKaryawanPayload = (
  values: KaryawanFormValues,
): KaryawanPayload => ({
  jemaatId: values.jemaatId ? Number(values.jemaatId) : null,
  name: normalizeName(values.name),
  phone: values.phone,
  email: values.email.trim() || null,
  address: values.address.trim() || null,
  position: values.position.trim(),
  joinDate: values.joinDate,
  resignDate: values.resignDate || null,
  status: values.status,
});

export const toKaryawanForm = (row: Karyawan): KaryawanFormValues => ({
  jemaatId: row.jemaatId === null ? "" : String(row.jemaatId),
  name: row.name,
  phone: row.phone,
  email: row.email ?? "",
  address: row.address ?? "",
  position: row.position,
  joinDate: toDateInput(row.joinDate),
  resignDate: toDateInput(row.resignDate),
  status: row.status,
});

const SERVER_FIELD: { pattern: RegExp; field: string; message?: string }[] = [
  {
    pattern: /tanggal berhenti tidak boleh lebih awal/i,
    field: "resignDate",
    message: "Tanggal berhenti tidak boleh lebih awal dari tanggal bergabung.",
  },
  {
    pattern: /jemaat tidak ditemukan/i,
    field: "jemaatId",
    message: "Jemaat ini sudah tidak ada. Pilih jemaat lain.",
  },
  {
    pattern: /sudah terdaftar sebagai karyawan/i,
    field: "jemaatId",
    message: "Jemaat ini sudah punya data karyawan aktif. Pilih jemaat lain.",
  },
];

export function serverFieldError(message: string) {
  const matched = SERVER_FIELD.find((entry) => entry.pattern.test(message));

  return matched
    ? { field: matched.field, message: matched.message ?? message }
    : null;
}
