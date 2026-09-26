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

export type IncompleteReport = {
  total: number;
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
