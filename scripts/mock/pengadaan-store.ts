/**
 * State mock bersama grup Pengadaan + Mata Uang (docs/design/pengadaan/README.md §4a TL-3).
 * Larik diisi agent fitur saat runtime; bentuk tampilan dan aturan milik TL.
 * Bentuk respons = be-sada sesudah gap §7a. Penerimaan menulis Inventaris hanya lewat
 * `receiveGoods` (barang ke ASSET, stok lewat `applyMovement`).
 */
import { addDays, addMonths, startOfMonth } from "../../src/lib/date";
import { SESSION_USER_ID } from "../mock-dashboard";

import { bapelOf } from "./fasilitas-store";
import {
  ASSET,
  MAINTENANCE,
  STOCK_ITEM,
  STOCK_MOVEMENT,
  SUPPLIER,
  TODAY,
  applyMovement,
  approvalRefOf,
  assetCodeOf,
  assetPhotoView,
  codeOf,
  isLive,
  roomRowOf,
  stockItemOf,
  supplierOf,
  typeItemOf,
  unitOf,
  userNameOf,
  type AssetPhoto,
  type Failure,
  type StockItemRow,
} from "./inventaris-store";
import { seedImage, seedPdf } from "./media";

export { SUPPLIER, TODAY, codeOf, isLive };

type Live = { id: number; deletedAt: string | null };

export type Attachment = AssetPhoto;

export type ApprovalState = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export type ApprovalRef = {
  id: number;
  publicId: string;
  code: string;
  status: ApprovalState;
  note: string | null;
  submittedAt: string;
  submittedBy: number;
};

export type PurchaseRequestStatus =
  "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

export type PurchaseRequestItem = {
  publicId: string;
  name: string;
  quantity: number;
  estimatedUnitPrice: number;
};

export type PurchaseRequestRow = Live & {
  publicId: string;
  code: string;
  status: PurchaseRequestStatus;
  bapelId: number;
  purpose: string;
  neededDate: string | null;
  requestedBy: number;
  createdAt: string;
  items: PurchaseRequestItem[];
  attachments: Attachment[];
  approvals: ApprovalRef[];
};

export type PurchaseOrderStatus =
  "ISSUED" | "PARTIALLY_RECEIVED" | "RECEIVED" | "CANCELLED";

export type RateSource = "AUTO" | "MANUAL";

export type OrderItem = {
  id: number;
  publicId: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  typeId: number;
  roomId: number;
  unitId: number;
};

export type PurchaseOrderRow = Live & {
  publicId: string;
  code: string;
  status: PurchaseOrderStatus;
  supplierId: number;
  purchaseRequestId: number;
  currencyCode: string;
  exchangeRate: number;
  rateSource: RateSource;
  rateDate: string;
  orderDate: string;
  createdAt: string;
  items: OrderItem[];
};

export type ReceiptItem = {
  id: number;
  publicId: string;
  purchaseOrderItemId: number;
  quantityReceived: number;
  assetId: number | null;
  stockItemId: number | null;
};

export type GoodsReceiptRow = {
  id: number;
  publicId: string;
  code: string;
  purchaseOrderId: number;
  receivedDate: string;
  receivedBy: number;
  note: string | null;
  createdAt: string;
  items: ReceiptItem[];
  attachments: Attachment[];
};

export type CurrencyRow = Live & {
  publicId: string;
  code: string;
  name: string;
  symbol: string;
  isBase: boolean;
};

export type RateRow = {
  id: number;
  publicId: string;
  currencyCode: string;
  rateDate: string;
  rate: number;
  source: RateSource;
};

export type ReceiveLine = {
  purchaseOrderItemId: number;
  quantityReceived: number;
  target: "ASSET" | "STOCK";
  stockItemId: number | null;
};

const pad = (value: number, size = 4) => String(value).padStart(size, "0");

const uuid = (group: string, id: number) =>
  `00000000-0000-4000-${group}-${pad(id, 12)}`;

const iso = (key: string | null) => (key ? `${key}T00:00:00.000Z` : null);

const stamp = (key: string) => `${key}T03:00:00.000Z`;

const day = (offset: number) => addDays(TODAY, offset);

const monthStart = (offset: number) => addMonths(startOfMonth(TODAY), offset);

const round2 = (value: number) => Math.round(value * 100) / 100;

const round4 = (value: number) => Math.round(value * 10_000) / 10_000;

// be-sada: Decimal Prisma = string desimal terpendek, tanpa nol di belakang.
export const decimal = (value: number, places = 2) =>
  String(Number(value.toFixed(places)));

export const money = (value: number) => decimal(value, 2);

const PERIOD_DAY = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dateLabel = (key: string) => PERIOD_DAY.format(new Date(iso(key) ?? ""));

const matches = (filter: string, ...values: (string | null | undefined)[]) =>
  !filter ||
  values.some((value) => value?.toLowerCase().includes(filter.toLowerCase()));

const named = (
  row: { publicId?: string; code: string; name: string } | undefined,
  group: string,
  id: number,
) =>
  row
    ? {
        publicId: row.publicId ?? uuid(group, id),
        code: row.code,
        name: row.name,
      }
    : null;

export const CURRENCY: CurrencyRow[] = [
  ["IDR", "Rupiah", "Rp", true],
  ["USD", "Dolar Amerika", "US$", false],
  ["SGD", "Dolar Singapura", "S$", false],
  ["EUR", "Euro", "€", false],
].map(([code, name, symbol, isBase], index) => ({
  id: index + 1,
  publicId: uuid("e100", index + 1),
  code: code as string,
  name: name as string,
  symbol: symbol as string,
  isBase: isBase as boolean,
  deletedAt: null,
}));

