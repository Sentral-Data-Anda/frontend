import { z } from "zod";

import { MENU, createHref, editHref, menuHref } from "@/config/menu";
import type { ListFilterSchema } from "@/hooks/use-list-params";
import { todayJakarta } from "@/lib/date";
import { formatDate, formatDateShort } from "@/lib/format";
import { collapseSpaces } from "@/lib/name";

import {
  WEEKDAY_LABEL,
  WEEKDAY_ORDER,
  type ContractPhase,
  type KontrakKaryawan,
  type KontrakKaryawanPayload,
} from "./types";

export const LIST_PATH = menuHref(MENU.HR, MENU.EMPLOYEE_CONTRACT);

export const CREATE_PATH = createHref(MENU.HR, MENU.EMPLOYEE_CONTRACT);

export const contractEditHref = (code: string) =>
  editHref(MENU.HR, MENU.EMPLOYEE_CONTRACT, code);

export const FILTERS = {
  karyawan: { api: "karyawanId" },
} satisfies ListFilterSchema;

export const NO_VIEW_TITLE = "Anda tidak memiliki akses ke Kontrak Karyawan";

export const NO_VIEW_DESCRIPTION =
  "Hubungi administrator bila Anda memerlukan akses ini.";

export const EMPTY_TITLE = "Belum ada kontrak karyawan";

export const EMPTY_DESCRIPTION =
  "Catat masa kerja dan gaji pokok seorang karyawan di sini.";

export const FILTERED_DESCRIPTION =
  "Tidak ada kontrak yang cocok dengan filter ini.";

export const LOCKED_TITLE = "Data gaji terkunci";

export const LOCKED_DESCRIPTION =
  "Masukkan password akun Anda untuk melihat kontrak beserta gaji pokoknya.";

export const STEP_UP_DESCRIPTION =
  "Masukkan password akun Anda untuk melihat data gaji.";

export const PERIOD_NOTE =
  "Kontrak dengan masa berlaku terbuka harus diberi tanggal akhir sebelum kontrak berikutnya bisa dicatat.";

export const EMPLOYEE_NOTE =
  "Kontrak tidak bisa dipindahkan ke karyawan lain. Hapus kontrak ini lalu catat yang baru.";

export const WEEKLY_DAY_OFF_HINT =
  "Pilih hari yang tidak dikerjakan karyawan ini. Boleh lebih dari satu, dan tidak ada bawaan.";

export const WEEKLY_DAY_OFF_MISSING =
  "Kontrak ini tercatat tanpa libur mingguan, jadi cuti karyawan ini dihitung tanpa hari libur mingguan. Pilih harinya lalu simpan.";

export const OPEN_ENDED = "Sejak";

export const MONEY_MAX = 9_999_999_999_999;

export const MAX_SALARY_DIGITS = 13;

export const MAX_SALARY_FRACTION = 2;

const dayNumbersOf = (days: readonly string[]) =>
  WEEKDAY_ORDER.filter((day) => days.includes(String(day)));

export const weeklyDayOffText = (days: readonly number[]) =>
  days.length === 0
    ? "Belum diisi"
    : WEEKDAY_ORDER.filter((day) => days.includes(day))
        .map((day) => WEEKDAY_LABEL[day])
        .join(", ");

export const dayKeyOf = (value: string) => value.slice(0, 10);

// Masa berlaku terbuka ditulis "Sejak <tanggal>", bukan "<tanggal> – Terbuka":
// lebih pendek di kolom yang memang tidak muat, dan mengatakan hal yang sama.
export const periodText = (contract: KontrakKaryawan) =>
  contract.effectiveTo
    ? `${formatDate(contract.effectiveFrom)} – ${formatDate(contract.effectiveTo)}`
    : `${OPEN_ENDED} ${formatDate(contract.effectiveFrom)}`;

const yearOf = (value: string) => dayKeyOf(value).slice(0, 4);

// Tahun yang sama tidak diulang: kolomnya sempit dan nominal yang terpotong
// terbaca sebagai angka lain.
export const periodShortText = (contract: KontrakKaryawan) => {
  const from = formatDateShort(contract.effectiveFrom);

  if (!contract.effectiveTo) return `${OPEN_ENDED} ${from}`;

  const year = yearOf(contract.effectiveFrom);
  const head =
    yearOf(contract.effectiveTo) === year ? from.replace(` ${year}`, "") : from;

  return `${head} – ${formatDateShort(contract.effectiveTo)}`;
};

export const phaseOf = (
  contract: Pick<KontrakKaryawan, "effectiveFrom" | "effectiveTo">,
  today = todayJakarta(),
): ContractPhase => {
  if (dayKeyOf(contract.effectiveFrom) > today) return "UPCOMING";
  if (contract.effectiveTo && dayKeyOf(contract.effectiveTo) < today) {
    return "ENDED";
  }

  return "ACTIVE";
};

