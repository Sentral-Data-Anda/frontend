export type OfferingItem = {
  code: string;
  amount: string;
  period: string | null;
  receivedDate: string;
  typePersembahan: { name: string };
};

export type ChangePasswordPayload = {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type Named = { name: string } | null;

export type MyProfile = {
  name: string;
  gender: "L" | "P";
  birthPlace: string | null;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  statusMarital: "SM" | "BM" | "CM" | "CH" | null;
  address: string | null;
  bloodType: "A" | "B" | "AB" | "O" | null;
  lastEducation: string | null;
  professionId: number | null;
  ethnicGroupId: number | null;
  typeJemaat: "ANGGOTA" | "SIMPATISAN";
  statusJemaat: "AKTIF" | "TIDAK_AKTIF";
  joinedAt: string | null;
  // Kode wilayah dipakai form untuk memilih ulang; namanya untuk ditampilkan.
  provincesCode: string | null;
  regenciesCode: string | null;
  districtsCode: string | null;
  villagesCode: string | null;
  villages: Named;
  districts: Named;
  regencies: Named;
  provinces: Named;
  zoneChurch: Named;
};

/** Badan `PUT /jemaat/saya`: sepuluh field pribadi, tanpa yang keorganisasian. */
export type MyProfilePayload = {
  name: string;
  gender: "L" | "P";
  birthPlace: string;
  birthDate: string | null;
  email: string | null;
  phone: string | null;
  bloodType: string | null;
  lastEducation: string | null;
  professionId: number | null;
  ethnicGroupId: number | null;
  provincesCode: string;
  regenciesCode: string;
  districtsCode: string;
  villagesCode: string;
  address: string;
};
