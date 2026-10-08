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
import { collapseSpaces } from "@/lib/name";

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

/**
 * Nilai persediaan barang ini: jumlah x harga rata-rata.
 *
 * Harga RATA-RATA, bukan harga beli terakhir, karena inilah angka yang dibawa
 * Persediaan di Neraca — dan menampilkan jumlah x harga terakhir di sebelahnya
 * akan memberi dua angka berbeda untuk satu hal, yang salah satunya pasti
 * tidak cocok dengan buku besar.
 *
 * Dihitung dalam sen lewat BigInt, pola yang sama dengan `outstandingOf` di
 * Faktur Supplier. Jujur soal seberapa penting: `Number(harga) * jumlah` baru
 * salah satu sen di atas sekitar 50 triliun rupiah, dan gereja tidak akan
 * pernah menumpuk itu dalam barang habis pakai. Dipertahankan karena harganya
 * nol, bukan karena ambangnya terjangkau — jangan hapus BigInt-nya dengan
 * alasan "angkanya kecil", hapus saja kalau memang mengganggu dibaca.
 */
export const valueOf = (
  item: Pick<StockItem, "quantity" | "avgUnitPrice">,
): string => {
  if (item.avgUnitPrice === null) return "0";

  // `BigInt(100)`, bukan `100n`: target tsconfig di bawah ES2020, jadi literal
  // BigInt tidak tersedia. Pola yang sama dipakai `outstandingOf` di Faktur
  // Supplier.
  const HUNDRED = BigInt(100);
  const [whole = "0", fraction = ""] = item.avgUnitPrice.split(".");
  const cents =
    BigInt(whole.replace(/\D/g, "") || "0") * HUNDRED +
    BigInt(`${fraction}00`.slice(0, 2));
  const total = cents * BigInt(item.quantity);

  return `${total / HUNDRED}.${String(total % HUNDRED).padStart(2, "0")}`;
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
    .transform(collapseSpaces)
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
    name: collapseSpaces(values.name),
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