const salaryIssues = (value: string) => {
  if (!value) return ["Isi gaji pokok"];

  const amount = Number(value);

  if (!Number.isFinite(amount)) return ["Gaji pokok tidak valid"];
  if (amount <= 0) return ["Gaji pokok harus lebih dari 0"];
  if (amount > MONEY_MAX) {
    return [`Gaji pokok maksimal ${MAX_SALARY_DIGITS} digit`];
  }
  if ((value.split(".")[1] ?? "").length > MAX_SALARY_FRACTION) {
    return [
      `Gaji pokok maksimal ${MAX_SALARY_FRACTION} angka di belakang koma`,
    ];
  }

  return [];
};

export const kontrakFormSchema = z
  .object({
    karyawanId: z.string(),
    contractType: z.enum(
      ["TETAP", "KONTRAK", "PARUH_WAKTU", "HONORER"],
      "Pilih jenis kontrak",
    ),
    position: z.string(),
    basicSalary: z.string(),
    effectiveFrom: z.string(),
    effectiveTo: z.string(),
    weeklyDayOff: z.array(z.string()),
    note: z.string(),
  })
  .superRefine((values, ctx) => {
    const addIssue = (path: string[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    if (!values.karyawanId) addIssue(["karyawanId"], "Pilih karyawan");

    const position = collapseSpaces(values.position);

    if (!position) addIssue(["position"], "Isi jabatan");
    else if (position.length > 100) {
      addIssue(["position"], "Jabatan maksimal 100 karakter");
    }

    salaryIssues(values.basicSalary).forEach((message) =>
      addIssue(["basicSalary"], message),
    );

    if (!values.effectiveFrom) {
      addIssue(["effectiveFrom"], "Isi tanggal mulai berlaku");
    }

    if (values.effectiveTo && values.effectiveTo < values.effectiveFrom) {
      addIssue(
        ["effectiveTo"],
        "Berlaku sampai tidak boleh sebelum berlaku dari",
      );
    }

    if (dayNumbersOf(values.weeklyDayOff).length === 0) {
      addIssue(["weeklyDayOff"], "Libur mingguan wajib dipilih");
    }

    if (collapseSpaces(values.note).length > 250) {
      addIssue(["note"], "Catatan maksimal 250 karakter");
    }
  });

export type KontrakFormValues = z.infer<typeof kontrakFormSchema>;

export const EMPTY_KONTRAK_FORM: KontrakFormValues = {
  karyawanId: "",
  contractType: "TETAP",
  position: "",
  basicSalary: "",
  effectiveFrom: "",
  effectiveTo: "",
  weeklyDayOff: [],
  note: "",
};

export const toKontrakPayload = (
  values: KontrakFormValues,
): KontrakKaryawanPayload => ({
  karyawanId: Number(values.karyawanId),
  contractType: values.contractType,
  position: collapseSpaces(values.position),
  basicSalary: Number(values.basicSalary),
  effectiveFrom: values.effectiveFrom,
  effectiveTo: values.effectiveTo || null,
  weeklyDayOff: [...dayNumbersOf(values.weeklyDayOff)],
  note: collapseSpaces(values.note) || null,
});

export const toKontrakForm = (
  contract: KontrakKaryawan,
): KontrakFormValues => ({
  karyawanId: String(contract.karyawanId),
  contractType: contract.contractType,
  position: contract.position,
  basicSalary: contract.basicSalary,
  effectiveFrom: dayKeyOf(contract.effectiveFrom),
  effectiveTo: contract.effectiveTo ? dayKeyOf(contract.effectiveTo) : "",
  weeklyDayOff: WEEKDAY_ORDER.filter((day) =>
    contract.weeklyDayOff.includes(day),
  ).map(String),
  note: contract.note ?? "",
});

const SERVER_FIELD_ERROR: ReadonlyArray<[RegExp, string, string?]> = [
  [/sudah memiliki kontrak pada periode/i, "effectiveFrom"],
  [/tidak dapat dipindahkan ke karyawan lain/i, "karyawanId"],
  [
    /karyawan tidak ditemukan/i,
    "karyawanId",
    "Karyawan ini tidak ada lagi. Pilih karyawan lain.",
  ],
  [/libur mingguan/i, "weeklyDayOff"],
  [/gaji pokok/i, "basicSalary"],
  [/berlaku sampai/i, "effectiveTo"],
  [/berlaku dari/i, "effectiveFrom"],
  [/jabatan/i, "position"],
  [/jenis kontrak/i, "contractType"],
  [/catatan/i, "note"],
];

export const kontrakServerFieldError = (message: string) => {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) return { field, message: override ?? message };
  }

  return null;
};
