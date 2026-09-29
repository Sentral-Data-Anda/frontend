import { z } from "zod";

import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
} from "@/config/menu";
import { FetchError } from "@/lib/api/fetcher";
import { newAttachments } from "@/lib/attachment";
import { monthRange, toDateInput, todayJakarta } from "@/lib/date";
import { toFormData } from "@/lib/form-data";
import {
  formatDate,
  formatMoney,
  formatNumber,
  formatRupiah,
} from "@/lib/format";
import type { AttachmentValue } from "@/types/attachment";

import {
  ORDER_STATUS_LABEL,
  type OrderForReceipt,
  type OrderOption,
  type Receipt,
  type ReceiptItem,
  type ReceiptPayloadItem,
  type StockItemOption,
} from "./types";

export const RECEIPT_LIST_PATH = menuHref(
  MENU.PENGADAAN,
  MENU.PENERIMAAN_BARANG,
);

export const RECEIPT_CREATE_PATH = createHref(
  MENU.PENGADAAN,
  MENU.PENERIMAAN_BARANG,
);

export const receiptHref = (code: string) =>
  detailHref(MENU.PENGADAAN, MENU.PENERIMAAN_BARANG, code);

export const orderHref = (code: string) =>
  detailHref(MENU.PENGADAAN, MENU.PESANAN_PEMBELIAN, code);

export const assetHref = (code: string) =>
  detailHref(MENU.INVENTARIS, MENU.BARANG, code);

export const assetEditHref = (code: string) =>
  editHref(MENU.INVENTARIS, MENU.BARANG, code);

export const stockItemHref = (code: string) =>
  detailHref(MENU.INVENTARIS, MENU.BARANG_PERSEDIAAN, code);

export const MAX_ATTACHMENTS = 3;

export const MAX_ASSETS_PER_LINE = 50;

export const MAX_LINES = 50;

const NOTE_MAX = 250;

export function toReceiptApiFilters(filters: Record<string, string>) {
  return monthRange(filters.bulan ?? "");
}

export const supplierNameOf = (receipt: Pick<Receipt, "purchaseOrder">) =>
  receipt.purchaseOrder.supplier.name;

export const orderOptionOf = (row: OrderOption) => ({
  value: String(row.id),
  label: row.code,
  hint: `${row.supplier?.name ?? "Tanpa supplier"} · ${ORDER_STATUS_LABEL[row.status]}`,
});

const round2 = (value: number) => Math.round(value * 100) / 100;

export type ReceiptLine = {
  purchaseOrderItemId: string;
  name: string;
  description: string;
  unit: string;
  unitId: number;
  room: string;
  ordered: number;
  received: number;
  remaining: number;
  unitPrice: string;
  unitPriceIDR: number;
  currencyCode: string;
  quantityReceived: string;
  target: "" | "ASSET" | "STOCK";
  stockItemId: string;
};

export const linesOf = (order: OrderForReceipt): ReceiptLine[] =>
  order.items
    .filter((line) => line.remainingQuantity > 0)
    .map((line) => ({
      purchaseOrderItemId: String(line.id),
      name: line.name,
      description: line.description,
      unit: line.unit.name,
      unitId: line.unitId,
      room: line.room.name,
      ordered: line.quantity,
      received: line.receivedQuantity,
      remaining: line.remainingQuantity,
      unitPrice: line.unitPrice,
      unitPriceIDR: round2(Number(line.unitPrice) * Number(order.exchangeRate)),
      currencyCode: order.currencyCode,
      quantityReceived: String(line.remainingQuantity),
      target: "",
      stockItemId: "",
    }));

export const quantityOf = (line: Pick<ReceiptLine, "quantityReceived">) =>
  Number(line.quantityReceived) || 0;

export const isReceiving = (line: Pick<ReceiptLine, "quantityReceived">) =>
  quantityOf(line) > 0;

export const isLineTouched = (line: ReceiptLine) =>
  line.target !== "" ||
  line.stockItemId !== "" ||
  line.quantityReceived !== String(line.remaining);

export const lineMetaOf = (line: ReceiptLine) =>
  `Dipesan ${formatNumber(line.ordered)} ${line.unit} · sudah diterima ${formatNumber(line.received)} · harga ${formatMoney(Number(line.unitPrice), line.currencyCode)}`;

