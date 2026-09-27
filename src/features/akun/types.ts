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

export type StepUpGrant = { expiresAt: string };

type Named = { name: string } | null;

export type MyProfile = {
  gender: "L" | "P";
  birthPlace: string | null;
  birthDate: string | null;
  phone: string | null;
  email: string | null;
  statusMarital: "SM" | "BM" | "CM" | "CH" | null;
  address: string | null;
  typeJemaat: "ANGGOTA" | "SIMPATISAN";
  statusJemaat: "AKTIF" | "TIDAK_AKTIF";
  joinedAt: string | null;
  villages: Named;
  districts: Named;
  regencies: Named;
  provinces: Named;
  zoneChurch: Named;
};
