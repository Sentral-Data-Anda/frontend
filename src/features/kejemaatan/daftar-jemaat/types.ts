import type { SelectOption } from "@/components/common/control";
import {
  STATUS_JEMAAT_LABEL,
  type BloodType,
  type Gender,
  type LastEducation,
  type RoleInFamily,
  type SacramentType,
  type StatusJemaat,
  type StatusPernikahan,
  type TypeJemaat,
} from "@/types/jemaat";

export {
  BLOOD_TYPE_LABEL,
  GENDER_LABEL,
  LAST_EDUCATION_LABEL,
  ROLE_IN_FAMILY_LABEL,
  SACRAMENT_ONCE,
  SACRAMENT_TYPE_LABEL,
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

export const STATUS_JEMAAT_OPTIONS: SelectOption[] = [
  { label: "Semua", value: "" },
  { label: STATUS_JEMAAT_LABEL.AKTIF, value: "AKTIF" },
  { label: STATUS_JEMAAT_LABEL.TIDAK_AKTIF, value: "TIDAK_AKTIF" },
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
