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

// Empat tingkat, bukan enam warna: hadir, absen yang sudah diurus, absen yang
// tidak, dan hari yang memang tidak bekerja.
export const ATTENDANCE_STATUS_VARIANT = {
  HADIR: "success",
  IZIN: "wait",
  SAKIT: "draft",
  CUTI: "wait",
  ALPA: "due",
  LIBUR: "neutral",
} as const satisfies Record<AttendanceStatus, string>;

// Hanya status yang berarti orangnya bekerja yang menyimpan jam —
// `resolveHours` be-sada memaksa keduanya null untuk sisanya.
export const isPresentStatus = (status: AttendanceStatus) => status === "HADIR";
