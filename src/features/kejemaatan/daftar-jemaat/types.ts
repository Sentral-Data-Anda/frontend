import type { FilterChip } from "@/components/common/list/filter-chips";

export type JemaatListItem = {
  code: string;
  name: string;
  gender: Gender;
  birthDate: string | null;
  type: TypeJemaat;
  roleInFamily: RoleInFamily | null;
  keluarga: { id: number; code: string; name: string } | null;
  status: StatusJemaat;
  zoneChurch: { id: number; name: string } | null;
};

export type Gender = "L" | "P";
export type TypeJemaat = "ANGGOTA" | "SIMPATISAN";
export type StatusJemaat = "AKTIF" | "TIDAK_AKTIF";
export type RoleInFamily = "KEPALA_KELUARGA" | "PASANGAN" | "ANAK";

export const STATUS_JEMAAT_LABEL: Record<StatusJemaat, string> = {
  AKTIF: "Aktif",
  TIDAK_AKTIF: "Tidak aktif",
};

export const TYPE_JEMAAT_LABEL: Record<TypeJemaat, string> = {
  ANGGOTA: "Anggota",
  SIMPATISAN: "Simpatisan",
};

export const ROLE_IN_FAMILY_LABEL: Record<RoleInFamily, string> = {
  KEPALA_KELUARGA: "Kepala keluarga",
  PASANGAN: "Pasangan",
  ANAK: "Anak",
};

export const STATUS_JEMAAT_CHIPS: FilterChip[] = [
  { label: "Semua", value: "" },
  { label: STATUS_JEMAAT_LABEL.AKTIF, value: "AKTIF" },
  { label: STATUS_JEMAAT_LABEL.TIDAK_AKTIF, value: "TIDAK_AKTIF" },
];

export type BloodType = "A" | "B" | "AB" | "O";
export type StatusPernikahan = "SM" | "BM" | "CM" | "CH";
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

export type SacramentType =
  "BAPTIS" | "SIDI" | "ATESTASI_MASUK" | "ATESTASI_KELUAR" | "MENINGGAL";

export const GENDER_LABEL: Record<Gender, string> = {
  L: "Laki-laki",
  P: "Perempuan",
};

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

export const STATUS_PERNIKAHAN_LABEL: Record<StatusPernikahan, string> = {
  SM: "Sudah menikah",
  BM: "Belum menikah",
  CM: "Cerai mati",
  CH: "Cerai hidup",
};

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

export type JemaatAdditional = {
  type: SacramentType;
  date: string;
  certificateNumber: string | null;
  place: string | null;
};

export type JemaatPayload = {
  name: string;
  gender: Gender;
  birthPlace: string;
  birthDate: string | null;
  email: string | null;
  phone: string | null;
  bloodType: BloodType | null;
  lastEducation: LastEducation | null;
  statusMarital: StatusPernikahan | null;
  professionId: number | null;
  ethnicGroupId: number | null;
  zoneChurchId: number | null;
  codeInduk: string | null;
  provincesCode: string;
  regenciesCode: string;
  districtsCode: string;
  villagesCode: string;
  address: string;
  typeJemaat: TypeJemaat;
  statusJemaat: StatusJemaat;
  keluargaId: number | null;
  roleInFamily: RoleInFamily | null;
  keluargaAsalId: number | null;
  joinedAt: string | null;
  additional?: JemaatAdditional[];
};

export type JemaatDetail = Omit<JemaatPayload, "additional"> & {
  code: string;
  additional: JemaatAdditional[] | null;
};

export type DdlOption = {
  id: number;
  code: string;
  name: string;
};
