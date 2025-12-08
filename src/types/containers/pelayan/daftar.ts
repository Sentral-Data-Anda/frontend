export interface FormDaftarPelayan {
  typePelayan: string | null;
  bapelId: string | null;
  jemaatId?: string | null;
  name?: string;
  phone?: string | number;
  members: string[] | undefined;
  rolePelayan: string[] | undefined;
  isPemusik: boolean;
  musikSkill: string[] | undefined;
  status: string;
}

export interface DaftarPelayan {
  code: string;
  typePelayan: string;
  namePelayan: string;
  genderPelayan: string | null;
  bapel: string;
  role: string[];
  members: string[];
  musikSkill: string[];
  status: boolean;
}
