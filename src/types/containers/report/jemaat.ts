export interface ReportCountJemaat {
  typeJemaat: string;
  ALL: number;
  L: number;
  P: number;
}

export interface ReportBirthMonth {
  name: string;
  gender: string;
  birthDate: string;
  umur: number;
}

export interface ReportBloodType {
  bloodType: string;
  Count: number;
}

export interface ReportRangeAge {
  Umur: string;
  Count: number;
}

export interface ReportEtnicGroup {
  Suku: string;
  Count: number;
}

export interface ReportProfession {
  Profession: string;
  Count: number;
}
