type Ref = { publicId: string; code: string; name: string };

export type StockItem = {
  id: number;
  publicId: string;
  code: string;
  name: string;
  description: string | null;
  quantity: number;
  reorderPoint: number | null;
  lastUnitPrice: string | null;
  /**
   * Harga rata-rata bergerak, dan satu-satunya harga yang menilai stok keluar.
   *
   * Beda dari `lastUnitPrice` dan itu yang penting: nilai persediaan di Neraca
   * adalah jumlah x harga INI, bukan x harga beli terakhir.
   */
  avgUnitPrice: string | null;
  typeId: number;
  bapelId: number;
  roomId: number;
  unitId: number;
  type: Ref;
  bapel: Ref;
  room: Ref;
  unit: Ref;
};

export type StockItemPayload = {
  name: string;
  description?: string;
  typeId: number;
  bapelId: number;
  roomId: number;
  unitId: number;
  reorderPoint: number | null;
  openingQuantity?: number;
};

export type StockStatus = "HABIS" | "MENIPIS" | "TERSEDIA";

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

export type ItemMovement = {
  publicId: string;
  type: MovementType;
  source: MovementSource;
  quantity: number;
  balanceAfter: number;
  value: string | null;
  movementDate: string;
};
