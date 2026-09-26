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
