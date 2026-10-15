export const RETURN_STATUS_LABEL = {
  DRAFT: "Draf",
  SUBMITTED: "Menunggu persetujuan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
} as const;

export type ReturnStatus = keyof typeof RETURN_STATUS_LABEL;

type Named = { publicId: string; code: string; name: string };

export type ReturnItem = {
  publicId: string;
  goodsReceiptItemId: number;
  quantity: number;
  reason: string | null;
  goodsReceiptItem: {
    publicId: string;
    quantityReceived: number;
    assetId: number | null;
    stockItemId: number | null;
    purchaseOrderItem: { name: string; unitPrice: string };
  };
};

// Daftar dan detail memakai `include` yang sama di be-sada, jadi satu bentuk.
// Kursnya TIDAK ikut, sehingga nilai per baris tidak bisa dihitung ulang di
// sini — hanya `totalIDR` header yang berupa rupiah.
export type PurchaseReturn = {
  publicId: string;
  code: string;
  status: ReturnStatus;
  returnDate: string;
  reason: string;
  totalIDR: string;
  approvedAt: string | null;
  createdAt: string;
  supplier: Named | null;
  goodsReceipt: { publicId: string; code: string; receivedDate: string } | null;
  items: ReturnItem[];
};

export type ReturnAction = "pengajuan" | "selesai" | "batal" | "hapus";

export type ReceiptOption = {
  id: number;
  publicId: string;
  code: string;
  receivedDate: string;
  purchaseOrder: {
    code: string;
    currencyCode: string;
    supplier: Named | null;
  } | null;
};

export type ReceiptLine = {
  id: number;
  publicId: string;
  quantityReceived: number;
  assetId: number | null;
  stockItemId: number | null;
  purchaseOrderItem: { name: string };
  unitPrice: string;
  unit: Named | null;
  asset: Pick<Named, "code" | "name"> | null;
  stockItem: Pick<Named, "code" | "name"> | null;
};

export type ReceiptForReturn = {
  id: number;
  publicId: string;
  code: string;
  receivedDate: string;
  purchaseOrder: {
    code: string;
    currencyCode: string;
    exchangeRate: string;
    supplier: Named | null;
  };
  items: ReceiptLine[];
};

export type ReturnPayloadItem = {
  goodsReceiptItemId: number;
  quantity: number;
  reason: string | null;
};

export type ReturnPayload = {
  goodsReceiptId: number;
  returnDate: string;
  reason: string;
  items: ReturnPayloadItem[];
};
