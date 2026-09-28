import { z } from "zod";

import { optionsOf, type SelectOption } from "@/components/common/control";
import { MENU, createHref, detailHref, menuHref } from "@/config/menu";
import type { ListFilterSchema } from "@/hooks/use-list-params";
import { monthRange, todayJakarta } from "@/lib/date";
import { formatNumber } from "@/lib/format";

import type {
  Movement,
  MovementPayload,
  MovementSource,
  MovementType,
  StockOption,
} from "./types";

export const MUTASI_LIST_PATH = menuHref(MENU.INVENTARIS, MENU.MUTASI_STOK);

export const MUTASI_CREATE_PATH = createHref(MENU.INVENTARIS, MENU.MUTASI_STOK);

export const OPNAME_CREATE_PATH = createHref(MENU.INVENTARIS, MENU.STOK_OPNAME);

export const stockItemHref = (code: string) =>
  detailHref(MENU.INVENTARIS, MENU.BARANG_PERSEDIAAN, code);

export const TYPE_LABEL: Record<MovementType, string> = {
  IN: "Masuk",
  OUT: "Keluar",
  ADJUSTMENT: "Koreksi",
};

export const SOURCE_LABEL: Record<MovementSource, string> = {
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

const DIRECT_PURCHASE = "Beli langsung";

export const sourceLabelOf = (movement: Pick<Movement, "type" | "source">) =>
  movement.type === "IN" && movement.source === "MANUAL"
    ? DIRECT_PURCHASE
    : SOURCE_LABEL[movement.source];

export const MUTASI_FILTERS = {
  bulan: { api: "bulan" },
  jenis: { api: "type" },
  sumber: { api: "source" },
} satisfies ListFilterSchema;

export const TYPE_FILTER_OPTIONS: SelectOption[] = [
  { value: "", label: "Semua" },
  ...optionsOf(TYPE_LABEL),
];

export const SOURCE_FILTER_OPTIONS: SelectOption[] = [
  { value: "", label: "Semua sumber" },
  ...optionsOf({ ...SOURCE_LABEL, MANUAL: `${DIRECT_PURCHASE} atau lainnya` }),
];

export function toMutasiApiFilters(filters: Record<string, string>) {
  const { startDate, endDate } = monthRange(filters.bulan ?? "");

  return {
    type: filters.jenis ?? "",
    source: filters.sumber ?? "",
    startDate,
    endDate,
  };
}

export const signedQuantityOf = (
  movement: Pick<Movement, "type" | "quantity">,
) => {
  const signed =
    movement.type === "OUT" ? -movement.quantity : movement.quantity;

  return `${signed < 0 ? "−" : "+"}${formatNumber(Math.abs(signed))}`;
};

export const isIncrease = (movement: Pick<Movement, "type" | "quantity">) =>
  movement.type !== "OUT" && movement.quantity > 0;

export type FormType = "IN" | "OUT";

export const FORM_TYPE_OPTIONS: SelectOption[] = [
  { value: "IN", label: TYPE_LABEL.IN },
  { value: "OUT", label: TYPE_LABEL.OUT },
];

export const FORM_SOURCE_OPTIONS: Record<FormType, SelectOption[]> = {
  IN: [
    { value: "DONATION", label: SOURCE_LABEL.DONATION },
    { value: "MANUAL", label: DIRECT_PURCHASE },
  ],
  OUT: [
    { value: "USAGE", label: SOURCE_LABEL.USAGE },
    { value: "DISPOSAL", label: SOURCE_LABEL.DISPOSAL },
  ],
};

export const DEFAULT_SOURCE: Record<FormType, MovementSource> = {
  IN: "DONATION",
  OUT: "USAGE",
};

export const movementFormSchema = z
  .object({
    stockItemId: z.string().min(1, "Pilih barang persediaan"),
    type: z.enum(["IN", "OUT"]),
    source: z.string(),
    quantity: z
      .string()
      .refine(
        (value) => /^\d+$/.test(value) && Number(value) >= 1,
        "Isi jumlah, minimal 1",
      ),
    movementDate: z.string().min(1, "Isi tanggal mutasi"),
    note: z.string().max(250, "Catatan maksimal 250 karakter"),
  })
  .superRefine((values, context) => {
    const type = values.type;
    const isSourceOffered = FORM_SOURCE_OPTIONS[type].some(
      (option) => option.value === values.source,
    );

    if (!isSourceOffered) {
      context.addIssue({
        code: "custom",
        path: ["source"],
        message: type === "IN" ? "Pilih sumber" : "Pilih alasan",
      });
    }
    if (values.movementDate > todayJakarta()) {
      context.addIssue({
        code: "custom",
        path: ["movementDate"],
        message: "Tanggal mutasi tidak boleh di masa depan",
      });
    }
    if (values.source === "DONATION" && !values.note.trim()) {
      context.addIssue({
        code: "custom",
        path: ["note"],
        message: "Tulis nama pemberi",
      });
    }
  });

export type MovementFormValues = z.infer<typeof movementFormSchema>;

export const emptyMovementForm = (): MovementFormValues => ({
  stockItemId: "",
  type: "OUT",
  source: DEFAULT_SOURCE.OUT,
  quantity: "",
  movementDate: todayJakarta(),
  note: "",
});

export const balanceAfterOf = (
  values: Pick<MovementFormValues, "type" | "quantity">,
  stock: Pick<StockOption, "quantity">,
) => {
  const quantity = Number(values.quantity) || 0;

  return values.type === "OUT"
    ? stock.quantity - quantity
    : stock.quantity + quantity;
};

export const stockShortageOf = (
  values: Pick<MovementFormValues, "type" | "quantity">,
  stock: StockOption | undefined,
) =>
  stock && balanceAfterOf(values, stock) < 0
    ? `Stok tidak cukup. Sisa ${formatNumber(stock.quantity)} ${stock.unit.name}.`
    : null;

export const stockHintOf = (row: StockOption) =>
  `Stok ${formatNumber(row.quantity)} ${row.unit.name} · ${row.room.name}`;

export const toMovementPayload = (
  values: MovementFormValues,
): MovementPayload => {
  const note = values.note.trim();

  return {
    stockItemId: Number(values.stockItemId),
    type: values.type,
    source: values.source as MovementSource,
    quantity: Number(values.quantity),
    movementDate: values.movementDate,
    ...(note ? { note } : {}),
  };
};

const SERVER_FIELD_ERROR: ReadonlyArray<[RegExp, string]> = [
  [/stok tidak mencukupi/i, "quantity"],
  [/tanggal mutasi/i, "movementDate"],
  [/barang persediaan tidak ditemukan/i, "stockItemId"],
];

export function serverFieldError(
  message: string,
): { field: string; message: string } | null {
  for (const [pattern, field] of SERVER_FIELD_ERROR) {
    if (pattern.test(message)) return { field, message };
  }

  return null;
}
