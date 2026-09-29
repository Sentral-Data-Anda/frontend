export const ORDER_STATUS_LABEL = {
  ISSUED: "Dipesan",
  PARTIALLY_RECEIVED: "Diterima sebagian",
  RECEIVED: "Diterima lengkap",
  CANCELLED: "Dibatalkan",
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_LABEL;

export type NamedRef = { publicId: string; code: string; name: string };

export type CurrencyRef = { code: string; name: string; symbol: string };

export type OrderRequestRef = {
  publicId: string;
  code: string;
  purpose: string;
  bapel: { name: string };
  totalEstimatedIDR: string;
};

export type Order = {
  publicId: string;
  code: string;
  status: OrderStatus;
  orderDate: string;
  rateDate: string;
  supplierId: number;
  supplier: NamedRef;
  currencyCode: string;
  currency: CurrencyRef;
  exchangeRate: string;
  rateSource: "AUTO" | "MANUAL";
  totalForeignCurrency: string;
  totalIDR: string;
  closedShort: boolean;
  purchaseRequestId: number;
  purchaseRequest: OrderRequestRef;
  itemCount: number;
};

export type OrderItem = {
  id: number;
  publicId: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: string;
  typeId: number;
  roomId: number;
  unitId: number;
  type: NamedRef;
  room: NamedRef;
  unit: NamedRef;
  receivedQuantity: number;
  remainingQuantity: number;
};

export type OrderDetail = Omit<Order, "itemCount" | "purchaseRequest"> & {
  purchaseRequest: OrderRequestRef & { orderedTotalIDR: string };
  receivedTotalIDR: string;
  items: OrderItem[];
  receipts: { code: string; receivedDate: string }[];
};

export type OrderPayload = {
  purchaseRequestId: number;
  supplierId: number;
  currencyCode: string;
  orderDate: string;
  items: {
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    typeId: number;
    roomId: number;
    unitId: number;
  }[];
};

export type OrderAction = "batal" | "tutup" | "hapus";

export type RequestOption = {
  id: number;
  code: string;
  purpose: string;
  bapel: { id: number; name: string } | null;
  totalEstimatedIDR: string;
  orderedTotalIDR: string;
};

export type RequestDetail = {
  code: string;
  purpose: string;
  items: { name: string; quantity: number; estimatedUnitPrice: string }[];
};

export type SupplierOption = {
  id: number;
  code: string;
  name: string;
  phone: string;
  isActive?: boolean;
};

export type CurrencyOption = CurrencyRef & { isBase: boolean };

export type RatePreview = {
  currencyCode: string;
  rate: string;
  rateDate: string;
  source: "AUTO" | "MANUAL";
};
