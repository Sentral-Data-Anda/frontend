import { z } from "zod";

import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
} from "@/config/menu";
import { todayJakarta, toDateInput } from "@/lib/date";
import { formatAmount } from "@/lib/format";

import type {
  Loan,
  LoanDirection,
  LoanInterestMode,
  LoanPayload,
  LoanStatus,
} from "./types";

export const TITLE = "Pinjaman";

export const PINJAMAN_PATH = menuHref(MENU.FINANCE, MENU.LOAN);

export const PINJAMAN_CREATE_PATH = createHref(MENU.FINANCE, MENU.LOAN);

export const pinjamanHref = (publicId: string) =>
  detailHref(MENU.FINANCE, MENU.LOAN, publicId);

export const pinjamanEditHref = (publicId: string) =>
  editHref(MENU.FINANCE, MENU.LOAN, publicId);

export const money = (value: string | undefined) => formatAmount(value ?? 0);

export const DIRECTION_LABEL: Record<LoanDirection, string> = {
  BORROWED: "Gereja meminjam",
  LENT: "Gereja meminjamkan",
};

export const STATUS_LABEL: Record<LoanStatus, string> = {
  ACTIVE: "Berjalan",
  SETTLED: "Lunas",
  CANCELLED: "Dibatalkan",
};

export const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "ACTIVE", label: "Berjalan" },
  { value: "SETTLED", label: "Lunas" },
  { value: "CANCELLED", label: "Dibatalkan" },
] as const;

/**
 * Dasar bunga, dengan periodenya tertulis di labelnya.
 *
 * "Bunga (%)" saja tidak menentukan apa pun: atas 10.000.000 selama 12 bulan,
 * 5% bernilai 500.000, 6.000.000, atau 3.250.000 tergantung dasarnya. Label
 * yang menyebut periodenya membuat satu kontrol ini cukup, tanpa dropdown
 * kedua yang harus dicocokkan.
 */
export const INTEREST_MODE_OPTIONS = [
  { value: "NONE", label: "Tanpa bunga" },
  { value: "FLAT_TOTAL", label: "% dari pokok, sekali untuk seluruh masa" },
  { value: "FLAT_MONTHLY", label: "% dari pokok, per bulan" },
  { value: "DECLINING", label: "% per bulan atas sisa pokok (menurun)" },
] as const;

