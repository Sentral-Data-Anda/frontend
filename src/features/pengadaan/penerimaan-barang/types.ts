import type { ServerAttachment } from "@/types/attachment";

export const ORDER_STATUS_LABEL = {
  ISSUED: "Dipesan",
  PARTIALLY_RECEIVED: "Diterima sebagian",
  RECEIVED: "Diterima lengkap",
  CANCELLED: "Dibatalkan",
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_LABEL;

export const TARGET_LABEL = {
  ASSET: "Barang",
  STOCK: "Barang persediaan",
} as const;

export type ReceiptTarget = keyof typeof TARGET_LABEL;

type Named = { publicId: string; code: string; name: string };

export type Receipt = {
  publicId: string;
  code: string;
  receivedDate: string;
  note: string | null;
  receivedBy: { name: string } | null;
  purchaseOrder: {
    publicId: string;
    code: string;
    status: OrderStatus;
    currencyCode: string;
    exchangeRate: string;
    supplier: Named;
  };
  itemCount: number;
  createdAt: string;
};

export type ReceiptItem = {
  id: number;
  publicId: string;
  quantityReceived: number;
  purchaseOrderItemId: number;
  assetId: number | null;
  stockItemId: number | null;
  purchaseOrderItem: { publicId: string; name: string; quantity: number };
  unitPrice: string;
  unitPriceIDR: string;
  unit: Named;
  asset: Pick<Named, "code" | "name"> | null;
  stockItem: Pick<Named, "code" | "name"> | null;
};

export type ReceiptDetail = Omit<Receipt, "itemCount"> & {
  items: ReceiptItem[];
  attachments: ServerAttachment[];
};

export type ReceiptSaved = { code: string };

export type OrderOption = {
  id: number;
  code: string;
  status: OrderStatus;
  supplier: { id: number; name: string } | null;
  totalIDR: string;
  currencyCode: string;
};

export type OrderLine = {
  id: number;
  name: string;
  description: string;
  quantity: number;
  unitPrice: string;
  unitId: number;
  room: Named;
  unit: Named;
  receivedQuantity: number;
  remainingQuantity: number;
};

export type OrderForReceipt = {
  id: number;
  code: string;
  status: OrderStatus;
  orderDate: string;
  currencyCode: string;
  exchangeRate: string;
  items: OrderLine[];
};

export type StockItemOption = {
  id: number;
  code: string;
  name: string;
  quantity: number;
  unit: { id: number; name: string } | null;
};

export type ReceiptPayloadItem = {
  purchaseOrderItemId: number;
  quantityReceived: number;
  target: ReceiptTarget;
  stockItemId?: number | null;
};
