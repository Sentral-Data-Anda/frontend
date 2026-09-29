export const OPNAME_STATUS_LABEL = {
  DRAFT: "Draf",
  COMPLETED: "Selesai dihitung",
  POSTED: "Diposting",
  CANCELLED: "Dibatalkan",
} as const;

export type OpnameStatus = keyof typeof OPNAME_STATUS_LABEL;

export type OpnameRoom = {
  publicId: string;
  code: string;
  name: string;
};

export type Opname = {
  publicId: string;
  code: string;
  opnameDate: string;
  status: OpnameStatus;
  roomId: number | null;
  room: OpnameRoom | null;
  note: string | null;
  completedAt: string | null;
  postedAt: string | null;
  itemCount: number;
  differenceCount: number;
};

export type OpnameItem = {
  publicId: string;
  stockItemId: number;
  systemQuantity: number;
  physicalQuantity: number;
  difference: number;
  note: string | null;
  stockItem: {
    publicId: string;
    code: string;
    name: string;
    unit: { publicId: string; name: string };
  };
};

export type OpnameDetail = Omit<Opname, "itemCount" | "differenceCount"> & {
  completedBy: { name: string } | null;
  postedBy: { name: string } | null;
  isCompletedByViewer: boolean;
  items: OpnameItem[];
};

export type OpnamePayload = {
  opnameDate: string;
  roomId: number | null;
  note: string | null;
  items: {
    stockItemId: number;
    physicalQuantity: number;
    note: string | null;
  }[];
};

export type OpnameAction = "selesai" | "posting" | "batal";

export type StockItemOption = {
  id: number;
  code: string;
  name: string;
  quantity: number;
  unit: { name: string };
  room: { id: number; name: string };
};