export const EXCHANGE_RATE: RateRow[] = (
  [
    ["USD", -23, 15_650],
    ["USD", -16, 15_700],
    ["USD", -9, 15_750],
    ["USD", -2, 15_800],
    ["SGD", -20, 12_100],
  ] as const
).map(([currencyCode, offset, rate], index) => ({
  id: index + 1,
  publicId: uuid("e200", index + 1),
  currencyCode,
  rateDate: day(offset),
  rate,
  source: "MANUAL" as const,
}));

export const currencyOf = (code: string) =>
  CURRENCY.find(
    (row) => isLive(row) && row.code.toLowerCase() === code.toLowerCase(),
  );

export const rateOn = (code: string, date: string) => {
  const currency = currencyOf(code);
  if (!currency) return null;
  if (currency.isBase) {
    return { rate: 1, rateDate: date, source: "MANUAL" as RateSource };
  }

  const found = EXCHANGE_RATE.filter(
    (row) => row.currencyCode === currency.code && row.rateDate <= date,
  ).sort(
    (a, b) =>
      b.rateDate.localeCompare(a.rateDate) ||
      b.source.localeCompare(a.source) ||
      b.id - a.id,
  )[0];

  return found
    ? { rate: found.rate, rateDate: found.rateDate, source: found.source }
    : null;
};

export const noRateMessage = (code: string) =>
  `Belum Ada Kurs ${code.toUpperCase()} Untuk Tanggal Tersebut. Isi Kursnya Terlebih Dahulu`;

export const kursPreview = (code: string, date: string) => {
  const found = rateOn(code, date);

  return found
    ? {
        currencyCode: code.toUpperCase(),
        rate: decimal(found.rate, 6),
        rateDate: iso(found.rateDate),
        source: found.source,
      }
    : null;
};

export const currencyView = (row: CurrencyRow) => {
  const latest = row.isBase
    ? undefined
    : EXCHANGE_RATE.filter((rate) => rate.currencyCode === row.code).sort(
        (a, b) => b.rateDate.localeCompare(a.rateDate) || b.id - a.id,
      )[0];

  return {
    id: row.id,
    publicId: row.publicId,
    code: row.code,
    name: row.name,
    symbol: row.symbol,
    isBase: row.isBase,
    latestRate: latest
      ? { rate: decimal(latest.rate, 6), rateDate: iso(latest.rateDate) }
      : null,
  };
};

export const rateView = (row: RateRow) => {
  const currency = currencyOf(row.currencyCode);

  return {
    id: row.id,
    publicId: row.publicId,
    currencyCode: row.currencyCode,
    rateDate: iso(row.rateDate),
    rate: decimal(row.rate, 6),
    source: row.source,
    currency: currency
      ? {
          publicId: currency.publicId,
          code: currency.code,
          name: currency.name,
        }
      : null,
  };
};

export const currencyDdl = () =>
  CURRENCY.filter(isLive)
    .sort(
      (a, b) =>
        Number(b.isBase) - Number(a.isBase) || a.code.localeCompare(b.code),
    )
    .map(({ code, name, symbol, isBase }) => ({ code, name, symbol, isBase }));

export const currencyInUse = (code: string) =>
  EXCHANGE_RATE.some((row) => row.currencyCode === code) ||
  PURCHASE_ORDER.some((row) => isLive(row) && row.currencyCode === code);

let attachmentCount = 0;

export const seedAttachment = (
  folder: string,
  label: string,
  options: { hue?: number; isPdf?: boolean } = {},
): Attachment => {
  attachmentCount += 1;
  const extension = options.isPdf ? "pdf" : "jpeg";
  const path = `${folder}/seed-${attachmentCount}.${extension}`;

  return {
    publicId: uuid("e300", attachmentCount),
    path,
    name: `${label}.${extension}`,
    mimeType: options.isPdf ? "application/pdf" : "image/jpeg",
    size: options.isPdf
      ? seedPdf(path)
      : seedImage(path, label, options.hue ?? 30, "portrait"),
  };
};

export const attachmentView = assetPhotoView;

const APPROVAL_BASE = 700;

let approvalCount = 0;

const newApproval = (
  status: ApprovalState,
  submittedAt: string,
  submittedBy: number,
  note: string | null = null,
): ApprovalRef => {
  approvalCount += 1;

  return {
    ...approvalRefOf(APPROVAL_BASE + approvalCount),
    status,
    note,
    submittedAt,
    submittedBy,
  };
};

export const PURCHASE_REQUEST: PurchaseRequestRow[] = [];

const requestTotalOf = (row: PurchaseRequestRow) =>
  round2(
    row.items.reduce(
      (sum, item) => sum + item.quantity * item.estimatedUnitPrice,
      0,
    ),
  );

let requestItemCount = 0;

export const requestItem = (
  name: string,
  quantity: number,
  estimatedUnitPrice: number,
): PurchaseRequestItem => {
  requestItemCount += 1;

  return {
    publicId: uuid("e400", requestItemCount),
    name,
    quantity,
    estimatedUnitPrice,
  };
};

const request = (
  seed: Omit<
    PurchaseRequestRow,
    "id" | "publicId" | "code" | "deletedAt" | "attachments" | "approvals"
  > & {
    attachments?: Attachment[];
    approval?: { status: ApprovalState; note?: string; daysAfter?: number };
  },
) => {
  const id = PURCHASE_REQUEST.length + 1;
  const { approval, ...rest } = seed;
  const row: PurchaseRequestRow = {
    id,
    publicId: uuid("e500", id),
    code: codeOf("PRQ", { yearly: true }),
    deletedAt: null,
    attachments: [],
    approvals: approval
      ? [
          newApproval(
            approval.status,
            stamp(
              addDays(seed.createdAt.slice(0, 10), approval.daysAfter ?? 1),
            ),
            seed.requestedBy,
            approval.note ?? null,
          ),
        ]
      : [],
    ...rest,
  };
  PURCHASE_REQUEST.push(row);

  return row;
};