export const INTEREST_MODE_LABEL = Object.fromEntries(
  INTEREST_MODE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<LoanInterestMode, string>;

/**
 * Dasar bunga berikut persennya, sebagai satu kalimat.
 *
 * Label pilihannya sudah diawali "%", jadi menempelkan "5% · " di depannya
 * menghasilkan "5% · % dari pokok". Persennya menggantikan tanda itu.
 */
export const interestLabelOf = (
  mode: LoanInterestMode,
  percent: string | null,
) =>
  mode === "NONE" || percent === null
    ? INTEREST_MODE_LABEL.NONE
    : `${percent}${INTEREST_MODE_LABEL[mode].replace(/^%/, "")}`;

export const MAX_TERM_MONTHS = 600;

const MAX_PERCENT = 100;

export const pinjamanFormSchema = z
  .object({
    direction: z.enum(["BORROWED", "LENT"], {
      error: "Mohon Lengkapi Arah Pinjaman",
    }),
    counterpartyName: z
      .string()
      .trim()
      .min(1, { error: "Mohon Lengkapi Nama Pihak" })
      .max(150, { error: "Nama Pihak tidak boleh lebih dari 150 karakter" }),
    jemaatId: z.string(),
    principal: z
      .string()
      .min(1, { error: "Mohon Lengkapi Pokok Pinjaman" })
      .refine((value) => Number(value) > 0, {
        error: "Pokok Pinjaman harus di atas 0",
      }),
    agreementDate: z.string().min(1, {
      error: "Mohon Lengkapi Tanggal Kesepakatan",
    }),
    termMonths: z
      .string()
      .min(1, { error: "Mohon Lengkapi Jangka Waktu" })
      .refine(
        (value) =>
          Number.isInteger(Number(value)) &&
          Number(value) >= 1 &&
          Number(value) <= MAX_TERM_MONTHS,
        { error: `Jangka Waktu harus antara 1 dan ${MAX_TERM_MONTHS} bulan` },
      ),
    interestMode: z.enum(["NONE", "FLAT_TOTAL", "FLAT_MONTHLY", "DECLINING"]),
    interestPercent: z.string(),
    notes: z.string().max(500, {
      error: "Catatan tidak boleh lebih dari 500 karakter",
    }),
  })
  .refine(
    (value) =>
      value.interestMode === "NONE" ? true : value.interestPercent !== "",
    { error: "Mohon Lengkapi Persentase Bunga", path: ["interestPercent"] },
  )
  .refine(
    (value) =>
      value.interestMode === "NONE" ||
      value.interestPercent === "" ||
      (Number(value.interestPercent) > 0 &&
        Number(value.interestPercent) <= MAX_PERCENT),
    {
      error: `Bunga harus di atas 0 dan tidak lebih dari ${MAX_PERCENT}`,
      path: ["interestPercent"],
    },
  );

export type PinjamanFormValues = z.infer<typeof pinjamanFormSchema>;

export const EMPTY_TITLE = "Belum ada pinjaman";

export const EMPTY_DESCRIPTION =
  "Catat pinjaman yang diterima maupun diberikan gereja. Uangnya tetap dicatat lewat Kas Masuk dan Kas Keluar, dan barisnya menunjuk pinjaman ini.";

export const NO_VIEW =
  "Pinjaman hanya terbuka untuk peran yang memegang pembukuan. Hubungi administrator bila Anda memang seharusnya memegangnya.";

export const emptyPinjamanForm = (
  today = todayJakarta(),
): PinjamanFormValues => ({
  direction: "BORROWED",
  counterpartyName: "",
  jemaatId: "",
  principal: "",
  agreementDate: today,
  termMonths: "12",
  interestMode: "NONE",
  interestPercent: "",
  notes: "",
});

export const toPinjamanForm = (loan: Loan): PinjamanFormValues => ({
  direction: loan.direction,
  counterpartyName: loan.counterpartyName,
  jemaatId: loan.jemaatId ? String(loan.jemaatId) : "",
  principal: loan.principal,
  agreementDate: toDateInput(loan.agreementDate),
  termMonths: String(loan.termMonths),
  interestMode: loan.interestMode,
  interestPercent: loan.interestPercent ?? "",
  notes: loan.notes ?? "",
});

export const toPinjamanPayload = (values: PinjamanFormValues): LoanPayload => ({
  direction: values.direction,
  counterpartyName: values.counterpartyName.trim(),
  jemaatId: values.jemaatId ? Number(values.jemaatId) : null,
  principal: values.principal,
  agreementDate: values.agreementDate,
  termMonths: Number(values.termMonths),
  interestMode: values.interestMode,
  // Dikosongkan bersama dasarnya: persen tanpa dasar ditolak server, dan
  // meninggalkannya terisi saat dasarnya NONE adalah cara paling mudah
  // mengirim bentuk yang ditolak itu.
  interestPercent:
    values.interestMode === "NONE" ? null : Number(values.interestPercent),
  notes: values.notes.trim() || null,
});

/**
 * Bunga yang akan dihitung server, ditampilkan lebih dulu di layar.
 *
 * Rumusnya sengaja sama persis dengan `loanRules.ts` di be-sada, dan server
 * tetap yang menentukan: angka di sini hanya supaya bendahara melihat
 * akibat pilihannya sebelum menyimpan. Keduanya diuji dengan contoh yang
 * sama — 10.000.000, 5%, 12 bulan — sehingga perbedaan akan ketahuan.
 */
export const previewInterest = (values: {
  principal: string;
  termMonths: string;
  interestMode: LoanInterestMode;
  interestPercent: string;
}): number => {
  const principal = Number(values.principal);
  const months = Number(values.termMonths);
  const percent = Number(values.interestPercent);

  if (
    values.interestMode === "NONE" ||
    !Number.isFinite(principal) ||
    !Number.isFinite(months) ||
    !Number.isFinite(percent) ||
    principal <= 0 ||
    months <= 0 ||
    percent <= 0
  ) {
    return 0;
  }

  const rate = percent / 100;

  if (values.interestMode === "FLAT_TOTAL") return principal * rate;
  if (values.interestMode === "FLAT_MONTHLY") return principal * rate * months;

  return (principal * rate * (months + 1)) / 2;
};
