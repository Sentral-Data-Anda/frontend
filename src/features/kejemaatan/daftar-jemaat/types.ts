import type { SelectOption } from "@/components/common/control";
import {
  STATUS_JEMAAT_LABEL,
  TYPE_JEMAAT_LABEL,
  type BloodType,
  type Gender,
  type LastEducation,
  type RoleInFamily,
  type SacramentType,
  type StatusJemaat,
  type StatusPernikahan,
  type TypeJemaat,
} from "@/types/jemaat";

import type { MissingFieldKey } from "./completeness";

export {
  BLOOD_TYPE_LABEL,
  GENDER_LABEL,
  LAST_EDUCATION_LABEL,
  ROLE_IN_FAMILY_LABEL,
  SACRAMENT_ONCE,
  SACRAMENT_TYPE_LABEL,
  SACRAMENT_WRITABLE,
  STATUS_JEMAAT_LABEL,
  STATUS_PERNIKAHAN_LABEL,
  TYPE_JEMAAT_LABEL,
  type BloodType,
  type Gender,
  type LastEducation,
  type RoleInFamily,
  type SacramentType,
  type StatusJemaat,
  type StatusPernikahan,
  type TypeJemaat,
} from "@/types/jemaat";

export type JemaatListItem = {
  id: number;
  publicId: string;
  code: string;
  /** Nomor induk gereja. Null selama belum diisi. */
  codeInduk: string | null;
  name: string;
  gender: Gender;
  birthDate: string | null;
  type: TypeJemaat;
  roleInFamily: RoleInFamily | null;
  keluarga: { id: number; code: string; name: string } | null;
  status: StatusJemaat;
  zoneChurch: { id: number; name: string } | null;
  missingFields: MissingFieldKey[];
};

export const STATUS_JEMAAT_OPTIONS: SelectOption[] = [
  { label: "Semua", value: "" },
  { label: STATUS_JEMAAT_LABEL.AKTIF, value: "AKTIF" },
  { label: STATUS_JEMAAT_LABEL.TIDAK_AKTIF, value: "TIDAK_AKTIF" },
];

export const TYPE_JEMAAT_OPTIONS: SelectOption[] = [
  { label: "Semua", value: "" },
  { label: TYPE_JEMAAT_LABEL.ANGGOTA, value: "ANGGOTA" },
  { label: TYPE_JEMAAT_LABEL.SIMPATISAN, value: "SIMPATISAN" },
];

export type JemaatAdditional = {
  /** Ada pada baris tersimpan; tidak ada pada baris baru yang belum disimpan. */
  publicId?: string;
  type: SacramentType;
  date: string;
  certificateNumber: string | null;
  place: string | null;

  // Hanya terisi pada baris NIKAH, dan hanya dibaca: pernikahan dicatat dari
  // fitur Keluarga. Form ini menampilkannya, tidak mengirimkannya balik.
  partnerId?: number | null;
  partnerJemaat?: { code: string; name: string } | null;
  endedAt?: string | null;
  endReason?: "CERAI_HIDUP" | "CERAI_MATI" | null;
  endNote?: string | null;
};

/** Baris riwayat yang form ini boleh menulis. */
export type JemaatAdditionalInput = Pick<
  JemaatAdditional,
  "publicId" | "type" | "date" | "certificateNumber" | "place"
>;

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
  id: number;
  code: string;
  additional: JemaatAdditional[] | null;
  // The wilayah the jemaat's household hands down, already settled by the
  // server. Present means the field on the form is theirs to read, not edit.
  householdZoneChurch: { id: number; name: string } | null;
};