export const purchaseRequestOf = (id: number) =>
  PURCHASE_REQUEST.find((row) => row.id === id && isLive(row));

export const purchaseRequestByCode = (code: string) =>
  PURCHASE_REQUEST.find(
    (row) => isLive(row) && row.code.toLowerCase() === code.toLowerCase(),
  );

export const latestApprovalOf = (row: PurchaseRequestRow) =>
  row.approvals.at(-1) ?? null;

export const PURCHASE_ORDER: PurchaseOrderRow[] = [];

let orderItemCount = 0;

export const orderItem = (
  seed: Omit<OrderItem, "id" | "publicId">,
): OrderItem => {
  orderItemCount += 1;

  return {
    id: orderItemCount,
    publicId: uuid("e600", orderItemCount),
    ...seed,
  };
};

const order = (
  seed: Omit<
    PurchaseOrderRow,
    | "id"
    | "publicId"
    | "code"
    | "deletedAt"
    | "exchangeRate"
    | "rateSource"
    | "rateDate"
    | "createdAt"
  >,
) => {
  const rate = rateOn(seed.currencyCode, seed.orderDate);
  const id = PURCHASE_ORDER.length + 1;
  const row: PurchaseOrderRow = {
    id,
    publicId: uuid("e700", id),
    code: codeOf("PO", { yearly: true }),
    deletedAt: null,
    exchangeRate: rate?.rate ?? 1,
    rateSource: rate?.source ?? "MANUAL",
    rateDate: rate?.rateDate ?? seed.orderDate,
    createdAt: stamp(seed.orderDate),
    ...seed,
  };
  PURCHASE_ORDER.push(row);

  return row;
};

export const purchaseOrderOf = (id: number) =>
  PURCHASE_ORDER.find((row) => row.id === id && isLive(row));

export const purchaseOrderByCode = (code: string) =>
  PURCHASE_ORDER.find(
    (row) => isLive(row) && row.code.toLowerCase() === code.toLowerCase(),
  );

export const GOODS_RECEIPT: GoodsReceiptRow[] = [];

let receiptItemCount = 0;

const receiptItem = (
  seed: Omit<ReceiptItem, "id" | "publicId">,
): ReceiptItem => {
  receiptItemCount += 1;

  return {
    id: receiptItemCount,
    publicId: uuid("e800", receiptItemCount),
    ...seed,
  };
};

export const goodsReceiptByCode = (code: string) =>
  GOODS_RECEIPT.find((row) => row.code.toLowerCase() === code.toLowerCase());

export const foreignTotalOf = (row: PurchaseOrderRow) =>
  round4(
    row.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
  );

export const idrTotalOf = (row: PurchaseOrderRow) =>
  round2(foreignTotalOf(row) * row.exchangeRate);

export const receivedQuantityOf = (itemId: number) =>
  GOODS_RECEIPT.flatMap((receipt) => receipt.items)
    .filter((item) => item.purchaseOrderItemId === itemId)
    .reduce((sum, item) => sum + item.quantityReceived, 0);

const liveOrdersOf = (requestId: number) =>
  PURCHASE_ORDER.filter(
    (row) =>
      isLive(row) &&
      row.purchaseRequestId === requestId &&
      row.status !== "CANCELLED",
  );

export const orderedTotalOf = (requestId: number, exceptOrderId?: number) =>
  round2(
    liveOrdersOf(requestId)
      .filter((row) => row.id !== exceptOrderId)
      .reduce((sum, row) => sum + idrTotalOf(row), 0),
  );

export const orderStatusOf = (row: PurchaseOrderRow): PurchaseOrderStatus => {
  const received = row.items.map((item) => receivedQuantityOf(item.id));

  if (received.every((quantity) => quantity === 0)) return "ISSUED";

  return row.items.every(
    (item, index) => (received[index] ?? 0) >= item.quantity,
  )
    ? "RECEIVED"
    : "PARTIALLY_RECEIVED";
};

export const isClosedShort = (row: PurchaseOrderRow) =>
  row.status === "RECEIVED" &&
  row.items.some((item) => receivedQuantityOf(item.id) < item.quantity);

const unitPriceIdr = (row: PurchaseOrderRow, item: OrderItem) =>
  round2(item.unitPrice * row.exchangeRate);

const PROYEKTOR = ASSET.find((row) => row.serialNumber === "X51-7Q2K9031");
const stockNamed = (name: string) =>
  STOCK_ITEM.find((row) => row.name === name) as StockItemRow;
const KERTAS = stockNamed("Kertas HVS A4");
const KIDUNG = stockNamed("Kidung Jemaat");
const LILIN = stockNamed("Lilin Altar");

const MAJELIS = 1;
const PEMUDA = 2;
const WANITA = 3;
const MUSIK = 5;
const GEDUNG = 1;
const AULA = 2;
const TYPE = { ELEKTRONIK: 1, MUSIK: 2, MEBEL: 3, ATK: 5, IBADAH: 6 } as const;
const UNIT_ID = { BUAH: 1, RIM: 4 } as const;

const PR_STOK = request({
  status: "APPROVED",
  bapelId: MAJELIS,
  purpose: "Kertas, kidung, dan lilin untuk ibadah",
  neededDate: day(-45),
  requestedBy: 11,
  createdAt: stamp(day(-55)),
  items: [
    requestItem("Kertas HVS A4 80 gram", 10, 50_000),
    requestItem("Kidung Jemaat", 20, 80_000),
    requestItem("Lilin Altar", 24, 15_000),
  ],
  approval: { status: "APPROVED", daysAfter: 2 },
});

