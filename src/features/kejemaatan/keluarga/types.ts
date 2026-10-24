export const MEMBER_ROLES = ["KEPALA_KELUARGA", "PASANGAN", "ANAK"] as const;

/**
 * Why a membership ended. These name what happened to the household, not where
 * somebody sleeps: moving in with a child does not end a KK, and two households
 * may share one address. Leaving the church is the jemaat's own history.
 */
export const END_REASONS = [
  "MENIKAH",
  "MEMISAHKAN_DIRI",
  "CERAI_HIDUP",
  "MENINGGAL",
  "LAINNYA",
] as const;

export type EndReason = (typeof END_REASONS)[number];

export type EndMembershipPayload = {
  endedAt: string;
  endReason: EndReason;
  endNote: string | null;
  newHeadJemaatCode: string | null;
  alsoEndPartner: boolean | null;
  childPlacements: { jemaatCode: string; keluargaCode: string | null }[] | null;
};

export type MemberRole = (typeof MEMBER_ROLES)[number];

export type KeluargaMemberPayload = {
  jemaatCode: string;
  roleInFamily: MemberRole;
  startedAt: string | null;
};

/** A membership as be-sada returns it: the person is read off the jemaat row. */
export type KeluargaMember = {
  id: string;
  role: MemberRole;
  jemaatCode: string;
  name: string;
  gender: "L" | "P";
  birthDate: string | null;
  startedAt: string | null;
  endedAt: string | null;
  endReason: string | null;
  endNote: string | null;
};

export type KeluargaPayload = {
  provincesCode: string;
  regenciesCode: string;
  districtsCode: string;
  villagesCode: string;
  address: string;
  zoneChurchId: number | null;
  worshipsHere: boolean;
  members: KeluargaMemberPayload[];
};

export type Keluarga = Omit<KeluargaPayload, "members"> & {
  id: number;
  publicId: string;
  code: string;

  /**
   * Read from the live head's jemaat row, never stored. Null while a household
   * has no head — a state the screens show as it is rather than paper over.
   */
  name: string | null;
  zoneChurch: { id: number; code: string; name: string } | null;
  _count: { members: number };
};