export const assetHintOf = (line: ReceiptLine) =>
  `Menjadi ${formatNumber(quantityOf(line))} barang baru di ${line.room}, harga perolehan ${formatRupiah(line.unitPriceIDR)} per barang. Nomor seri, foto, dan penyusutan diatur di menu Barang.`;

export const TARGET_HINT =
  "Barang = dicatat satu per satu (proyektor, kursi). Persediaan = habis pakai yang dihitung (kertas, lilin).";

export const newStockLabelOf = (line: Pick<ReceiptLine, "room">) =>
  `Barang persediaan baru di ${line.room}`;

export const stockOptionsOf = (
  rows: readonly StockItemOption[],
  line: Pick<ReceiptLine, "room" | "unitId">,
) => [
  { value: "", label: newStockLabelOf(line) },
  ...rows
    .map((row) => {
      const unit = row.unit?.name ?? "";
      const isOtherUnit = row.unit?.id !== line.unitId;

      return {
        value: String(row.id),
        label: row.name,
        hint: isOtherUnit
          ? `Satuan ${unit}`
          : `${row.code} · stok ${formatNumber(row.quantity)} ${unit}`,
        isDisabled: isOtherUnit,
      };
    })
    .sort((a, b) => Number(a.isDisabled) - Number(b.isDisabled)),
];

export const summaryOf = (lines: readonly ReceiptLine[]) => {
  const receiving = lines.filter(isReceiving);

  return {
    lineCount: receiving.length,
    assetCount: receiving
      .filter((line) => line.target === "ASSET")
      .reduce((sum, line) => sum + quantityOf(line), 0),
    stockCount: receiving.filter((line) => line.target === "STOCK").length,
  };
};

export const summaryTextOf = (lines: readonly ReceiptLine[]) => {
  const { lineCount, assetCount, stockCount } = summaryOf(lines);

  return `${formatNumber(lineCount)} baris · ${formatNumber(assetCount)} barang baru · ${formatNumber(stockCount)} baris persediaan`;
};

export const confirmTextOf = (lines: readonly ReceiptLine[]) => {
  const { assetCount, stockCount } = summaryOf(lines);
  const effects = [
    assetCount > 0 ? `${formatNumber(assetCount)} barang baru` : null,
    stockCount > 0
      ? `stok ${formatNumber(stockCount)} barang persediaan`
      : null,
  ]
    .filter(Boolean)
    .join(" dan ");
  const effect = effects
    ? ` ${effects.charAt(0).toUpperCase()}${effects.slice(1)} akan tercatat.`
    : "";

  return `Apakah Anda ingin menyimpan penerimaan ini?${effect} Penerimaan tidak bisa diubah atau dihapus.`;
};

const lineSchema = z.object({
  purchaseOrderItemId: z.string(),
  name: z.string(),
  description: z.string(),
  unit: z.string(),
  unitId: z.number(),
  room: z.string(),
  ordered: z.number(),
  received: z.number(),
  remaining: z.number(),
  unitPrice: z.string(),
  unitPriceIDR: z.number(),
  currencyCode: z.string(),
  quantityReceived: z.string(),
  target: z.enum(["", "ASSET", "STOCK"]),
  stockItemId: z.string(),
});

export const receiptFormSchema = z
  .object({
    purchaseOrderId: z.string(),
    orderDate: z.string(),
    receivedDate: z.string(),
    note: z.string(),
    items: z.array(lineSchema),
    image: z.array(z.custom<AttachmentValue>()),
  })
  .superRefine((values, ctx) => {
    const addIssue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    if (!values.purchaseOrderId) {
      addIssue(["purchaseOrderId"], "Pilih pesanan pembelian");
    }

    if (!values.receivedDate) {
      addIssue(["receivedDate"], "Isi tanggal terima");
    } else if (values.receivedDate > todayJakarta()) {
      addIssue(["receivedDate"], "Tanggal terima tidak boleh di masa depan");
    } else if (values.orderDate && values.receivedDate < values.orderDate) {
      addIssue(
        ["receivedDate"],
        `Tanggal terima tidak boleh sebelum tanggal pesanan (${formatDate(values.orderDate)})`,
      );
    }

    if (values.note.trim().length > NOTE_MAX) {
      addIssue(["note"], `Catatan maksimal ${NOTE_MAX} karakter`);
    }

    const receivingCount = values.items.filter(isReceiving).length;

    if (values.purchaseOrderId && receivingCount === 0) {
      addIssue(["items"], "Isi jumlah yang diterima minimal di satu barang");
    } else if (receivingCount > MAX_LINES) {
      addIssue(
        ["items"],
        `Maksimal ${MAX_LINES} baris per penerimaan. Simpan sisanya di penerimaan berikutnya.`,
      );
    }

    values.items.forEach((line, index) => {
      const quantity = quantityOf(line);

      if (quantity === 0) return;

      if (quantity > line.remaining) {
        addIssue(
          ["items", index, "quantityReceived"],
          `Melebihi sisa pesanan (${formatNumber(line.remaining)})`,
        );
      } else if (line.target === "ASSET" && quantity > MAX_ASSETS_PER_LINE) {
        addIssue(
          ["items", index, "quantityReceived"],
          `Maksimal ${MAX_ASSETS_PER_LINE} barang per baris`,
        );
      }

      if (!line.target) {
        addIssue(
          ["items", index, "target"],
          "Pilih jadi barang atau barang persediaan",
        );
      }
    });

    if (values.image.length > MAX_ATTACHMENTS) {
      addIssue(["image"], `Maksimal ${MAX_ATTACHMENTS} lampiran`);
    }
  });

