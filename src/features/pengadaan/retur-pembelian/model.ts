import type { ComponentProps } from "react";
import { z } from "zod";

import type { Badge } from "@/components/common/display";
import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
} from "@/config/menu";
import { toDateInput } from "@/lib/date";
import { formatDateShort, formatNumber } from "@/lib/format";
import { collapseSpaces } from "@/lib/name";
import { lineAmountText, sumProductsText } from "@/lib/number";

import {
  type PurchaseReturn,
  type ReceiptForReturn,
  type ReceiptLine,
  type ReceiptOption,
  type ReturnPayload,
  type ReturnStatus,
} from "./types";

type BadgeVariant = ComponentProps<typeof Badge>["variant"];

export const RETURN_LIST_PATH = menuHref(
  MENU.PROCUREMENT,
  MENU.PURCHASE_RETURN,
);

export const RETURN_CREATE_PATH = createHref(
  MENU.PROCUREMENT,
  MENU.PURCHASE_RETURN,
);

export const returnHref = (publicId: string) =>
  detailHref(MENU.PROCUREMENT, MENU.PURCHASE_RETURN, publicId);

export const returnEditHref = (publicId: string) =>
  editHref(MENU.PROCUREMENT, MENU.PURCHASE_RETURN, publicId);

export const receiptHref = (code: string) =>
  detailHref(MENU.PROCUREMENT, MENU.GOODS_RECEIPT, code);

export const supplierHref = (code: string) =>
  detailHref(MENU.PROCUREMENT, MENU.SUPPLIER, code);

export const approvalListHref = menuHref(MENU.APPROVAL, MENU.APPROVAL_REQUEST);

export const RETURN_STATUS_VARIANT: Record<ReturnStatus, BadgeVariant> = {
  DRAFT: "draft",
  SUBMITTED: "wait",
  COMPLETED: "success",
  CANCELLED: "neutral",
};

export const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "DRAFT", label: "Draf" },
  { value: "SUBMITTED", label: "Menunggu" },
  { value: "COMPLETED", label: "Selesai" },
  { value: "CANCELLED", label: "Dibatalkan" },
] satisfies { value: "" | ReturnStatus; label: string }[];

export function toReturnApiFilters(filters: Record<string, string>) {
  return { supplierId: filters.supplier ?? "" };
}

/** Aturan server, dicerminkan di layar: hanya draf yang boleh diubah. */
export const isEditable = (row: PurchaseReturn) => row.status === "DRAFT";

/**
 * Hanya retur yang sudah ditandatangani yang boleh diselesaikan.
 *
 * `approvedAt` ditulis oleh hook persetujuan, bukan oleh menu ini, jadi status
 * SUBMITTED saja tidak cukup — itu pula yang ditolak `complete` di be-sada.
 */
export const isCompletable = (row: PurchaseReturn) =>
  row.status === "SUBMITTED" && row.approvedAt !== null;

export const isCancellable = (row: PurchaseReturn) =>
  row.status === "DRAFT" || row.status === "SUBMITTED";

export const TARGET_LABEL = {
  ASSET: "Barang",
  STOCK: "Barang persediaan",
} as const;

export type LineTarget = keyof typeof TARGET_LABEL;

export const targetOf = (
  line: Pick<ReceiptLine, "assetId" | "stockItemId">,
): LineTarget | null => {
  if (line.assetId !== null) return "ASSET";

  return line.stockItemId !== null ? "STOCK" : null;
};

export const receiptLabelOf = (row: ReceiptOption) =>
  row.purchaseOrder?.supplier
    ? `${row.code} — ${row.purchaseOrder.supplier.name}`
    : row.code;

export const receiptHintOf = (row: ReceiptOption) =>
  [
    formatDateShort(row.receivedDate),
    row.purchaseOrder?.code,
    row.purchaseOrder?.currencyCode,
  ]
    .filter(Boolean)
    .join(" · ");

const REASON_MAX = 250;

/** Jumlah yang benar-benar dikembalikan, atau null bila barisnya dilewati. */
const returnedOf = (line: { quantity: string }) => {
  const quantity = Number(line.quantity);

  return line.quantity !== "" && Number.isInteger(quantity) && quantity > 0
    ? quantity
    : null;
};

