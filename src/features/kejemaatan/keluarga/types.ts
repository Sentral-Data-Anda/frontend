// Hubungan ke rumah tangga, bukan jabatan di dalamnya. Siapa kepala
// keluarganya adalah `kepalaKeluarga`, boolean tersendiri — dan satu KK boleh
// berisi ISTRI tanpa SUAMI (janda, atau ibu yang bercerai). Lihat
// ../../../../../docs/decisions/specs/2026-11-02-peran-keluarga-dan-pernikahan-design.md.
export const MEMBER_ROLES = ["SUAMI", "ISTRI", "ANAK"] as const;

/**
 * Why a membership ended. These name what happened to the household, not where
 * somebody sleeps: moving in with a child does not end a KK, and two households
 * may share one address. Leaving the church is the jemaat's own history.
 */
// MENINGGAL tidak ada di sini walaupun kolomnya menyimpannya: kematian dicatat
// dari Riwayat Jemaat pada data jemaat yang bersangkutan, dan dari sanalah
// keanggotaan, pernikahan, jabatan kepala keluarga, dan statusMarital
// diperbarui sekaligus. Backend menolaknya di endpoint ini, jadi menawarkannya
// hanya akan membuat petugas menemukan galat setelah menekan simpan.
export const END_REASONS = [
  "MENIKAH",
  "MEMISAHKAN_DIRI",
  "CERAI_HIDUP",
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
  /** Dikosongkan berarti "ikut rantai": SUAMI → ISTRI → anak tertua. */
  kepalaKeluarga?: boolean;
  startedAt: string | null;
};

/**
 * Pernikahan yang membuat SUAMI dan ISTRI jadi pasangan.
 *
 * Wajib setiap kali satu permintaan membuat sebuah KK memegang kedua kursi
 * sekaligus, dan ditolak kalau tidak — tidak ada siapa pun untuk dinikahi.
 * Fitur Keluarga adalah satu-satunya penulis pernikahan di sistem ini, jadi
 * di sinilah satu-satunya tempat tanggalnya bisa diminta.
 */
export type MarriagePayload = {
  date: string;
  place: string | null;
  certificateNumber: string | null;
};

/** A membership as be-sada returns it: the person is read off the jemaat row. */
export type KeluargaMember = {
  id: string;
  role: MemberRole;
  /** Apakah KK terdaftar atas nama orang ini. Lepas dari `role`. */
  isHead: boolean;
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
  zoneChurchId: number | null;
  worshipsHere: boolean;
  members: KeluargaMemberPayload[];
  marriage?: MarriagePayload | null;
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
