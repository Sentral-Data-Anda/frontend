import { z } from "zod";

import { MENU, menuHref } from "@/config/menu";
import {
  monthLabel,
  monthOptions,
  monthRange,
  startOfMonth,
  todayJakarta,
} from "@/lib/date";
import { collapseSpaces } from "@/lib/name";

import {
  ATTENDANCE_STATUSES,
  isPresentStatus,
  type AbsensiKaryawan,
  type AbsensiKaryawanPayload,
} from "./types";

export const ABSENSI_LIST_PATH = menuHref(MENU.HR, MENU.ATTENDANCE);

export const NOUN = "absensi karyawan";

export const TITLE = "Attendance";

/**
 * Wajib, bukan gaya (SDM README §2.7, U-F): `KaryawanAttendance` dibaca nol
 * konsumen, dan status bernama `ALPA` di layar yang bisu menyiratkan potongan
 * yang tidak pernah datang.
 */
export const PAYROLL_NOTE =
  "Catatan kehadiran, bukan masukan perhitungan. Penggajian tidak membaca absensi, jadi Alpa tidak mengurangi gaji secara otomatis.";

// `PAYROLL_NOTE` sengaja tidak diulang di sini: ia menetap di bawah subjudul
// daftar, jadi ia terbaca saat ada data maupun saat belum ada.
export const EMPTY_DESCRIPTION =
  "Satu baris per karyawan per hari: hadir atau tidak, dan antara jam berapa.";

// Cuti yang disetujui tidak menulis baris absensi di be-sada, jadi status Cuti
// di sini selalu diketik orang.
export const CUTI_HINT =
  "Cuti yang disetujui tidak otomatis muncul di sini. Baris Cuti dicatat manual.";

export const DATE_HINT =
  "Ketik dd/mm/yyyy. Tanggal yang belum terjadi ditolak; hari ini boleh.";

export const HOURS_HINT = "Kosongkan bila jamnya tidak dicatat.";

export const HOURS_OFF_HINT =
  "Jam hanya dicatat untuk status Hadir, jadi keduanya dikosongkan.";

// Hapus di sini keras, bukan soft: tabelnya tanpa `deletedAt`, dan nisan akan
// menempati `@@unique([karyawanId, date])` lalu menolak baris penggantinya.
export const DELETE_CONFIRM =
  "Baris ini dihapus permanen dan tidak bisa dikembalikan. Hapus hanya untuk hari yang salah ketik; hari yang cuma keliru isinya cukup diubah. Lanjutkan menghapus data absensi karyawan ini?";

export const MONTH_ALL = "semua";

const WALL_CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

const CLOCK_ERROR = (label: string, example: string) =>
  `Format ${label} harus HH:mm, mis. ${example}`;

const isClock = (value: string) => value === "" || WALL_CLOCK.test(value);

export const absensiFormSchema = z
  .object({
    karyawanId: z.string().min(1, "Pilih karyawan yang dicatat kehadirannya"),
    date: z.string().min(1, "Isi tanggal absensi"),
    status: z.enum(ATTENDANCE_STATUSES, {
      error: "Pilih status kehadiran",
    }),
    checkIn: z.string().refine(isClock, CLOCK_ERROR("jam masuk", "08:00")),
    checkOut: z.string().refine(isClock, CLOCK_ERROR("jam pulang", "17:00")),
    note: z.string().max(250, "Catatan maksimal 250 karakter"),
  })
  .superRefine((values, context) => {
    if (values.date && values.date > todayJakarta()) {
      context.addIssue({
        code: "custom",
        path: ["date"],
        message: "Tanggal absensi tidak boleh melewati hari ini",
      });
    }

    // Nol di depan membuat perbandingan string "HH:mm" jadi perbandingan jam —
    // sama dengan yang be-sada dan CHECK `karyawan_attendance_hours_valid` pakai.
    if (
      isPresentStatus(values.status) &&
      WALL_CLOCK.test(values.checkIn) &&
      WALL_CLOCK.test(values.checkOut) &&
      values.checkOut < values.checkIn
    ) {
      context.addIssue({
        code: "custom",
        path: ["checkOut"],
        message: "Jam pulang tidak boleh sebelum jam masuk",
      });
    }
  });

export type AbsensiFormValues = z.infer<typeof absensiFormSchema>;

export const EMPTY_ABSENSI_FORM: AbsensiFormValues = {
  karyawanId: "",
  date: "",
  status: "HADIR",
  checkIn: "",
  checkOut: "",
  note: "",
};

