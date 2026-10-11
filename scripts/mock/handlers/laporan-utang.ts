/**
 * Tiruan `/api/v1/laporan-utang` (be-sada `modules/laporan_utang`) di atas
 * SUPPLIER_INVOICE store Pengadaan. Menjawab 200 dengan nol, tidak pernah 404.
 *
 *   MOCK_EMPTY=1  → tidak ada utang, tetap 200
 *   MOCK_500=1    → menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { isLive, supplierOf } from "../inventaris-store";
import { denied, json, type MockHandler } from "../kit";
import { SUPPLIER_INVOICE, type SupplierInvoiceRow } from "../pengadaan-store";

const BUCKETS = ["current", "d1to30", "d31to60", "d61to90", "over90"] as const;

type Bucket = (typeof BUCKETS)[number];

const DAY_MS = 24 * 60 * 60 * 1000;

const PAYABLE = new Set(["AWAITING_PAYMENT", "PARTIALLY_PAID"]);

const dateKey = (value: string) => value.slice(0, 10);

const amount = (value: number) => String(Number(value.toFixed(2)));

const bucketOf = (daysLate: number): Bucket => {
  if (daysLate <= 0) return "current";
  if (daysLate <= 30) return "d1to30";
  if (daysLate <= 60) return "d31to60";
  if (daysLate <= 90) return "d61to90";
  return "over90";
};

const emptyBuckets = () =>
  Object.fromEntries(BUCKETS.map((key) => [key, 0])) as Record<Bucket, number>;

const shaped = (buckets: Record<Bucket, number>) =>
  Object.fromEntries(
    BUCKETS.map((key) => [key, amount(buckets[key])]),
  ) as Record<Bucket, string>;

const isOpenAt = (row: SupplierInvoiceRow, asOf: string) =>
  isLive(row) && PAYABLE.has(row.status) && dateKey(row.invoiceDate) <= asOf;

export const laporanUtangMock: MockHandler = (ctx) => {
  const { path, method, url, can } = ctx;

  if (path !== "/laporan-utang") return null;
  if (method !== "GET") return null;
  if (!can(MENU.AP_AGING, "VIEW")) return denied();

  if (process.env.MOCK_500) {
    return json({ status: 500, error: "Internal Server Error" }, 500);
  }

  const date = url.searchParams.get("date");

  if (!date) {
    return json({ status: 400, error: "Mohon Lengkapi Tanggal Laporan" }, 400);
  }

  const asOf = dateKey(date);
  const asOfMs = new Date(`${asOf}T00:00:00.000Z`).getTime();

  const grouped = new Map<
    number,
    {
      supplier: { id: number; code: string; name: string };
      buckets: Record<Bucket, number>;
      invoiceCount: number;
      oldestDueDate: string | null;
      total: number;
    }
  >();

  const open = process.env.MOCK_EMPTY
    ? []
    : SUPPLIER_INVOICE.filter((row) => isOpenAt(row, asOf));

  for (const row of open) {
    const outstanding = Number(row.totalIDR) - Number(row.paidAmountIDR);

    if (outstanding <= 0) continue;

    const supplier = supplierOf(row.supplierId);

    if (!supplier) continue;

    const due = dateKey(row.dueDate);
    const daysLate = Math.floor(
      (asOfMs - new Date(`${due}T00:00:00.000Z`).getTime()) / DAY_MS,
    );

    const existing = grouped.get(supplier.id) ?? {
      supplier: { id: supplier.id, code: supplier.code, name: supplier.name },
      buckets: emptyBuckets(),
      invoiceCount: 0,
      oldestDueDate: null,
      total: 0,
    };

    existing.buckets[bucketOf(daysLate)] += outstanding;
    existing.total += outstanding;
    existing.invoiceCount += 1;
    existing.oldestDueDate =
      existing.oldestDueDate === null || due < existing.oldestDueDate
        ? due
        : existing.oldestDueDate;

    grouped.set(supplier.id, existing);
  }

  const rows = [...grouped.values()].sort((left, right) =>
    right.total === left.total ? 0 : right.total - left.total,
  );

  const totals = rows.reduce(
    (sum, row) => {
      for (const key of BUCKETS) sum.buckets[key] += row.buckets[key];
      sum.total += row.total;

      return sum;
    },
    { buckets: emptyBuckets(), total: 0 },
  );

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Umur Utang Supplier",
    data: {
      date: asOf,
      rows: rows.map((row) => ({
        supplier: row.supplier,
        buckets: shaped(row.buckets),
        invoiceCount: row.invoiceCount,
        oldestDueDate: row.oldestDueDate
          ? `${row.oldestDueDate}T00:00:00.000Z`
          : null,
        total: amount(row.total),
      })),
      totals: { buckets: shaped(totals.buckets), total: amount(totals.total) },
    },
  });
};