export type ReceiptFormValues = z.infer<typeof receiptFormSchema>;

export const emptyReceiptForm = (): ReceiptFormValues => ({
  purchaseOrderId: "",
  orderDate: "",
  receivedDate: todayJakarta(),
  note: "",
  items: [],
  image: [],
});

export const orderDateOf = (order: OrderForReceipt) =>
  toDateInput(order.orderDate);

const toPayloadItem = (line: ReceiptLine): ReceiptPayloadItem => ({
  purchaseOrderItemId: Number(line.purchaseOrderItemId),
  quantityReceived: quantityOf(line),
  target: line.target === "STOCK" ? "STOCK" : "ASSET",
  ...(line.target === "STOCK"
    ? { stockItemId: line.stockItemId ? Number(line.stockItemId) : null }
    : {}),
});

export const toReceiptFormData = (values: ReceiptFormValues) =>
  toFormData(
    {
      purchaseOrderId: values.purchaseOrderId,
      receivedDate: values.receivedDate,
      note: values.note.trim(),
      items: JSON.stringify(
        values.items.filter(isReceiving).map(toPayloadItem),
      ),
    },
    newAttachments(values.image).map((item) => ({
      field: "image",
      file: item.file,
    })),
  );

const LINE_PATH = /^items\.(\d+)\.(.+)$/;

// Server memberi nomor baris menurut payload, yang hanya memuat baris berjumlah.
export const toFormIssues = (error: unknown, values: ReceiptFormValues) => {
  if (!(error instanceof FetchError) || error.issues.length === 0) {
    return error;
  }

  const sent = values.items.flatMap((line, index) =>
    isReceiving(line) ? [index] : [],
  );
  const issues = error.issues.map((issue) => {
    const match = LINE_PATH.exec(issue.path);
    const index = match ? sent[Number(match[1])] : undefined;

    return index === undefined || !match
      ? issue
      : { ...issue, path: `items.${index}.${match[2]}` };
  });

  return new FetchError(error.status, error.message, issues, error.code);
};

const STALE_ORDER_PATH = /^(purchaseOrderId|items\.\d+\.quantityReceived)$/;

export const isStaleOrderError = (error: unknown) =>
  error instanceof FetchError &&
  error.status === 400 &&
  error.issues.some((issue) => STALE_ORDER_PATH.test(issue.path));

export type ReceiptGroup = {
  key: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: string;
  unitPriceIDR: string;
  assets: { code: string; name: string }[];
  stockItem: { code: string; name: string } | null;
};

export const groupItems = (items: readonly ReceiptItem[]): ReceiptGroup[] => {
  const groups = new Map<number, ReceiptGroup>();

  for (const item of items) {
    const group = groups.get(item.purchaseOrderItemId) ?? {
      key: item.publicId,
      name: item.purchaseOrderItem.name,
      quantity: 0,
      unit: item.unit.name,
      unitPrice: item.unitPrice,
      unitPriceIDR: item.unitPriceIDR,
      assets: [],
      stockItem: item.stockItem,
    };

    group.quantity += item.quantityReceived;
    if (item.asset) group.assets.push(item.asset);
    groups.set(item.purchaseOrderItemId, group);
  }

  return [...groups.values()];
};

export const MAX_SHOWN_ASSETS = 3;

export const quantityTextOf = (quantity: number, unit: string) =>
  `${formatNumber(quantity)} ${unit}`.trim();
