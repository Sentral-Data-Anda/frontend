import { z } from "zod";

import type { SelectOption } from "@/components/common/control";
import {
  FORM_SEGMENT,
  MENU,
  createHref,
  editHref,
  menuHref,
} from "@/config/menu";
import type { ListFilterSchema } from "@/hooks/use-list-params";
import { formatAmount } from "@/lib/format";
import { collapseSpaces } from "@/lib/name";

import type {
  CalculationType,
  KomponenPayroll,
  KomponenPayrollOption,
  KomponenPayrollPayload,
  PenetapanKomponen,
  PenetapanPayload,
} from "./types";

export const KATALOG_LIST_PATH = menuHref(MENU.SDM, MENU.KOMPONEN_PAYROLL);

export const KATALOG_CREATE_PATH = createHref(MENU.SDM, MENU.KOMPONEN_PAYROLL);

export const katalogEditHref = (code: string) =>
  editHref(MENU.SDM, MENU.KOMPONEN_PAYROLL, code);

export const PENETAPAN_LIST_PATH = `${KATALOG_LIST_PATH}/karyawan`;

export const PENETAPAN_CREATE_PATH = `${PENETAPAN_LIST_PATH}/${FORM_SEGMENT.create}`;

export const penetapanEditHref = (publicId: string) =>
  `${PENETAPAN_LIST_PATH}/${encodeURIComponent(publicId)}/${FORM_SEGMENT.edit}`;

export const TABS = [
  { value: KATALOG_LIST_PATH, label: "Komponen" },
  { value: PENETAPAN_LIST_PATH, label: "Penetapan" },
] as const;

/**
 * Komponen yang dipakai perhitungan pajak dan dicari be-sada lewat kodenya.
 * `update` dan `delete` menolaknya, jadi layarnya tidak menawarkan pensil.
 */
export const MANAGED_CODE = "PPH21";

export const isManaged = (component: Pick<KomponenPayroll, "code">) =>
  component.code === MANAGED_CODE;

export const KATALOG_FILTERS = {
  jenis: { api: "type" },
} satisfies ListFilterSchema;

export const PENETAPAN_FILTERS = {
  karyawan: { api: "karyawanId" },
  komponen: { api: "payrollComponentId" },
} satisfies ListFilterSchema;

export const NO_VIEW_TITLE = "Anda tidak memiliki akses ke Komponen Payroll";

export const NO_VIEW_DESCRIPTION =
  "Hubungi administrator bila Anda memerlukan akses ini.";

export const MANAGED_NOTE =
  "Komponen PPh21 dipakai perhitungan pajak dan tidak bisa diubah atau dihapus.";

export const INACTIVE_COMPONENT_NOTE =
  "Komponen ini sudah nonaktif, jadi penetapan ini tidak dibayarkan pada penggajian berikutnya.";

export const INACTIVE_NOTE =
  "Komponen nonaktif tetap tercantum di sini, tapi tidak dibayarkan pada penggajian berikutnya.";

export const ACCOUNT_NOTE =
  "Akun tempat komponen ini membukukan saat penggajian dibayar.";

export const PER_PERSON_LABEL = "Per orang";

export const ACCOUNT_UNMAPPED = "Belum dipetakan";

export const ACCOUNT_LOADING = "Memuat…";

export const ACCOUNT_UNKNOWN = "Akun tidak ditemukan";

export const PENETAPAN_PAIR_NOTE =
  "Karyawan dan komponen tidak bisa dipindahkan. Hapus penetapan ini lalu buat yang baru.";

export const PERCENTAGE_MAX = 100;

const amountText = (
  value: string,
  calculationType: CalculationType | undefined,
) =>
  calculationType === "PERCENTAGE" ? `${Number(value)}%` : formatAmount(value);

export const defaultValueText = (component: KomponenPayroll) =>
  component.defaultValue === null
    ? PER_PERSON_LABEL
    : amountText(component.defaultValue, component.calculationType);

// Persen dibaca dari relasi penetapan, bukan dari pemilih: tanpa itu 2% dari
// gaji terbaca "Rp 2".
export const assignmentValueText = (assignment: PenetapanKomponen) =>
  assignment.value === null
    ? "Default komponen"
    : amountText(assignment.value, assignment.payrollComponent.calculationType);

