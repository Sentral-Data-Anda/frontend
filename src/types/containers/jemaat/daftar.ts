export interface FormAdditional {
  type: string | null;
  place: string;
  date: string | null;
}

export interface FormDaftarJemaat {
  name: string | undefined;
  gender: string | null;
  birthPlace: string;
  birthDate: string | null;
  email?: string;
  phone?: string;
  bloodType: string | null;
  lastEducation: string | null;

  professionId: string | null;
  etnicGroupId: string | null;

  provincesCode: string | null;
  regenciesCode: string | null;
  districtsCode: string | null;
  villagesCode: string | null;
  address: string;
  zoneChurchId: string | null;

  statusMartial: string | null;
  spouseName: string;
  martialPlace: string;
  martialDate: string | null;

  codeInduk: string;
  additional: FormAdditional[];
}

export interface DaftarJemaat {
  code: string;
  name: string;
  gender: string;
  birthDate: string;
  type: string;
  status: string;
}

export interface DetailJemaat {
  id: number;
  code: string;
  name: string;
  gender: string;
  birthDate: string;
  address: string;
  email: string;
  phone: string;
  status: string;
}
