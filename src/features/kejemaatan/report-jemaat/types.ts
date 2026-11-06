import type {
  BloodType,
  Gender,
  LastEducation,
  TypeJemaat,
} from "@/types/jemaat";

export type TypeGenderRow = {
  typeJemaat: TypeJemaat;
  ALL: number;
  L: number;
  P: number;
};

export type AgeGroup = "<12" | "12-17" | "18-30" | "30-50" | ">50";

export type AgeRow = { Umur: AgeGroup; Count: number };
export type EthnicRow = { Suku: string; Count: number };
export type ProfessionRow = { Profession: string; Count: number };
export type BloodTypeRow = { bloodType: BloodType; Count: number };
export type LastEducationRow = { lastEducation: LastEducation; Count: number };

/**
 * Jumlah jemaat yang satu fieldnya masih kosong, per field.
 *
 * Sembilan yang pertama adalah field yang menolak simpan di form jemaat
 * (lihat `missingFieldsOf` di be-sada); tiga terakhir boleh kosong. Urutannya
 * di sini urutan yang dibaca kartu Kelengkapan data: wajib dulu, opsional
 * belakangan.
 *
 * Semua angka berbagi penyebut `total`, termasuk tiga field yang sebenarnya
 * hanya ditanyakan ke ANGGOTA (`statusMarital`, `ethnicGroupId`, `codeInduk`).
 * Simpatisan tidak pernah bisa kurang di ketiganya, jadi persennya memang
 * terbaca rendah terhadap seluruh jemaat.
 */
export type IncompleteReport = {
  total: number;
  birthPlace: number;
  address: number;
  provincesCode: number;
  regenciesCode: number;
  districtsCode: number;
  villagesCode: number;
  statusMarital: number;
  ethnicGroupId: number;
  codeInduk: number;
  birthDate: number;
  lastEducation: number;
  profession: number;
};

export type BirthdayRow = {
  name: string;
  gender: Gender;
  birthDate: string;
  umur: number;
};

// be-sada memasukkan umur 30 ke "18-30", jadi "30-50" sebenarnya 31–50.
export const AGE_GROUP_LABEL: Record<AgeGroup, string> = {
  "<12": "Di bawah 12 tahun",
  "12-17": "12–17 tahun",
  "18-30": "18–30 tahun",
  "30-50": "31–50 tahun",
  ">50": "Di atas 50 tahun",
};

export const AGE_GROUPS = Object.keys(AGE_GROUP_LABEL) as AgeGroup[];

export type Share = { key: string; label: string; count: number };

export type ZoneRow = {
  zoneChurchId: number | null;
  code: string | null;
  name: string | null;
  isActive: boolean | null;
  anggota: number;
  simpatisan: number;
  keluarga: number;
};
