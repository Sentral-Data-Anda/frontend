import { z } from "zod";

import {
  MENU,
  createHref,
  detailHref,
  editHref,
  menuHref,
} from "@/config/menu";
import { addDays, monthRange, toDateInput, todayJakarta } from "@/lib/date";
import {
  formatDateShort,
  formatMoney,
  formatNumber,
  formatRupiah,
} from "@/lib/format";
import { lineAmount } from "@/lib/number";

import {
  type CurrencyOption,
  type OrderDetail,
  type OrderPayload,
  type OrderStatus,
  type RequestDetail,
  type RequestOption,
  type SupplierOption,
} from "./types";

export const BASE_CURRENCY = "IDR";

export const MAX_LINES = 50;

export const STALE_RATE_DAYS = 7;

export { DETAIL_LINK as TEXT_LINK } from "@/components/common/display";

export const ORDER_LIST_PATH = menuHref(MENU.PENGADAAN, MENU.PESANAN_PEMBELIAN);

export const ORDER_CREATE_PATH = createHref(
  MENU.PENGADAAN,
  MENU.PESANAN_PEMBELIAN,
);

export const orderHref = (code: string) =>
  detailHref(MENU.PENGADAAN, MENU.PESANAN_PEMBELIAN, code);

export const orderEditHref = (code: string) =>
  editHref(MENU.PENGADAAN, MENU.PESANAN_PEMBELIAN, code);

export const supplierHref = (code: string) =>
  detailHref(MENU.PENGADAAN, MENU.SUPPLIER, code);

export const requestHref = (code: string) =>
  detailHref(MENU.PENGADAAN, MENU.PERMINTAAN_PEMBELIAN, code);

export const receiptHref = (code: string) =>
  detailHref(MENU.PENGADAAN, MENU.PENERIMAAN_BARANG, code);

export const receiptCreateHref = (code: string) =>
  `${createHref(MENU.PENGADAAN, MENU.PENERIMAAN_BARANG)}?pesanan=${encodeURIComponent(code)}`;

export const receiptListHref = (code: string) =>
  `${menuHref(MENU.PENGADAAN, MENU.PENERIMAAN_BARANG)}?search=${encodeURIComponent(code)}`;

export const currencyHref = (code: string) =>
  detailHref(MENU.KEUANGAN, MENU.MATA_UANG, code);

export const STATUS_TABS = [
  { value: "", label: "Semua" },
  { value: "ISSUED", label: "Dipesan" },
  { value: "PARTIALLY_RECEIVED", label: "Sebagian" },
  { value: "RECEIVED", label: "Lengkap" },
  { value: "CANCELLED", label: "Batal" },
] satisfies { value: "" | OrderStatus; label: string }[];

export const STATUS_VARIANT = {
  ISSUED: "wait",
  PARTIALLY_RECEIVED: "draft",
  RECEIVED: "success",
  CANCELLED: "neutral",
} as const satisfies Record<OrderStatus, string>;

export function toOrderApiFilters(filters: Record<string, string>) {
  const { startDate, endDate } = monthRange(filters.bulan ?? "");

  return { supplierId: filters.supplier ?? "", startDate, endDate };
}

export const isForeign = (currencyCode: string) =>
  currencyCode !== BASE_CURRENCY;

export const formatRate = (rate: string | number) => formatNumber(Number(rate));

export const rateCaptionOf = (rate: string | number, rateDate: string) =>
  `kurs ${formatRate(rate)} · ${formatDateShort(rateDate)}`;

export const currencyLabelOf = (option: CurrencyOption) =>
  `${option.code} — ${option.name}`;

export const supplierHintOf = (row: SupplierOption) => row.phone;

export const requestLabelOf = (row: RequestOption) =>
  `${row.purpose} · ${row.code}`;

