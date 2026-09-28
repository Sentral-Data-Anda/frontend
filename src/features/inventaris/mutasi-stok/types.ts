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
};

export type StockOption = {
  id: number;
  code: string;
  name: string;
  quantity: number;
  unit: { name: string };
  room: { id: number; name: string };
};