const PR_PROYEKTOR = request({
  status: "APPROVED",
  bapelId: MAJELIS,
  purpose: "Proyektor cadangan ruang ibadah dan kertas warta",
  neededDate: null,
  requestedBy: 12,
  createdAt: stamp(addDays(monthStart(-14), -12)),
  items: [
    requestItem("Proyektor Epson EB-X51", 2, 8_750_000),
    requestItem("Kertas HVS A4 80 gram", 20, 50_000),
  ],
  approval: { status: "APPROVED", daysAfter: 3 },
});

request({
  status: "APPROVED",
  bapelId: PEMUDA,
  purpose: "Perlengkapan retret pemuda Oktober",
  neededDate: day(20),
  requestedBy: 16,
  createdAt: stamp(day(-6)),
  items: [
    requestItem("Tenda dome kapasitas 6 orang", 4, 950_000),
    requestItem("Matras gulung", 20, 85_000),
  ],
  approval: { status: "APPROVED", daysAfter: 2 },
});

const PR_SOUND = request({
  status: "APPROVED",
  bapelId: MUSIK,
  purpose: "Peralatan sound ibadah raya",
  neededDate: day(30),
  requestedBy: 16,
  createdAt: stamp(day(-12)),
  items: [
    requestItem("Mixer digital 32 kanal", 1, 15_000_000),
    requestItem("Mikrofon wireless", 2, 3_500_000),
  ],
  approval: { status: "APPROVED", daysAfter: 4 },
});

const PR_KURSI = request({
  status: "APPROVED",
  bapelId: MAJELIS,
  purpose: "Kursi lipat tambahan untuk aula",
  neededDate: day(10),
  requestedBy: 12,
  createdAt: stamp(day(-20)),
  items: [requestItem("Kursi lipat Chitose", 40, 200_000)],
  approval: { status: "APPROVED", daysAfter: 3 },
});

request({
  status: "PENDING_APPROVAL",
  bapelId: WANITA,
  purpose: "Perlengkapan dapur persekutuan kaum ibu",
  neededDate: day(14),
  requestedBy: 14,
  createdAt: stamp(day(-1)),
  items: [
    requestItem("Panci besar stainless 50 liter", 2, 650_000),
    requestItem("Termos nasi 20 liter", 3, 425_000),
  ],
  approval: { status: "PENDING", daysAfter: 0 },
});

request({
  status: "PENDING_APPROVAL",
  bapelId: PEMUDA,
  purpose: "Proyektor portabel untuk persekutuan pemuda",
  neededDate: day(21),
  requestedBy: SESSION_USER_ID,
  createdAt: stamp(day(-1)),
  items: [requestItem("Proyektor portabel", 1, 6_500_000)],
  approval: { status: "PENDING", daysAfter: 0 },
});

request({
  status: "REJECTED",
  bapelId: PEMUDA,
  purpose: "Kaos seragam pelayan pemuda",
  neededDate: null,
  requestedBy: 14,
  createdAt: stamp(day(-9)),
  items: [requestItem("Kaos seragam", 30, 95_000)],
  approval: {
    status: "REJECTED",
    daysAfter: 2,
    note: "Kas komisi belum cukup bulan ini. Ajukan kembali awal bulan depan.",
  },
});

request({
  status: "DRAFT",
  bapelId: PEMUDA,
  purpose: "Alat musik ibadah pemuda",
  neededDate: day(30),
  requestedBy: SESSION_USER_ID,
  createdAt: stamp(day(-2)),
  items: [
    requestItem("Cajon", 1, 1_250_000),
    requestItem("Tamborin", 2, 175_000),
    requestItem("Stand partitur", 4, 150_000),
  ],
  attachments: [
    seedAttachment("purchase-request", "Penawaran Toko Musik", { hue: 25 }),
  ],
});

order({
  status: "RECEIVED",
  supplierId: 5,
  purchaseRequestId: PR_STOK.id,
  currencyCode: "IDR",
  orderDate: day(-50),
  items: [
    orderItem({
      name: "Kertas HVS A4",
      description: "80 gram, isi 500 lembar",
      quantity: 10,
      unitPrice: 55_000,
      typeId: TYPE.ATK,
      roomId: AULA,
      unitId: UNIT_ID.RIM,
    }),
    orderItem({
      name: "Kidung Jemaat",
      description: "Edisi not angka",
      quantity: 20,
      unitPrice: 85_000,
      typeId: TYPE.IBADAH,
      roomId: GEDUNG,
      unitId: UNIT_ID.BUAH,
    }),
  ],
});

order({
  status: "RECEIVED",
  supplierId: 5,
  purchaseRequestId: PR_STOK.id,
  currencyCode: "IDR",
  orderDate: day(-45),
  items: [
    orderItem({
      name: "Lilin Altar",
      description: "Lilin putih 30 cm",
      quantity: 24,
      unitPrice: 16_000,
      typeId: TYPE.IBADAH,
      roomId: GEDUNG,
      unitId: UNIT_ID.BUAH,
    }),
  ],
});

order({
  status: "PARTIALLY_RECEIVED",
  supplierId: 1,
  purchaseRequestId: PR_PROYEKTOR.id,
  currencyCode: "IDR",
  orderDate: addDays(monthStart(-14), -5),
  items: [
    orderItem({
      name: "Proyektor Epson EB-X51",
      description: "3.600 lumen, termasuk bracket plafon",
      quantity: 2,
      unitPrice: PROYEKTOR?.acquisitionCost ?? 8_500_000,
      typeId: TYPE.ELEKTRONIK,
      roomId: GEDUNG,
      unitId: UNIT_ID.BUAH,
    }),
    orderItem({
      name: "Kertas HVS A4",
      description: "80 gram, isi 500 lembar",
      quantity: 20,
      unitPrice: 52_000,
      typeId: TYPE.ATK,
      roomId: AULA,
      unitId: UNIT_ID.RIM,
    }),
  ],
});

