export type KeluargaPayload = {
  name: string;
  provincesCode: string;
  regenciesCode: string;
  districtsCode: string;
  villagesCode: string;
  address: string;
  zoneChurchId: number | null;
  worshipsHere: boolean;
};

export type Keluarga = KeluargaPayload & {
  id: number;
  publicId: string;
  code: string;
  zoneChurch: { id: number; code: string; name: string } | null;
  _count: { members: number };
};
