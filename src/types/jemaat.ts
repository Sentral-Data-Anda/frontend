export type Gender = "L" | "P";
export type TypeJemaat = "ANGGOTA" | "SIMPATISAN";
export type StatusJemaat = "AKTIF" | "TIDAK_AKTIF";
// Hubungan ke rumah tangga, bukan jabatan di dalamnya: SUAMI berarti
// "laki-laki dari rumah tangga ini" dan ISTRI "perempuan dari rumah tangga
// ini" — bukan "yang menikah dengan satu sama lain". Satu KK boleh berisi
// ISTRI tanpa SUAMI (janda, atau ibu yang bercerai). Siapa kepala keluarganya
// adalah `kepalaKeluarga`, boolean tersendiri. Lihat
// ../../../docs/decisions/specs/2026-11-02-peran-keluarga-dan-pernikahan-design.md.
export type RoleInFamily = "SUAMI" | "ISTRI" | "ANAK";

export type StatusPernikahan = "SM" | "BM" | "CM" | "CH";

// Nilai enum-nya, bukan hanya labelnya: dipakai dua form yang membangun skema
// zod sendiri (form sekretariat dan "Ubah data pribadi" di Akun saya).
export const GENDERS = ["L", "P"] as const;
export const BLOOD_TYPES = ["A", "B", "AB", "O"] as const;
export const LAST_EDUCATION = [
  "TIDAK_SEKOLAH",
  "SD",
  "SMP",
  "SMA",
  "SMK",
  "D1",
  "D2",
  "D3",
  "D4",
  "S1",
  "S2",
  "S3",
] as const;

export const STATUS_JEMAAT_LABEL: Record<StatusJemaat, string> = {
  AKTIF: "Aktif",
  TIDAK_AKTIF: "Tidak aktif",
};

export const TYPE_JEMAAT_LABEL: Record<TypeJemaat, string> = {
  ANGGOTA: "Anggota",
  SIMPATISAN: "Simpatisan",
};

export const GENDER_LABEL: Record<Gender, string> = {
  L: "Laki-laki",
  P: "Perempuan",
};

export const STATUS_PERNIKAHAN_LABEL: Record<StatusPernikahan, string> = {
  SM: "Sudah menikah",
  BM: "Belum menikah",
  CM: "Cerai mati",
  CH: "Cerai hidup",
};

export const ROLE_IN_FAMILY_LABEL: Record<RoleInFamily, string> = {
  SUAMI: "Suami",
  ISTRI: "Istri",
  ANAK: "Anak",
};

// NIKAH dan CERAI tetap ada karena detail jemaat MENAMPILKANNYA, tapi form
// Daftar Jemaat tidak lagi bisa menulis keduanya — pernikahan dicatat dari
// fitur Keluarga. Pilihan jenis riwayat memakai SACRAMENT_WRITABLE.
export type SacramentType =
  | "BAPTIS"
  | "SIDI"
  | "ATESTASI_MASUK"
  | "ATESTASI_KELUAR"
  | "MENINGGAL"
  | "NIKAH"
  | "CERAI";

export const SACRAMENT_TYPE_LABEL: Record<SacramentType, string> = {
  BAPTIS: "Baptis",
  SIDI: "Sidi",
  ATESTASI_MASUK: "Atestasi masuk",
  ATESTASI_KELUAR: "Atestasi keluar",
  MENINGGAL: "Meninggal",
  NIKAH: "Menikah",
  CERAI: "Cerai",
};

export const SACRAMENT_ONCE: readonly SacramentType[] = [
  "BAPTIS",
  "SIDI",
  "MENINGGAL",
];

/**
 * Jenis riwayat yang boleh dipilih di form Daftar Jemaat.
 *
 * NIKAH dan CERAI tidak ada di sini: pernikahan dicatat dari fitur Keluarga,
 * yang tahu rumah tangga mana yang dimaksud. Backend menolaknya, bukan
 * mengabaikannya — petugas yang memilih "Menikah" lalu mendapat 201 akan
 * percaya datanya tersimpan.
 */
export const SACRAMENT_WRITABLE = [
  "BAPTIS",
  "SIDI",
  "ATESTASI_MASUK",
  "ATESTASI_KELUAR",
  "MENINGGAL",
] as const satisfies readonly SacramentType[];

export type WritableSacramentType = (typeof SACRAMENT_WRITABLE)[number];

/** Baris riwayat yang form Daftar Jemaat boleh menulis. */
export const isWritableSacrament = (
  type: SacramentType,
): type is WritableSacramentType =>
  (SACRAMENT_WRITABLE as readonly SacramentType[]).includes(type);

export type BloodType = "A" | "B" | "AB" | "O";
export type LastEducation =
  | "TIDAK_SEKOLAH"
  | "SD"
  | "SMP"
  | "SMA"
  | "SMK"
  | "D1"
  | "D2"
  | "D3"
  | "D4"
  | "S1"
  | "S2"
  | "S3";

export const BLOOD_TYPE_LABEL: Record<BloodType, string> = {
  A: "A",
  B: "B",
  AB: "AB",
  O: "O",
};

export const LAST_EDUCATION_LABEL: Record<LastEducation, string> = {
  TIDAK_SEKOLAH: "Tidak sekolah",
  SD: "SD",
  SMP: "SMP",
  SMA: "SMA",
  SMK: "SMK",
  D1: "D1",
  D2: "D2",
  D3: "D3",
  D4: "D4",
  S1: "S1",
  S2: "S2",
  S3: "S3",
};