export const returnFormSchema = z
  .object({
    goodsReceiptCode: z.string(),
    returnDate: z.string(),
    reason: z.string(),
    items: z.array(
      z.object({
        goodsReceiptItemId: z.string(),
        name: z.string(),
        unit: z.string(),
        unitPrice: z.string(),
        quantityReceived: z.number(),
        target: z.string(),
        quantity: z.string(),
        reason: z.string(),
      }),
    ),
  })
  .superRefine((values, ctx) => {
    const addIssue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    if (!values.goodsReceiptCode) {
      addIssue(["goodsReceiptCode"], "Pilih penerimaan barang");
    }

    if (!values.returnDate) addIssue(["returnDate"], "Isi tanggal retur");

    const reason = collapseSpaces(values.reason);
    if (!reason) addIssue(["reason"], "Isi alasan retur");
    else if (reason.length > REASON_MAX) {
      addIssue(["reason"], `Alasan maksimal ${REASON_MAX} karakter`);
    }

    // Jumlah kosong berarti baris itu tidak dikembalikan, bukan baris bergalat:
    // satu penerimaan bisa punya dua puluh baris dan hanya satu yang pulang.
    if (values.items.length === 0) {
      addIssue(
        ["items"],
        "Muat baris penerimaan, lalu isi jumlah yang diretur",
      );
    } else if (!values.items.some((line) => returnedOf(line) !== null)) {
      addIssue(["items"], "Isi jumlah pada baris yang dikembalikan");
    }

    values.items.forEach((line, index) => {
      if (line.quantity !== "") {
        const quantity = Number(line.quantity);

        if (!(quantity > 0)) {
          addIssue(["items", index, "quantity"], "Isi jumlah, minimal 1");
        } else if (!Number.isInteger(quantity)) {
          addIssue(["items", index, "quantity"], "Jumlah harus bilangan bulat");
        } else if (quantity > line.quantityReceived) {
          addIssue(
            ["items", index, "quantity"],
            `Jumlah retur melebihi jumlah diterima (${formatNumber(line.quantityReceived)})`,
          );
        }
      }

      if (collapseSpaces(line.reason).length > REASON_MAX) {
        addIssue(
          ["items", index, "reason"],
          `Alasan baris maksimal ${REASON_MAX} karakter`,
        );
      }
    });
  });

export type ReturnFormValues = z.infer<typeof returnFormSchema>;

export type ReturnLine = ReturnFormValues["items"][number];

export const emptyReturnForm = (): ReturnFormValues => ({
  goodsReceiptCode: "",
  returnDate: "",
  reason: "",
  items: [],
});

export const toReturnLine = (row: ReceiptLine): ReturnLine => ({
  goodsReceiptItemId: String(row.id),
  name: row.purchaseOrderItem.name,
  unit: row.unit?.name ?? "",
  unitPrice: row.unitPrice,
  quantityReceived: row.quantityReceived,
  target: targetOf(row) ?? "",
  quantity: "",
  reason: "",
});

/**
 * Retur tersimpan sebagai nilai form.
 *
 * Nama, harga satuan, dan jumlah diterima ikut di baris retur sendiri, jadi
 * form terisi tanpa menunggu rincian penerimaannya. Satuannya tidak ikut:
 * `receipt` hanya melengkapi label itu begitu termuat, dan sampai saat itu
 * barisnya sudah benar-benar bisa disunting.
 */
export const toReturnForm = (
  row: PurchaseReturn,
  receipt?: ReceiptForReturn,
): ReturnFormValues => {
  const units = new Map(
    (receipt?.items ?? []).map((line) => [line.id, line.unit?.name ?? ""]),
  );

  return {
    goodsReceiptCode: row.goodsReceipt?.code ?? "",
    returnDate: toDateInput(row.returnDate),
    reason: row.reason,
    items: row.items.map((item) => {
      const line = item.goodsReceiptItem;

      return {
        goodsReceiptItemId: String(item.goodsReceiptItemId),
        name: line.purchaseOrderItem.name,
        unit: units.get(item.goodsReceiptItemId) ?? "",
        unitPrice: line.purchaseOrderItem.unitPrice,
        quantityReceived: line.quantityReceived,
        target: targetOf(line) ?? "",
        quantity: String(item.quantity),
        reason: item.reason ?? "",
      };
    }),
  };
};

/** Nilai satu baris dalam rupiah: jumlah x harga satuan x kurs pesanannya. */
export const lineValueText = (line: ReturnLine, exchangeRate: string) =>
  lineAmountText(line.quantity, line.unitPrice, exchangeRate);

/**
 * Nilai seluruh retur dalam rupiah.
 *
 * Dijumlahkan dulu lalu dibulatkan sekali, seperti `toItemRows` di be-sada:
 * membulatkan tiap baris lalu menjumlahkan memberi angka yang berbeda dari
 * yang server simpan.
 */
export const returnTotalText = (
  lines: readonly ReturnLine[],
  exchangeRate: string,
) =>
  sumProductsText(
    lines.map((line) => [line.quantity, line.unitPrice, exchangeRate]),
  );

/** Berapa baris yang benar-benar dikembalikan, untuk ringkasan form. */
export const returnedLineCount = (lines: readonly ReturnLine[]) =>
  lines.filter((line) => returnedOf(line) !== null).length;

/** Hanya baris yang benar-benar dikembalikan yang dikirim. */
export const toReturnPayload = (
  values: ReturnFormValues,
  goodsReceiptId: number,
): ReturnPayload => ({
  goodsReceiptId,
  returnDate: values.returnDate,
  reason: collapseSpaces(values.reason),
  items: values.items.flatMap((line) => {
    const quantity = returnedOf(line);

    return quantity === null
      ? []
      : [
          {
            goodsReceiptItemId: Number(line.goodsReceiptItemId),
            quantity,
            reason: collapseSpaces(line.reason) || null,
          },
        ];
  }),
});

/**
 * Penolakan be-sada yang menyebut barisnya, dinaikkan ke galat tingkat form.
 *
 * Jumlah yang melebihi sisa retur hanya bisa diketahui server: penerimaan tidak
 * memberi tahu berapa yang sudah diretur retur sebelumnya, jadi pesan server
 * yang menyebut kedua angkanya adalah satu-satunya yang benar.
 */
export const isOverReturned = (message: string) =>
  /melebihi jumlah yang diterima/i.test(message);
