export const ATTENDANCE_STATUSES = [
  "HADIR",
  "IZIN",
  "SAKIT",
  "CUTI",
  "ALPA",
  "LIBUR",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export type AbsensiKaryawan = {
  id: number;
  publicId: string;
  karyawanId: number;
  karyawan: { publicId: string; code: string; name: string };
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  note: string | null;
};

export type AbsensiKaryawanPayload = {
  karyawanId: number;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  note: string | null;
};

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  HADIR: "Hadir",
  IZIN: "Izin",
  SAKIT: "Sakit",
  CUTI: "Cuti",
  ALPA: "Alpa",
  LIBUR: "Libur",
};

/**
 * Empat tingkat: hadir, absen yang sudah diurus, absen yang tidak, dan hari
 * yang memang tidak bekerja.
 *
 * `ALPA` sengaja BUKAN `due`. `due` satu-satunya varian yang memerahkan
 * teksnya, dan di seluruh aplikasi ia dipakai untuk ditolak, gagal, dan
 * tagihan jatuh tempo — kosakata kegagalan uang. Di layar yang nol pengaruh
 * uang (U-F) merah menjanjikan konsekuensi yang sistemnya tidak sediakan,
 * yaitu kebohongan yang sama yang `note` bagian ini ada untuk melawan.
 */
export const ATTENDANCE_STATUS_VARIANT = {
  HADIR: "success",
  IZIN: "wait",
  SAKIT: "wait",
  CUTI: "wait",
  ALPA: "draft",
  LIBUR: "neutral",
} as const satisfies Record<AttendanceStatus, string>;

// Hanya status yang berarti orangnya bekerja yang menyimpan jam —
// `resolveHours` be-sada memaksa keduanya null untuk sisanya.
export const isPresentStatus = (status: AttendanceStatus) => status === "HADIR";