export const toAbsensiPayload = (
  values: AbsensiFormValues,
): AbsensiKaryawanPayload => {
  const isPresent = isPresentStatus(values.status);
  const note = collapseSpaces(values.note);

  return {
    karyawanId: Number(values.karyawanId),
    date: values.date,
    checkIn: isPresent ? values.checkIn || null : null,
    checkOut: isPresent ? values.checkOut || null : null,
    status: values.status,
    note: note || null,
  };
};

export const toAbsensiForm = (row: AbsensiKaryawan): AbsensiFormValues => ({
  karyawanId: String(row.karyawanId),
  date: row.date.slice(0, 10),
  status: row.status,
  checkIn: row.checkIn ?? "",
  checkOut: row.checkOut ?? "",
  note: row.note ?? "",
});

// Di sini null memang berarti tidak ada datanya, bukan "tanpa batas".
export const clockTextOf = (value: string | null) => value ?? "—";

export function hoursTextOf(
  row: Pick<AbsensiKaryawan, "checkIn" | "checkOut">,
) {
  if (row.checkIn === null && row.checkOut === null) return "Tanpa jam";
  if (row.checkOut === null) return `Masuk ${row.checkIn}`;
  if (row.checkIn === null) return `Pulang ${row.checkOut}`;

  return `${row.checkIn}–${row.checkOut}`;
}

/**
 * Bulan berjalan ke belakang saja.
 *
 * `monthOptions` mulai dari bulan DEPAN, dan server menolak tanggal yang belum
 * terjadi — jadi bulan di masa depan adalah pilihan yang tidak akan pernah
 * memuat satu baris pun, duduk tepat di tempat orang mencari "bulan lalu".
 */
export function monthFilterOptions(today: string = todayJakarta()) {
  const current = startOfMonth(today).slice(0, 7);

  return [
    { value: "", label: "Bulan ini" },
    { value: MONTH_ALL, label: "Semua bulan" },
    ...monthOptions(today).filter((option) => option.value < current),
  ];
}

/**
 * Subjudul menyebut periodenya, bukan hanya angkanya.
 *
 * Filter bulan bawaan memang menyaring, tapi `useListParams` membaca nilai
 * kosong sebagai "tanpa filter" — jadi tanpa label ini "12 catatan absensi"
 * terbaca sebagai seluruh isi tabel, padahal ia satu bulan.
 */
export function subtitleOf(
  totalData: number | undefined,
  filters: Record<string, string>,
  today: string = todayJakarta(),
) {
  if (totalData === undefined) return undefined;

  const bulan = filters.bulan ?? "";
  const period =
    bulan === MONTH_ALL
      ? "semua bulan"
      : monthLabel(bulan || startOfMonth(today).slice(0, 7));

  return `${totalData} catatan absensi · ${period}`;
}

/**
 * Rentang tanggal adalah filter terpenting layar ini, jadi bawaannya bulan ini
 * — tanpa itu daftar harian membuka setahun catatan sekaligus.
 */
export function toAbsensiApiFilters(
  filters: Record<string, string>,
  today: string = todayJakarta(),
) {
  const bulan = filters.bulan ?? "";
  const range =
    bulan === MONTH_ALL
      ? { startDate: "", endDate: "" }
      : monthRange(bulan || startOfMonth(today).slice(0, 7));

  return { karyawanId: filters.karyawan ?? "", ...range };
}

const SERVER_FIELD_ERROR: ReadonlyArray<
  [RegExp, keyof AbsensiFormValues, string?]
> = [
  [
    /sudah memiliki absensi pada tanggal tersebut/i,
    "date",
    "Karyawan ini sudah punya absensi di tanggal tersebut. Ubah baris yang sudah ada.",
  ],
  [/tanggal absensi tidak boleh melewati hari ini/i, "date"],
  [/karyawan tidak ditemukan/i, "karyawanId", "Karyawan ini tidak ditemukan."],
  [/karyawan tidak valid|lengkapi karyawan/i, "karyawanId"],
  [/jam pulang/i, "checkOut"],
  [/jam masuk/i, "checkIn"],
  [/catatan/i, "note"],
  [/status kehadiran/i, "status"],
  [/tanggal/i, "date"],
];

export function serverFieldError(
  message: string,
): { field: keyof AbsensiFormValues; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) return { field, message: override ?? message };
  }

  return null;
}
