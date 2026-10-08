export type MovementType = "IN" | "OUT" | "ADJUSTMENT";

export type MovementSource =
  | "OPENING_BALANCE"
  | "GOODS_RECEIPT"
  | "DONATION"
  | "USAGE"
  | "TRANSFER"
  | "DISPOSAL"
  | "STOCK_OPNAME"
  | "PURCHASE_RETURN"
  | "MANUAL";

export type Movement = {
  id: number;
  publicId: string;
  stockItemId: number;
  type: MovementType;
  source: MovementSource;
  quantity: number;
  balanceAfter: number;
  /**
   * Rupiah yang ikut pindah, dibekukan saat mutasinya ditulis. Negatif saat
   * stoknya keluar — tandanya yang dibaca posting untuk menentukan sisi mana
   * yang Persediaan.
   *
   * Null untuk mutasi sebelum persediaan perpetual berlaku. Posting
   * menolaknya dengan menyebut nama barangnya, bukan menilainya nol.
   */
  value: string | null;
  movementDate: string;
  note: string | null;
  stockItem: {
    publicId: string;
    code: string;
    name: string;
    unit: { publicId: string; name: string };
    room: { code: string; name: string };
  };
};

export type MovementPayload = {
  stockItemId: number;
  type: "IN" | "OUT";
  source: MovementSource;
  quantity: number;
  movementDate: string;
  note?: string;
  /**
   * Hanya untuk mutasi MASUK, dan server menolaknya untuk yang keluar.
   *
   * Total rupiahnya, bukan harga satuan: itu angka yang dipegang orang —
   * nota toko menyebut harga satu kardus — dan server yang membaginya.
   */
  value?: number;
};

export type StockOption = {
  id: number;
  code: string;
  name: string;
  quantity: number;
  unit: { name: string };
  room: { id: number; name: string };
};

export type MovementValueMode = "required" | "optional" | "none";
