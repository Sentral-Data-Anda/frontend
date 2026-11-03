type Ref = { id: number; code: string; name: string };

export type RoleJemaatItem = {
  id: number;
  publicId: string;
  name: string;
  startPeriode: string;
  endPeriode: string;
  /**
   * Apakah jabatan ini sedang dipegang hari ini.
   *
   * **Diturunkan backend dari periodenya, bukan disimpan dan bukan dikirim.**
   * Dulu ada kolom `status` yang diisi petugas di samping periodenya, dan
   * keduanya tidak sepakat: penjadwalan membaca boolean itu dan mengabaikan
   * tanggal, routing persetujuan membaca tanggal dan mengabaikan boolean. Yang
   * memutuskan "hari ini" adalah hari gereja di server, bukan jam browser.
   */
  isActive: boolean;
  jemaat: Ref;
  bapel: Ref | null;
};

export type RoleJemaatPayload = {
  name: string;
  startPeriode: string;
  endPeriode: string;
  jemaatId: number;
  /** Null untuk jabatan gerejawi, yang bukan milik komisi mana pun. */
  bapelId: number | null;
};

export const ROLE_STATUS_LABEL: Record<"true" | "false", string> = {
  true: "Sedang menjabat",
  false: "Tidak menjabat",
};
