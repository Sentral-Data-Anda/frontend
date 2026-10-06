import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import { addDays } from "@/lib/date";
import { formatDate, formatDateShort, formatDays } from "@/lib/format";

import type {
  Cuti,
  CutiPayload,
  CutiStatus,
  HolidayDay,
  RemainingQuota,
} from "./types";

export const CUTI_LIST_PATH = menuHref(MENU.SDM, MENU.CUTI);

export const MAX_REASON = 250;

export const ALL_STATUS = "";

export const STATUS_TABS: readonly { value: string; label: string }[] = [
  { value: ALL_STATUS, label: "Semua" },
  { value: "PENDING", label: "Menunggu" },
  { value: "APPROVED", label: "Disetujui" },
  { value: "REJECTED", label: "Ditolak" },
  { value: "CANCELLED", label: "Dibatalkan" },
];

export const EMPTY_TITLE = "Belum ada pengajuan cuti";

export const EMPTY_DESCRIPTION =
  "Pengajuan cuti dicatat di sini, lalu dikirim untuk ditandatangani. Tambahkan pengajuan pertama setelah tipe cuti dan jatahnya diisi.";

/**
 * Dikatakan ke setiap petugas, bukan hanya ke karyawan yang kena: be-sada
 * membaca libur mingguan dari kontrak yang berlaku di tanggal mulai dan
 * memperlakukan "belum punya kontrak" sama dengan "tidak punya libur
 * mingguan". Cuti sengaja tidak menuntut kontrak seperti penggajian, jadi yang
 * benar adalah mengatakannya, bukan memblokir pengajuannya.
 */
export const WEEKLY_OFF_NOTE =
  "Libur mingguan karyawan diambil dari kontrak yang berlaku di tanggal mulai, dan dikurangi oleh server saat disimpan. Karyawan yang belum punya kontrak berlaku dihitung penuh hari kalender.";

export const QUOTA_PENDING_NOTE =
  "Terpakai sudah termasuk pengajuan yang masih menunggu. Pengajuan yang ditolak atau dibatalkan mengembalikan harinya.";

export const PAID_NOTE =
  "Penggajian tidak membaca cuti, jadi penanda Dibayar pada tipe cuti tidak mengubah gaji.";

export const cutiFormSchema = z
  .object({
    karyawanId: z.string().min(1, "Pilih karyawan yang mengajukan cuti"),
    leaveTypeId: z.string().min(1, "Pilih tipe cuti"),
    startDate: z.string().min(1, "Isi tanggal mulai cuti"),
    endDate: z.string().min(1, "Isi tanggal selesai cuti"),
    length: z.enum(["penuh", "setengah"]),
    reason: z
      .string()
      .trim()
      .min(1, "Tulis alasan cuti")
      .max(MAX_REASON, `Alasan cuti maksimal ${MAX_REASON} karakter`),
  })
  .superRefine((values, context) => {
    if (values.startDate && values.endDate && values.endDate < values.startDate)
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Tanggal selesai tidak boleh sebelum tanggal mulai",
      });

    if (values.length === "setengah" && values.startDate !== values.endDate)
      context.addIssue({
        code: "custom",
        path: ["length"],
        message: "Setengah hari hanya untuk cuti satu hari",
      });
  });

export type CutiFormValues = z.infer<typeof cutiFormSchema>;

export const EMPTY_CUTI_FORM: CutiFormValues = {
  karyawanId: "",
  leaveTypeId: "",
  startDate: "",
  endDate: "",
  length: "penuh",
  reason: "",
};

export const toCutiPayload = (values: CutiFormValues): CutiPayload => ({
  karyawanId: Number(values.karyawanId),
  leaveTypeId: Number(values.leaveTypeId),
  startDate: values.startDate,
  endDate: values.endDate,
  halfDay: values.length === "setengah",
  reason: values.reason.trim(),
});

export const toCutiForm = (row: Cuti): CutiFormValues => ({
  karyawanId: String(row.karyawanId),
  leaveTypeId: String(row.leaveTypeId),
  startDate: row.startDate.slice(0, 10),
  endDate: row.endDate.slice(0, 10),
  length: Number(row.totalDays) % 1 === 0.5 ? "setengah" : "penuh",
  reason: row.reason,
});

export const rangeTextOf = (startDate: string, endDate: string) => {
  const start = startDate.slice(0, 10);
  const end = endDate.slice(0, 10);

  if (start === end) return formatDate(start);

  return `${formatDate(start)} – ${formatDate(end)}`;
};

export const calendarDaysOf = (startDate: string, endDate: string) => {
  if (!startDate || !endDate || endDate < startDate) return 0;

  let days = 1;
  for (let at = startDate; at < endDate; at = addDays(at, 1)) days += 1;

  return days;
};

export const holidaysWithin = (
  holidays: readonly HolidayDay[],
  startDate: string,
  endDate: string,
) => holidays.filter((day) => day.date >= startDate && day.date <= endDate);