export const MAX_VALUE_DIGITS = 16;

const amountIssues = (value: string, label: string) => {
  if (!value) return [`Isi ${label}`];

  const amount = Number(value);

  if (!Number.isFinite(amount)) return [`${label} tidak valid`];
  if (amount <= 0) return [`${label} harus lebih dari 0`];

  return [];
};

const VALUE_MODE = ["nilai", "kosong"] as const;

export const komponenFormSchema = z
  .object({
    name: z.string(),
    type: z.enum(["EARNING", "DEDUCTION"], "Pilih jenis komponen"),
    calculationType: z.enum(["FIXED", "PERCENTAGE"], "Pilih cara hitung"),
    valueMode: z.enum(VALUE_MODE),
    defaultValue: z.string(),
    isTaxable: z.enum(["true", "false"]),
    isActive: z.enum(["true", "false"]),
    accountId: z.string(),
  })
  .superRefine((values, ctx) => {
    const addIssue = (path: string[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    const name = collapseSpaces(values.name);

    if (!name) addIssue(["name"], "Isi nama komponen");
    else if (name.length > 100) {
      addIssue(["name"], "Nama komponen maksimal 100 karakter");
    }

    if (values.valueMode === "kosong") return;

    amountIssues(values.defaultValue, "nilai default").forEach((message) =>
      addIssue(["defaultValue"], message),
    );

    if (
      values.calculationType === "PERCENTAGE" &&
      Number(values.defaultValue) > 100
    ) {
      addIssue(["defaultValue"], "Persentase tidak boleh lebih dari 100");
    }
  });

export type KomponenFormValues = z.infer<typeof komponenFormSchema>;

export const EMPTY_KOMPONEN_FORM: KomponenFormValues = {
  name: "",
  type: "EARNING",
  calculationType: "FIXED",
  valueMode: "nilai",
  defaultValue: "",
  isTaxable: "true",
  isActive: "true",
  accountId: "",
};

export const toKomponenPayload = (
  values: KomponenFormValues,
): KomponenPayrollPayload => ({
  name: collapseSpaces(values.name),
  type: values.type,
  calculationType: values.calculationType,
  defaultValue:
    values.valueMode === "kosong" ? null : Number(values.defaultValue),
  isTaxable: values.isTaxable === "true",
  isActive: values.isActive === "true",
  accountId: values.accountId ? Number(values.accountId) : null,
});

export const toKomponenForm = (
  component: KomponenPayroll,
): KomponenFormValues => ({
  name: component.name,
  type: component.type,
  calculationType: component.calculationType,
  valueMode: component.defaultValue === null ? "kosong" : "nilai",
  defaultValue: component.defaultValue ?? "",
  isTaxable: component.isTaxable ? "true" : "false",
  isActive: component.isActive ? "true" : "false",
  accountId: component.accountId === null ? "" : String(component.accountId),
});

export const penetapanFormSchema = z
  .object({
    karyawanId: z.string(),
    payrollComponentId: z.string(),
    calculationType: z.enum(["FIXED", "PERCENTAGE"]),
    valueMode: z.enum(VALUE_MODE),
    value: z.string(),
    effectiveFrom: z.string(),
    effectiveTo: z.string(),
  })
  .superRefine((values, ctx) => {
    const addIssue = (path: string[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    if (!values.karyawanId) addIssue(["karyawanId"], "Pilih karyawan");
    if (!values.payrollComponentId) {
      addIssue(["payrollComponentId"], "Pilih komponen payroll");
    }
    if (!values.effectiveFrom) {
      addIssue(["effectiveFrom"], "Isi tanggal mulai berlaku");
    }
    if (values.effectiveTo && values.effectiveTo < values.effectiveFrom) {
      addIssue(
        ["effectiveTo"],
        "Berlaku sampai tidak boleh sebelum berlaku dari",
      );
    }

    if (values.valueMode === "kosong") return;

    amountIssues(values.value, "nilai").forEach((message) =>
      addIssue(["value"], message),
    );

    // Tabel penetapan tidak punya CHECK persen, dan 5000 di komponen
    // PERCENTAGE mengalikan gaji pokok lima puluh kali.
    if (
      values.calculationType === "PERCENTAGE" &&
      Number(values.value) > PERCENTAGE_MAX
    ) {
      addIssue(["value"], "Persentase tidak boleh lebih dari 100");
    }
  });

export type PenetapanFormValues = z.infer<typeof penetapanFormSchema>;

export const EMPTY_PENETAPAN_FORM: PenetapanFormValues = {
  karyawanId: "",
  payrollComponentId: "",
  calculationType: "FIXED",
  valueMode: "nilai",
  value: "",
  effectiveFrom: "",
  effectiveTo: "",
};

export const toPenetapanPayload = (
  values: PenetapanFormValues,
): PenetapanPayload => ({
  karyawanId: Number(values.karyawanId),
  payrollComponentId: Number(values.payrollComponentId),
  value: values.valueMode === "kosong" ? null : Number(values.value),
  effectiveFrom: values.effectiveFrom,
  effectiveTo: values.effectiveTo || null,
});

export const toPenetapanForm = (
  assignment: PenetapanKomponen,
): PenetapanFormValues => ({
  karyawanId: String(assignment.karyawanId),
  payrollComponentId: String(assignment.payrollComponentId),
  calculationType: assignment.payrollComponent.calculationType,
  valueMode: assignment.value === null ? "kosong" : "nilai",
  value: assignment.value ?? "",
  effectiveFrom: assignment.effectiveFrom.slice(0, 10),
  effectiveTo: assignment.effectiveTo?.slice(0, 10) ?? "",
});

/**
 * Opsi yang boleh ditetapkan ke seorang karyawan.
 *
 * Pemilih be-sada menyaring `isActive` saja, jadi baris yang dikelola sistem
 * sampai ke sini. Menetapkannya membuat slip berisi baris yang akunnya tidak
 * ada layarnya untuk diisi, dan `markPaid` menolak run-nya.
 */
export const assignableOptions = (
  rows: readonly KomponenPayrollOption[],
  options: readonly SelectOption[],
) => {
  const managed = new Set(rows.filter(isManaged).map((row) => String(row.id)));

  return options.filter((option) => !managed.has(option.value));
};

export const pickedComponent = (
  rows: readonly KomponenPayrollOption[],
  value: string,
) => rows.find((row) => String(row.id) === value) ?? null;

export const calculationHint = (
  calculationType: CalculationType | undefined,
) =>
  calculationType === "PERCENTAGE"
    ? "Persen dari gaji pokok, maksimal 100."
    : "Nominal rupiah.";

const SERVER_FIELD_ERROR: ReadonlyArray<[RegExp, string, string?]> = [
  [
    /komponen payroll sudah tersedia/i,
    "name",
    "Nama komponen ini sudah ada. Pakai nama lain.",
  ],
  [
    /akun tidak ditemukan/i,
    "accountId",
    "Akun ini tidak ada lagi. Pilih akun lain.",
  ],
  [/akun .* sudah tidak aktif/i, "accountId"],
  [/nilai default untuk komponen persentase/i, "defaultValue"],
  [/nama komponen/i, "name"],
];

const SERVER_ASSIGNMENT_ERROR: ReadonlyArray<[RegExp, string, string?]> = [
  [/nilai komponen harus diisi/i, "value"],
  [/sudah mendapat komponen tersebut pada periode/i, "effectiveFrom"],
  [
    /komponen payroll tidak ditemukan/i,
    "payrollComponentId",
    "Komponen ini tidak ada lagi. Pilih komponen lain.",
  ],
  [
    /karyawan tidak ditemukan/i,
    "karyawanId",
    "Karyawan ini tidak ada lagi. Pilih karyawan lain.",
  ],
  [/berlaku sampai/i, "effectiveTo"],
];

const matchOf =
  (table: ReadonlyArray<[RegExp, string, string?]>) => (message: string) => {
    for (const [pattern, field, override] of table) {
      if (pattern.test(message)) {
        return { field, message: override ?? message };
      }
    }

    return null;
  };

export const komponenServerFieldError = matchOf(SERVER_FIELD_ERROR);

export const penetapanServerFieldError = matchOf(SERVER_ASSIGNMENT_ERROR);
