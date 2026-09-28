import { z } from "zod";

import type { SelectOption } from "@/components/common/control";
import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
} from "@/config/menu";
import type { ListFilterSchema } from "@/hooks/use-list-params";
import { formatNumber } from "@/lib/format";
import { normalizeName } from "@/lib/name";

import type {
  ItemMovement,
  MovementSource,
  MovementType,
  StockItem,
  StockItemPayload,
  StockStatus,
} from "./types";

export const STOCK_LIST_PATH = menuHref(
  MENU.INVENTARIS,
  MENU.BARANG_PERSEDIAAN,
);

export const STOCK_CREATE_PATH = createHref(
  MENU.INVENTARIS,
  MENU.BARANG_PERSEDIAAN,
);

export const stockDetailHref = (code: string) =>
  detailHref(MENU.INVENTARIS, MENU.BARANG_PERSEDIAAN, code);

export const stockEditHref = (code: string) =>
  editHref(MENU.INVENTARIS, MENU.BARANG_PERSEDIAAN, code);

export const movementCreateHref = (code: string) =>
  `${createHref(MENU.INVENTARIS, MENU.MUTASI_STOK)}?barang=${encodeURIComponent(code)}`;

export const movementListHref = (code: string) =>
  `${menuHref(MENU.INVENTARIS, MENU.MUTASI_STOK)}?search=${encodeURIComponent(code)}`;

export const HISTORY_LIMIT = 10;

export const STOCK_FILTERS = {
  stok: { api: "menipis" },
  tipe: { api: "typeId" },
  ruang: { api: "roomId" },
  satuan: { api: "unitId" },
  bapel: { api: "bapelId" },
} satisfies ListFilterSchema;

export const STOCK_FILTER_OPTIONS: SelectOption[] = [
  { value: "", label: "Semua" },
  { value: "ya", label: "Menipis" },
];

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  HABIS: "Habis",
  MENIPIS: "Menipis",
  TERSEDIA: "Tersedia",
};

export const STOCK_STATUS_BADGE = {
  HABIS: "due",
  MENIPIS: "draft",
  TERSEDIA: "success",
} as const satisfies Record<StockStatus, string>;

export const stockStatusOf = (
  item: Pick<StockItem, "quantity" | "reorderPoint">,
): StockStatus => {
  if (item.quantity === 0) return "HABIS";
  if (item.reorderPoint !== null && item.quantity <= item.reorderPoint) {
    return "MENIPIS";
  }

  return "TERSEDIA";
};

export const quantityOf = (item: Pick<StockItem, "quantity" | "unit">) =>
  `${formatNumber(item.quantity)} ${item.unit.name}`;

export const MOVEMENT_TYPE_LABEL: Record<MovementType, string> = {
  IN: "Masuk",
  OUT: "Keluar",
  ADJUSTMENT: "Koreksi",
};

export const MOVEMENT_SOURCE_LABEL: Record<MovementSource, string> = {
  OPENING_BALANCE: "Stok awal",
  GOODS_RECEIPT: "Penerimaan barang",
  DONATION: "Donasi",
  USAGE: "Pemakaian",
  TRANSFER: "Pindah lokasi",
  DISPOSAL: "Rusak/kedaluwarsa",
  STOCK_OPNAME: "Stok opname",
  PURCHASE_RETURN: "Retur pembelian",
  MANUAL: "Lainnya",
};

export const sourceLabelOf = (
  movement: Pick<ItemMovement, "type" | "source">,
) =>
  movement.type === "IN" && movement.source === "MANUAL"
    ? "Beli langsung"
    : MOVEMENT_SOURCE_LABEL[movement.source];

export const signedQuantityOf = (
  movement: Pick<ItemMovement, "type" | "quantity">,
) => {
  const signed =
    movement.type === "OUT" ? -movement.quantity : movement.quantity;

  return `${signed < 0 ? "−" : "+"}${formatNumber(Math.abs(signed))}`;
};

export const isMovementIncrease = (
  movement: Pick<ItemMovement, "type" | "quantity">,
) => movement.type !== "OUT" && movement.quantity > 0;

const count = z.string().regex(/^\d*$/, "Isi angka tanpa titik atau koma");

const required = (message: string) => z.string().min(1, message);

export const stockFormSchema = z.object({
  name: z
    .string()
    .transform(normalizeName)
    .pipe(
      z
        .string()
        .min(1, "Isi nama barang")
        .max(150, "Nama barang maksimal 150 karakter"),
    ),
  typeId: required("Pilih tipe barang"),
  unitId: required("Pilih satuan"),
  description: z.string().max(250, "Keterangan maksimal 250 karakter"),
  roomId: required("Pilih ruang"),
  bapelId: required("Pilih badan pelayanan"),
  openingQuantity: count,
  reorderPoint: count,
});

export type StockFormValues = z.infer<typeof stockFormSchema>;

export const EMPTY_STOCK_FORM: StockFormValues = {
  name: "",
  typeId: "",
  unitId: "",
  description: "",
  roomId: "",
  bapelId: "",
  openingQuantity: "",
  reorderPoint: "",
};

export const toStockForm = (item: StockItem): StockFormValues => ({
  name: item.name,
  typeId: String(item.typeId),
  unitId: String(item.unitId),
  description: item.description ?? "",
  roomId: String(item.roomId),
  bapelId: String(item.bapelId),
  openingQuantity: "",
  reorderPoint: item.reorderPoint === null ? "" : String(item.reorderPoint),
});

export const toStockPayload = (
  values: StockFormValues,
  isEdit: boolean,
): StockItemPayload => {
  const description = values.description.trim();

  return {
    name: normalizeName(values.name),
    ...(description ? { description } : {}),
    typeId: Number(values.typeId),
    bapelId: Number(values.bapelId),
    roomId: Number(values.roomId),
    unitId: Number(values.unitId),
    reorderPoint:
      values.reorderPoint === "" ? null : Number(values.reorderPoint),
    ...(isEdit ? {} : { openingQuantity: Number(values.openingQuantity || 0) }),
  };
};

const SERVER_FIELD_ERROR: ReadonlyArray<[RegExp, string, string]> = [
  [
    /sudah tersedia/i,
    "name",
    "Barang persediaan dengan nama ini sudah ada. Pakai nama lain.",
  ],
];

export function serverFieldError(
  message: string,
): { field: string; message: string } | null {
  for (const [pattern, field, override] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) return { field, message: override };
  }

  return null;
}