/**
 * Batas atas, bukan hitungan kedua. Libur mingguan karyawan hidup di
 * `kontrak_karyawan`, yang dijaga menu lain plus `StepUp`, jadi layar cuti
 * tidak bisa membacanya dan tidak boleh berpura-pura tahu totalnya.
 */
export const maxWorkingDaysOf = (
  startDate: string,
  endDate: string,
  holidays: readonly HolidayDay[],
  isHalfDay: boolean,
) => {
  const days =
    calendarDaysOf(startDate, endDate) -
    holidaysWithin(holidays, startDate, endDate).length;

  return Math.max(0, isHalfDay ? days - 0.5 : days);
};

export const holidayNamesOf = (
  holidays: readonly HolidayDay[],
  startDate: string,
  endDate: string,
) =>
  holidaysWithin(holidays, startDate, endDate)
    .map((day) => `${day.name} (${formatDateShort(day.date)})`)
    .join(", ");

export const ALL_HOLIDAY_MESSAGE =
  "Seluruh rentang ini hari libur, jadi cutinya nol hari. Pilih rentang yang memuat hari kerja.";

export const isAllHoliday = (
  startDate: string,
  endDate: string,
  holidays: readonly HolidayDay[],
) =>
  calendarDaysOf(startDate, endDate) > 0 &&
  maxWorkingDaysOf(startDate, endDate, holidays, false) === 0;

/** `null` = tanpa batas, bukan data hilang (brief §4.2: jangan "—"). */
export const quotaTextOf = (quota: RemainingQuota) =>
  quota.remaining === null ? "Tanpa batas" : formatDays(quota.remaining);

export const quotaSpentTextOf = (quota: RemainingQuota) =>
  quota.maxDaysPerYear === null
    ? `Sudah diambil ${formatDays(quota.taken)} (${quota.year})`
    : `Sudah diambil ${formatDays(quota.taken)} dari jatah ${formatDays(quota.maxDaysPerYear)} (${quota.year})`;

export const isUnderApproval = (row: Cuti) =>
  row.approval?.status === "PENDING";

/**
 * Ubah, hapus, dan ajukan berbagi satu syarat di be-sada: masih PENDING dan
 * belum ada baris persetujuan terbuka. Satu predikat, bukan tiga nama.
 */
export const isEditable = (row: Cuti) =>
  row.status === "PENDING" && !isUnderApproval(row);

export const isCancellable = (row: Cuti, today: string) =>
  row.status === "APPROVED" && row.startDate.slice(0, 10) > today;

export const statusTextOf = (row: Cuti, label: Record<CutiStatus, string>) =>
  isUnderApproval(row) ? "Sedang ditandatangani" : label[row.status];

export const pendingStepTextOf = (row: Cuti) => {
  const approval = row.approval;
  if (!approval || approval.status !== "PENDING") return undefined;

  return `Menunggu persetujuan (${approval.currentOrder} dari ${approval.steps.length})`;
};

/**
 * Urutannya aturan, bukan selera: pesan tumpang-tindih be-sada diawali kata
 * "Karyawan", jadi pola karyawan yang longgar akan membajaknya ke field yang
 * salah. Brief §4.3 menuntut ia mendarat di `startDate`.
 */
const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof CutiFormValues, string?]
> = [
  [/sudah memiliki pengajuan cuti|leave_request_no_overlap/i, "startDate"],
  [/sisa jatah cuti tidak cukup/i, "startDate"],
  [/tidak memuat satu hari kerja/i, "startDate"],
  [/tanggal selesai/i, "endDate"],
  [/tanggal mulai/i, "startDate"],
  [/setengah hari/i, "length"],
  [/alasan/i, "reason"],
  [
    /tipe cuti tidak ditemukan|tipe cuti ini sudah tidak aktif|lengkapi tipe cuti|tipe cuti tidak valid/i,
    "leaveTypeId",
  ],
  [
    /karyawan tidak ditemukan|karyawan ini sudah tidak aktif|lengkapi karyawan|karyawan tidak valid/i,
    "karyawanId",
  ],
];

export function serverFieldError(
  message: string,
): { field: keyof CutiFormValues; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) return { field, message: override ?? message };
  }

  return null;
}

/**
 * Alasan penolakan datang dari kolom `rejectedReason` yang mesin persetujuan
 * tulis ke baris cuti, bukan dari `approval` yang be-sada belum kirim. Ia
 * dirender penuh dan tidak pernah dipotong (§0.3 no. 4, pola K11).
 */
export const rejectedTextOf = (row: Cuti) => {
  if (row.status !== "REJECTED") return null;

  return row.rejectedReason ?? REJECTED_WITHOUT_NOTE;
};

export const REJECTED_TITLE = "Pengajuan cuti ini ditolak.";

export const REJECTED_WITHOUT_NOTE =
  "Penolakan ini tidak disertai catatan. Tanyakan ke penanda tangannya.";