order({
  status: "ISSUED",
  supplierId: 2,
  purchaseRequestId: PR_SOUND.id,
  currencyCode: "USD",
  orderDate: day(-3),
  items: [
    orderItem({
      name: "Mixer Behringer X32",
      description: "Impor, garansi distributor 1 tahun",
      quantity: 1,
      unitPrice: 1_041,
      typeId: TYPE.MUSIK,
      roomId: GEDUNG,
      unitId: UNIT_ID.BUAH,
    }),
  ],
});

order({
  status: "CANCELLED",
  supplierId: 7,
  purchaseRequestId: PR_KURSI.id,
  currencyCode: "IDR",
  orderDate: day(-15),
  items: [
    orderItem({
      name: "Kursi lipat Chitose",
      description: "Rangka besi, dudukan busa",
      quantity: 40,
      unitPrice: 200_000,
      typeId: TYPE.MEBEL,
      roomId: AULA,
      unitId: UNIT_ID.BUAH,
    }),
  ],
});

order({
  status: "ISSUED",
  supplierId: 6,
  purchaseRequestId: PR_KURSI.id,
  currencyCode: "IDR",
  orderDate: day(-5),
  items: [
    orderItem({
      name: "Kursi lipat Chitose",
      description: "Rangka besi, dudukan busa",
      quantity: 40,
      unitPrice: 215_000,
      typeId: TYPE.MEBEL,
      roomId: AULA,
      unitId: UNIT_ID.BUAH,
    }),
  ],
});

const seedReceipt = (
  orderRow: PurchaseOrderRow,
  receivedDate: string,
  lines: {
    index: number;
    quantity: number;
    assetId?: number;
    stockItemId?: number;
  }[],
  extra: Partial<GoodsReceiptRow> = {},
) => {
  const id = GOODS_RECEIPT.length + 1;
  GOODS_RECEIPT.push({
    id,
    publicId: uuid("e900", id),
    code: codeOf("GRN", { yearly: true }),
    purchaseOrderId: orderRow.id,
    receivedDate,
    receivedBy: 12,
    note: null,
    createdAt: stamp(receivedDate),
    attachments: [],
    items: lines.map((line) =>
      receiptItem({
        purchaseOrderItemId: orderRow.items[line.index]?.id ?? 0,
        quantityReceived: line.quantity,
        assetId: line.assetId ?? null,
        stockItemId: line.stockItemId ?? null,
      }),
    ),
    ...extra,
  });
};

const [PO_STOK, PO_LILIN, PO_PROYEKTOR] = PURCHASE_ORDER;

if (PO_STOK && PO_LILIN && PO_PROYEKTOR && PROYEKTOR) {
  seedReceipt(
    PO_STOK,
    day(-45),
    [
      { index: 0, quantity: 10, stockItemId: KERTAS.id },
      { index: 1, quantity: 20, stockItemId: KIDUNG.id },
    ],
    {
      note: "Dus kertas agak basah di satu sisi.",
      attachments: [
        seedAttachment("goods-receipt", "Nota Toko Buku Agape", { hue: 45 }),
        seedAttachment("goods-receipt", "Surat jalan", { isPdf: true }),
      ],
    },
  );
  seedReceipt(PO_LILIN, day(-40), [
    { index: 0, quantity: 24, stockItemId: LILIN.id },
  ]);
  seedReceipt(PO_PROYEKTOR, PROYEKTOR.acquisitionDate ?? monthStart(-14), [
    { index: 0, quantity: 1, assetId: PROYEKTOR.id },
  ]);
}

const isRequestedByViewer = (row: PurchaseRequestRow) =>
  row.requestedBy === SESSION_USER_ID;

export const purchaseRequestView = (
  row: PurchaseRequestRow,
  isDetail = false,
) => {
  const bapel = bapelOf(row.bapelId);
  const approval = latestApprovalOf(row);
  const base = {
    id: row.id,
    publicId: row.publicId,
    code: row.code,
    status: row.status,
    purpose: row.purpose,
    neededDate: iso(row.neededDate),
    totalEstimatedIDR: money(requestTotalOf(row)),
    bapelId: row.bapelId,
    bapel: bapel
      ? { publicId: uuid("e050", bapel.id), code: bapel.code, name: bapel.name }
      : null,
    programId: null,
    program: null,
    requestedBy: userNameOf(row.requestedBy),
    isRequestedByViewer: isRequestedByViewer(row),
    approval: approval
      ? {
          publicId: approval.publicId,
          code: approval.code,
          status: approval.status,
          note: approval.note,
          isSubmittedByViewer: approval.submittedBy === SESSION_USER_ID,
        }
      : null,
    createdAt: row.createdAt,
  };

  if (!isDetail) return { ...base, itemCount: row.items.length };

  return {
    ...base,
    items: row.items.map((item) => ({
      publicId: item.publicId,
      name: item.name,
      quantity: item.quantity,
      estimatedUnitPrice: money(item.estimatedUnitPrice),
      currencyCode: "IDR",
    })),
    orderedTotalIDR: money(orderedTotalOf(row.id)),
    orders: PURCHASE_ORDER.filter(
      (orderRow) => isLive(orderRow) && orderRow.purchaseRequestId === row.id,
    ).map((orderRow) => ({
      code: orderRow.code,
      status: orderRow.status,
      totalIDR: money(idrTotalOf(orderRow)),
    })),
    attachments: row.attachments.map(attachmentView),
  };
};

