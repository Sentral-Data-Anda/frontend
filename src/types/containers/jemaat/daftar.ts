export interface FormDaftarJemaat {
  name: string;
  birthDate: string | null;
  gender: string | null;
  address: string;
  email?: string | null;
  phone?: string | null;
  status: string | null;
}

export interface DaftarJemaat {
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
