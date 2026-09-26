export type Gender = "L" | "P";
export type TypeJemaat = "ANGGOTA" | "SIMPATISAN";
export type StatusJemaat = "AKTIF" | "TIDAK_AKTIF";
export type RoleInFamily = "KEPALA_KELUARGA" | "PASANGAN" | "ANAK";

export type StatusPernikahan = "SM" | "BM" | "CM" | "CH";

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
  KEPALA_KELUARGA: "Kepala keluarga",
  PASANGAN: "Pasangan",
  ANAK: "Anak",
};

export type SacramentType =
  "BAPTIS" | "SIDI" | "ATESTASI_MASUK" | "ATESTASI_KELUAR" | "MENINGGAL";

export const SACRAMENT_TYPE_LABEL: Record<SacramentType, string> = {
  BAPTIS: "Baptis",
  SIDI: "Sidi",
  ATESTASI_MASUK: "Atestasi masuk",
  ATESTASI_KELUAR: "Atestasi keluar",
  MENINGGAL: "Meninggal",
};

export const SACRAMENT_ONCE: readonly SacramentType[] = [
  "BAPTIS",
  "SIDI",
  "MENINGGAL",
];

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