export const copyPurchaseRequest = (code: string) => {
  const row = purchaseRequestByCode(code);

  return row && row.status === "REJECTED"
    ? {
        bapelId: row.bapelId,
        purpose: row.purpose,
        neededDate:
          row.neededDate && row.neededDate >= TODAY ? row.neededDate : null,
        items: row.items.map(({ name, quantity, estimatedUnitPrice }) => ({
          name,
          quantity,
          estimatedUnitPrice,
        })),
      }
    : null;
};

export const submitPurchaseRequest = (
  row: PurchaseRequestRow,
): { row: PurchaseRequestRow } | { failure: Failure } => {
  if (latestApprovalOf(row)?.status === "PENDING") {
    return {
      failure: {
        status: 400,
        message:
          "Permintaan Pembelian Ini Sedang Menunggu Persetujuan. Tarik Pengajuannya Terlebih Dahulu",
      },
    };
  }
  if (row.status === "REJECTED") {
    return {
      failure: {
        status: 400,
        message:
          "Permintaan Pembelian Ini Sudah Ditolak. Ajukan Ulang Sebagai Permintaan Baru",
      },
    };
  }
  if (row.status !== "DRAFT") {
    return {
      failure: {
        status: 400,
        message: "Permintaan Pembelian Ini Sudah Diajukan",
      },
    };
  }
  if (process.env.MOCK_PR_NO_WORKFLOW) {
    return {
      failure: {
        status: 400,
        message: "Belum Ada Alur Persetujuan Untuk Dokumen Dengan Nominal Ini",
      },
    };
  }

  row.approvals.push(
    newApproval("PENDING", new Date().toISOString(), SESSION_USER_ID),
  );
  row.status = "PENDING_APPROVAL";

  return { row };
};

export const decidePurchaseRequest = (
  key: string,
  decision: Exclude<ApprovalState, "PENDING">,
  note: string | null = null,
) => {
  const row = PURCHASE_REQUEST.find(
    (item) =>
      item.code === key ||
      item.approvals.some((approval) => approval.publicId === key),
  );
  const approval = row ? latestApprovalOf(row) : null;
  if (!row || !approval || approval.status !== "PENDING") return null;

  approval.status = decision;
  approval.note = decision === "REJECTED" ? note : null;
  row.status =
    decision === "APPROVED"
      ? "APPROVED"
      : decision === "REJECTED"
        ? "REJECTED"
        : "DRAFT";

  return row;
};

export const requestTotalIdr = requestTotalOf;

export const purchaseRequestDdl = (params: {
  filter: string;
  limit: number | null;
}) => {
  const rows = PURCHASE_REQUEST.filter(
    (row) =>
      isLive(row) &&
      row.status === "APPROVED" &&
      matches(params.filter, row.code, row.purpose),
  )
    .sort((a, b) => b.code.localeCompare(a.code))
    .map((row) => {
      const bapel = bapelOf(row.bapelId);

      return {
        id: row.id,
        code: row.code,
        purpose: row.purpose,
        bapel: bapel ? { id: bapel.id, name: bapel.name } : null,
        totalEstimatedIDR: money(requestTotalOf(row)),
        orderedTotalIDR: money(orderedTotalOf(row.id)),
      };
    });

  return params.limit === null ? rows : rows.slice(0, params.limit);
};

const currencyRef = (code: string) => {
  const currency = currencyOf(code);

  return currency
    ? { code: currency.code, name: currency.name, symbol: currency.symbol }
    : null;
};

export const purchaseOrderView = (row: PurchaseOrderRow, isDetail = false) => {
  const supplier = SUPPLIER.find((item) => item.id === row.supplierId);
  const requestRow = PURCHASE_REQUEST.find(
    (item) => item.id === row.purchaseRequestId,
  );
  const bapel = requestRow ? bapelOf(requestRow.bapelId) : undefined;
  const receivedTotal = round2(
    row.items.reduce(
      (sum, item) =>
        sum + receivedQuantityOf(item.id) * unitPriceIdr(row, item),
      0,
    ),
  );
  const base = {
    id: row.id,
    publicId: row.publicId,
    code: row.code,
    status: row.status,
    orderDate: iso(row.orderDate),
    rateDate: iso(row.rateDate),
    supplierId: row.supplierId,
    supplier: named(supplier, "d800", row.supplierId),
    currencyCode: row.currencyCode,
    currency: currencyRef(row.currencyCode),
    exchangeRate: decimal(row.exchangeRate, 6),
    rateSource: row.rateSource,
    totalForeignCurrency: decimal(foreignTotalOf(row), 4),
    totalIDR: money(idrTotalOf(row)),
    closedShort: isClosedShort(row),
    purchaseRequestId: row.purchaseRequestId,
    purchaseRequest: requestRow
      ? {
          publicId: requestRow.publicId,
          code: requestRow.code,
          purpose: requestRow.purpose,
          bapel: bapel ? { name: bapel.name } : null,
          totalEstimatedIDR: money(requestTotalOf(requestRow)),
        }
      : null,
  };

  if (!isDetail) return { ...base, itemCount: row.items.length };

  return {
    ...base,
    purchaseRequest:
      base.purchaseRequest && requestRow
        ? {
            ...base.purchaseRequest,
            orderedTotalIDR: money(orderedTotalOf(requestRow.id, row.id)),
          }
        : null,
    receivedTotalIDR: money(receivedTotal),
    items: row.items.map((item) => {
      const received = receivedQuantityOf(item.id);

      return {
        id: item.id,
        publicId: item.publicId,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: decimal(item.unitPrice, 4),
        typeId: item.typeId,
        roomId: item.roomId,
        unitId: item.unitId,
        type: named(typeItemOf(item.typeId), "d100", item.typeId),
        room: named(roomRowOf(item.roomId), "d900", item.roomId),
        unit: named(unitOf(item.unitId), "d200", item.unitId),
        receivedQuantity: received,
        remainingQuantity: Math.max(0, item.quantity - received),
      };
    }),
    receipts: GOODS_RECEIPT.filter(
      (receipt) => receipt.purchaseOrderId === row.id,
    )
      .sort((a, b) => a.receivedDate.localeCompare(b.receivedDate))
      .map((receipt) => ({
        code: receipt.code,
        receivedDate: iso(receipt.receivedDate),
      })),
  };
};

