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
  movementDate: string;
};