export const requestHintOf = (
  row: Pick<RequestOption, "bapel" | "totalEstimatedIDR" | "orderedTotalIDR">,
) =>
  [
    row.bapel?.name,
    `perkiraan ${formatRupiah(Number(row.totalEstimatedIDR))}`,
    `sudah dipesan ${formatRupiah(Number(row.orderedTotalIDR))}`,
  ]
    .filter(Boolean)
    .join(" · ");

export const isRateStale = (rateDate: string, orderDate: string) =>
  toDateInput(rateDate) < addDays(orderDate, -STALE_RATE_DAYS);

const round = (value: number, digits: number) => {
  const factor = 10 ** digits;

  return Math.round(value * factor) / factor;
};

export const toIdr = (foreignTotal: number, rate: number) =>
  round(foreignTotal * rate, 2);

export const quantityLabel = (quantity: number, unit: string | undefined) =>
  unit ? `${formatNumber(quantity)} ${unit}` : formatNumber(quantity);

const PERCENT = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });

export type OverEstimate = {
  requestCode: string;
  total: number;
  estimate: number;
  percent: string;
};

export const overEstimateOf = (input: {
  requestCode: string;
  totalIDR: number;
  orderedTotalIDR: string;
  totalEstimatedIDR: string;
}): OverEstimate | null => {
  const total = round(input.totalIDR + Number(input.orderedTotalIDR), 2);
  const estimate = Number(input.totalEstimatedIDR);

  if (!(estimate > 0) || total <= estimate) return null;

  return {
    requestCode: input.requestCode,
    total,
    estimate,
    percent: PERCENT.format(((total - estimate) / estimate) * 100),
  };
};

export const overEstimateText = (over: OverEstimate) =>
  `Total pesanan dari permintaan ${over.requestCode} menjadi ${formatRupiah(over.total)}, melebihi perkiraan yang disetujui ${formatRupiah(over.estimate)} (+${over.percent}%).`;

export const toPriceInput = (value: string) => {
  const amount = Number(value);

  return amount > 0 ? String(amount) : "";
};

const NAME_MAX = 150;
const DESCRIPTION_MAX = 250;

const lineSchema = z.object({
  name: z.string(),
  description: z.string(),
  quantity: z.string(),
  unitPrice: z.string(),
  unitId: z.string(),
  typeId: z.string(),
  roomId: z.string(),
});

export type OrderLine = z.infer<typeof lineSchema>;

export const LINE_FIELDS = [
  "name",
  "description",
  "quantity",
  "unitPrice",
  "unitId",
  "typeId",
  "roomId",
] as const satisfies readonly (keyof OrderLine)[];

export const orderFormSchema = z
  .object({
    purchaseRequestId: z.string(),
    supplierId: z.string(),
    orderDate: z.string(),
    currencyCode: z.string(),
    items: z.array(lineSchema),
  })
  .superRefine((values, ctx) => {
    const addIssue = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    if (!values.purchaseRequestId) {
      addIssue(["purchaseRequestId"], "Pilih permintaan pembelian");
    }
    if (!values.supplierId) addIssue(["supplierId"], "Pilih supplier");
    if (!values.orderDate) {
      addIssue(["orderDate"], "Isi tanggal pesanan");
    } else if (values.orderDate > todayJakarta()) {
      addIssue(["orderDate"], "Tanggal pesanan tidak boleh di masa depan");
    }
    if (!values.currencyCode) addIssue(["currencyCode"], "Pilih mata uang");

    if (values.items.length === 0) {
      addIssue(["items"], "Tambahkan minimal satu barang");
    } else if (values.items.length > MAX_LINES) {
      addIssue(["items"], `Maksimal ${MAX_LINES} barang per pesanan`);
    }

    values.items.forEach((line, index) => {
      const at = (field: keyof OrderLine) => ["items", index, field];
      const name = line.name.trim();
      const description = line.description.trim();

      if (!name) addIssue(at("name"), "Isi nama barang");
      else if (name.length > NAME_MAX) {
        addIssue(at("name"), `Nama barang maksimal ${NAME_MAX} karakter`);
      }
      if (!description) addIssue(at("description"), "Isi keterangan");
      else if (description.length > DESCRIPTION_MAX) {
        addIssue(
          at("description"),
          `Keterangan maksimal ${DESCRIPTION_MAX} karakter`,
        );
      }
      if (!(Number(line.quantity) > 0)) addIssue(at("quantity"), "Isi jumlah");
      if (!(Number(line.unitPrice) > 0)) {
        addIssue(at("unitPrice"), "Isi harga satuan");
      }
      if (!line.unitId) addIssue(at("unitId"), "Pilih satuan");
      if (!line.typeId) addIssue(at("typeId"), "Pilih tipe barang");
      if (!line.roomId) addIssue(at("roomId"), "Pilih ruang simpan");
    });
  });