export const purchaseOrderDdl = (params: {
  filter: string;
  isOpen: boolean;
  supplierId: number | null;
  limit?: number | null;
}) => {
  const rows = PURCHASE_ORDER.filter(
    (row) =>
      isLive(row) &&
      (!params.isOpen ||
        row.status === "ISSUED" ||
        row.status === "PARTIALLY_RECEIVED") &&
      (params.supplierId === null || row.supplierId === params.supplierId) &&
      matches(params.filter, row.code, supplierOf(row.supplierId)?.name),
  )
    .sort((a, b) => b.orderDate.localeCompare(a.orderDate) || b.id - a.id)
    .map((row) => {
      const supplier = SUPPLIER.find((item) => item.id === row.supplierId);

      return {
        id: row.id,
        code: row.code,
        status: row.status,
        supplier: supplier ? { id: supplier.id, name: supplier.name } : null,
        totalIDR: money(idrTotalOf(row)),
        currencyCode: row.currencyCode,
      };
    });

  return params.limit ? rows.slice(0, params.limit) : rows;
};

export const goodsReceiptView = (row: GoodsReceiptRow, isDetail = false) => {
  const orderRow = PURCHASE_ORDER.find(
    (item) => item.id === row.purchaseOrderId,
  );
  const supplier = orderRow
    ? SUPPLIER.find((item) => item.id === orderRow.supplierId)
    : undefined;
  const base = {
    id: row.id,
    publicId: row.publicId,
    code: row.code,
    receivedDate: iso(row.receivedDate),
    note: row.note,
    receivedBy: userNameOf(row.receivedBy),
    purchaseOrder: orderRow
      ? {
          publicId: orderRow.publicId,
          code: orderRow.code,
          status: orderRow.status,
          currencyCode: orderRow.currencyCode,
          exchangeRate: decimal(orderRow.exchangeRate, 6),
          supplier: named(supplier, "d800", orderRow.supplierId),
        }
      : null,
  };

  if (!isDetail) {
    const lines = new Set(row.items.map((item) => item.purchaseOrderItemId));

    return { ...base, itemCount: lines.size };
  }

  return {
    ...base,
    items: row.items.map((item) => {
      const line = orderRow?.items.find(
        (one) => one.id === item.purchaseOrderItemId,
      );
      const asset =
        item.assetId === null
          ? undefined
          : ASSET.find((one) => one.id === item.assetId);
      const stock =
        item.stockItemId === null
          ? undefined
          : STOCK_ITEM.find((one) => one.id === item.stockItemId);

      return {
        id: item.id,
        publicId: item.publicId,
        quantityReceived: item.quantityReceived,
        purchaseOrderItemId: item.purchaseOrderItemId,
        assetId: item.assetId,
        stockItemId: item.stockItemId,
        purchaseOrderItem: line
          ? {
              publicId: line.publicId,
              name: line.name,
              quantity: line.quantity,
            }
          : null,
        unitPrice: line ? decimal(line.unitPrice, 4) : null,
        unitPriceIDR:
          line && orderRow ? money(unitPriceIdr(orderRow, line)) : null,
        unit: line ? named(unitOf(line.unitId), "d200", line.unitId) : null,
        asset: asset
          ? { publicId: asset.publicId, code: asset.code, name: asset.name }
          : null,
        stockItem: stock
          ? { publicId: stock.publicId, code: stock.code, name: stock.name }
          : null,
      };
    }),
    attachments: row.attachments.map(attachmentView),
  };
};

const lastMovementDateOf = (stockItemId: number) =>
  STOCK_MOVEMENT.filter((row) => row.stockItemId === stockItemId)
    .map((row) => row.movementDate)
    .sort()
    .at(-1) ?? null;

const lineFailure = (
  index: number,
  field: string,
  status: number,
  message: string,
): { failure: Failure } => ({
  failure: { status, message, path: `items.${index}.${field}` },
});

const MAX_ASSETS_PER_LINE = 50;

// Urutan cek = penerimaan_barang.service.ts sesudah B5/B11/B12/B14; semua dicek sebelum menulis.
export const receiveGoods = (input: {
  purchaseOrderId: number;
  receivedDate: string;
  note: string | null;
  items: ReceiveLine[];
  attachments: Attachment[];
}): { receipt: GoodsReceiptRow } | { failure: Failure } => {
  const orderRow = purchaseOrderOf(input.purchaseOrderId);
  if (!orderRow) {
    return {
      failure: {
        status: 404,
        path: "purchaseOrderId",
        message: "Pesanan Pembelian Tidak Ditemukan",
      },
    };
  }
  if (
    orderRow.status !== "ISSUED" &&
    orderRow.status !== "PARTIALLY_RECEIVED"
  ) {
    return {
      failure: {
        status: 400,
        path: "purchaseOrderId",
        message: "Pesanan Ini Sudah Selesai Atau Dibatalkan",
      },
    };
  }
  if (input.receivedDate < orderRow.orderDate) {
    return {
      failure: {
        status: 400,
        path: "receivedDate",
        message: "Tanggal Terima Tidak Boleh Sebelum Tanggal Pesanan",
      },
    };
  }
  if (process.env.MOCK_RECEIPT_RACE) {
    const line = orderRow.items[0];

    return lineFailure(
      0,
      "quantityReceived",
      400,
      `Jumlah Diterima Untuk ${line?.name ?? "-"} Melebihi Jumlah Yang Dipesan (dipesan ${line?.quantity ?? 0}, sudah diterima ${line?.quantity ?? 0})`,
    );
  }

  const seen = new Map<number, number>();

  for (const [index, item] of input.items.entries()) {
    const first = seen.get(item.purchaseOrderItemId);
    if (first !== undefined) {
      return lineFailure(
        index,
        "purchaseOrderItemId",
        400,
        `Barang Sudah Ada Di Baris ${first + 1}`,
      );
    }
    seen.set(item.purchaseOrderItemId, index);

    const line = orderRow.items.find(
      (one) => one.id === item.purchaseOrderItemId,
    );
    if (!line) {
      return lineFailure(
        index,
        "purchaseOrderItemId",
        404,
        "Baris Pesanan Tidak Ditemukan",
      );
    }

    const taken = receivedQuantityOf(line.id);
    if (taken + item.quantityReceived > line.quantity) {
      return lineFailure(
        index,
        "quantityReceived",
        400,
        `Jumlah Diterima Untuk ${line.name} Melebihi Jumlah Yang Dipesan (dipesan ${line.quantity}, sudah diterima ${taken})`,
      );
    }
    if (
      item.target === "ASSET" &&
      item.quantityReceived > MAX_ASSETS_PER_LINE
    ) {
      return lineFailure(
        index,
        "quantityReceived",
        400,
        "Maksimal 50 Barang Per Baris",
      );
    }
    if (item.target === "STOCK" && item.stockItemId !== null) {
      const stock = stockItemOf(item.stockItemId);
      if (!stock) {
        return lineFailure(
          index,
          "stockItemId",
          404,
          "Barang Persediaan Tidak Ditemukan",
        );
      }
      if (stock.unitId !== line.unitId) {
        return lineFailure(
          index,
          "stockItemId",
          400,
          `Satuan Barang Persediaan Berbeda Dengan Pesanan (${unitOf(stock.unitId)?.name ?? "-"} / ${unitOf(line.unitId)?.name ?? "-"})`,
        );
      }

      const last = lastMovementDateOf(stock.id);
      if (last && input.receivedDate < last) {
        return lineFailure(
          index,
          "stockItemId",
          400,
          `Tanggal Terima Tidak Boleh Sebelum ${dateLabel(last)}`,
        );
      }
    }
  }

  const requestRow = purchaseRequestOf(orderRow.purchaseRequestId);
  const bapelId = requestRow?.bapelId ?? 1;
  const id = GOODS_RECEIPT.length + 1;
  const code = codeOf("GRN", { yearly: true });
  const now = new Date().toISOString();
  const items: ReceiptItem[] = [];

  for (const item of input.items) {
    const line = orderRow.items.find(
      (one) => one.id === item.purchaseOrderItemId,
    ) as OrderItem;
    const price = unitPriceIdr(orderRow, line);

    if (item.target === "ASSET") {
      for (let unit = 0; unit < item.quantityReceived; unit += 1) {
        const assetId = Math.max(0, ...ASSET.map((row) => row.id)) + 1;
        ASSET.push({
          id: assetId,
          publicId: uuid("e950", assetId),
          code: assetCodeOf(line.typeId, bapelId),
          name: line.name,
          description: line.description,
          serialNumber: null,
          condition: "BAIK",
          warrantyUntil: null,
          acquisitionSource: "PURCHASE",
          donorName: null,
          acquisitionDate: input.receivedDate,
          acquisitionCost: price,
          isDepreciable: false,
          salvageValue: null,
          usefulLifeMonths: null,
          depreciationStartDate: null,
          openingAccumulatedDepreciation: null,
          openingAccumulatedAsOf: null,
          typeId: line.typeId,
          bapelId,
          roomId: line.roomId,
          mainImage: null,
          detailImage: [],
          deletedAt: null,
        });
        items.push(
          receiptItem({
            purchaseOrderItemId: line.id,
            quantityReceived: 1,
            assetId,
            stockItemId: null,
          }),
        );
      }
      continue;
    }

    let stock =
      item.stockItemId === null ? undefined : stockItemOf(item.stockItemId);
    if (!stock) {
      const stockId = Math.max(0, ...STOCK_ITEM.map((row) => row.id)) + 1;
      stock = {
        id: stockId,
        publicId: uuid("e960", stockId),
        code: codeOf("BRP"),
        name: line.name,
        description: line.description,
        quantity: 0,
        reorderPoint: null,
        lastUnitPrice: price,
        typeId: line.typeId,
        bapelId,
        roomId: line.roomId,
        unitId: line.unitId,
        deletedAt: null,
      };
      STOCK_ITEM.push(stock);
    }

    applyMovement(stock.id, {
      type: "IN",
      source: "GOODS_RECEIPT",
      quantity: item.quantityReceived,
      movementDate: input.receivedDate,
      note: `Penerimaan ${code}`,
    });
    stock.lastUnitPrice = price;
    items.push(
      receiptItem({
        purchaseOrderItemId: line.id,
        quantityReceived: item.quantityReceived,
        assetId: null,
        stockItemId: stock.id,
      }),
    );
  }

  const receipt: GoodsReceiptRow = {
    id,
    publicId: uuid("e900", id),
    code,
    purchaseOrderId: orderRow.id,
    receivedDate: input.receivedDate,
    receivedBy: SESSION_USER_ID,
    note: input.note,
    createdAt: now,
    items,
    attachments: input.attachments,
  };
  GOODS_RECEIPT.push(receipt);
  orderRow.status = orderStatusOf(orderRow);

  return { receipt };
};

export const supplierInUse = (supplierId: number) =>
  PURCHASE_ORDER.some((row) => isLive(row) && row.supplierId === supplierId) ||
  MAINTENANCE.some((row) => isLive(row) && row.supplierId === supplierId);