export type OrderFormValues = z.infer<typeof orderFormSchema>;

export const emptyOrderForm = (): OrderFormValues => ({
  purchaseRequestId: "",
  supplierId: "",
  orderDate: todayJakarta(),
  currencyCode: BASE_CURRENCY,
  items: [],
});

export const newLine = (description = ""): OrderLine => ({
  name: "",
  description,
  quantity: "",
  unitPrice: "",
  unitId: "",
  typeId: "",
  roomId: "",
});

export const copyLinesOf = (
  request: RequestDetail,
  currencyCode: string,
): OrderLine[] =>
  request.items.slice(0, MAX_LINES).map((item) => ({
    ...newLine(request.purpose.slice(0, DESCRIPTION_MAX)),
    name: item.name.slice(0, NAME_MAX),
    quantity: String(item.quantity),
    unitPrice: isForeign(currencyCode)
      ? ""
      : toPriceInput(item.estimatedUnitPrice),
  }));

export const toOrderForm = (detail: OrderDetail): OrderFormValues => ({
  purchaseRequestId: String(detail.purchaseRequestId),
  supplierId: String(detail.supplierId),
  orderDate: toDateInput(detail.orderDate),
  currencyCode: detail.currencyCode,
  items: detail.items.map((item) => ({
    name: item.name,
    description: item.description,
    quantity: String(item.quantity),
    unitPrice: toPriceInput(item.unitPrice),
    unitId: String(item.unitId),
    typeId: String(item.typeId),
    roomId: String(item.roomId),
  })),
});

export const toOrderPayload = (values: OrderFormValues): OrderPayload => ({
  purchaseRequestId: Number(values.purchaseRequestId),
  supplierId: Number(values.supplierId),
  currencyCode: values.currencyCode,
  orderDate: values.orderDate,
  items: values.items.map((line) => ({
    name: line.name.trim(),
    description: line.description.trim(),
    quantity: Number(line.quantity),
    unitPrice: Number(line.unitPrice),
    typeId: Number(line.typeId),
    roomId: Number(line.roomId),
    unitId: Number(line.unitId),
  })),
});

export const orderTotalOf = (
  lines: readonly Pick<OrderLine, "quantity" | "unitPrice">[],
) =>
  round(
    lines.reduce(
      (sum, line) => sum + (lineAmount(line.quantity, line.unitPrice) ?? 0),
      0,
    ),
    4,
  );

export const lineSubtotalText = (
  line: Pick<OrderLine, "quantity" | "unitPrice">,
  currencyCode: string,
) => {
  const amount = lineAmount(line.quantity, line.unitPrice);

  return amount === null ? "—" : formatMoney(amount, currencyCode);
};

export const isEditable = (detail: OrderDetail) =>
  detail.status === "ISSUED" && detail.receipts.length === 0;

export const remainingOf = (detail: OrderDetail) =>
  detail.items.reduce((sum, item) => sum + item.remainingQuantity, 0);

export const statusNoteOf = (detail: OrderDetail) =>
  detail.closedShort
    ? `ditutup, ${formatNumber(remainingOf(detail))} tidak datang`
    : null;
