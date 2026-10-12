/**
 * Tiruan `/api/v1/faktur-supplier` (be-sada `modules/faktur_supplier`).
 *
 *   MOCK_EMPTY=1                      → daftar kosong (404)
 *   MOCK_500=1                        → daftar menjawab 500
 *   MOCK_INVOICE_SAVE_ERROR=500       → POST/PUT/DELETE menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { supplierOf } from "../inventaris-store";
import { accountOf } from "../keuangan-store";
import { denied, json, list, readBody, type MockHandler } from "../kit";
import {
  SUPPLIER_INVOICE,
  SUPPLIER_PAYMENT,
  currencyOf,
  invoiceItems,
  isLive,
  money,
  orderItemOf,
  paymentsOfInvoice,
  purchaseOrderOf,
  supplierInvoiceOf,
  type InvoiceItemRow,
  type SupplierInvoiceRow,
} from "../pengadaan-store";

const NOT_FOUND = "Faktur Supplier Tidak Ditemukan";

const ref = (
  row: { publicId: string; code: string; name: string } | undefined,
) => (row ? { publicId: row.publicId, code: row.code, name: row.name } : null);

const accountRef = (id: number | null) => {
  const row = id === null ? undefined : accountOf(id);

  return row
    ? { publicId: row.publicId, code: row.code, name: row.name }
    : null;
};

const paymentView = (row: (typeof SUPPLIER_PAYMENT)[number]) => ({
  publicId: row.publicId,
  code: row.code,
  paymentDate: row.paymentDate,
  amountIDR: row.amountIDR,
  accountId: row.accountId,
  method: row.method,
  reference: row.reference,
  note: row.note,
  account: accountRef(row.accountId),
});

const itemView = (row: InvoiceItemRow) => {
  const line =
    row.purchaseOrderItemId === null
      ? undefined
      : orderItemOf(row.purchaseOrderItemId);

  return {
    publicId: row.publicId,
    name: row.name,
    amountForeign: row.amountForeign,
    amountIDR: row.amountIDR,
    accountId: row.accountId,
    account: accountRef(row.accountId),
    purchaseOrderItemId: row.purchaseOrderItemId,
    purchaseOrderItem: line
      ? {
          publicId: line.publicId,
          name: line.name,
          quantity: line.quantity,
          unitPrice: money(line.unitPrice),
        }
      : null,
  };
};

/**
 * Rincian dari body, dengan rupiah per baris dan baris terakhir menyerap
 * pembulatannya — seperti `allocateIDR` di server.
 *
 * Ditolak kalau jumlahnya tidak sama dengan total faktur, dan kalau akun
 * header ikut terisi: dua jawaban atas satu pertanyaan.
 */
const itemsFromBody = (
  body: Record<string, unknown>,
  exchangeRate: number,
  totalIDR: number,
) => {
  const seeds = Array.isArray(body.items) ? body.items : [];

  return invoiceItems(
    seeds.map((seed) => {
      const line = seed as Record<string, unknown>;

      return {
        name: String(line.name ?? ""),
        amountForeign: Number(line.amountForeign ?? 0),
        accountId: Number(line.accountId ?? 0),
        purchaseOrderItemId:
          (line.purchaseOrderItemId as number | null) ?? null,
      };
    }),
    exchangeRate,
    totalIDR,
  );
};

const itemsIssue = (body: Record<string, unknown>) => {
  const seeds = Array.isArray(body.items) ? body.items : [];
  if (!seeds.length) return null;

  const sum = seeds.reduce(
    (total, seed) =>
      total + Number((seed as Record<string, unknown>).amountForeign ?? 0),
    0,
  );

  if (Math.abs(sum - Number(body.totalForeignCurrency ?? 0)) > 0.00005) {
    return {
      path: "items",
      message: "Jumlah Rincian Harus Sama Dengan Total Faktur",
    };
  }

  if (body.expenseAccountId !== null && body.expenseAccountId !== undefined) {
    return {
      path: "expenseAccountId",
      message: "Akun Beban Header Tidak Dipakai Bila Faktur Punya Rincian",
    };
  }

  return null;
};

const view = (row: SupplierInvoiceRow) => {
  const order = row.purchaseOrderId
    ? purchaseOrderOf(row.purchaseOrderId)
    : undefined;
  const currency = currencyOf(row.currencyCode);

  return {
    publicId: row.publicId,
    code: row.code,
    supplierInvoiceNumber: row.supplierInvoiceNumber,
    status: row.status,
    invoiceDate: row.invoiceDate,
    dueDate: row.dueDate,
    supplierId: row.supplierId,
    supplier: ref(supplierOf(row.supplierId)),
    purchaseOrderId: row.purchaseOrderId,
    purchaseOrder: order
      ? { publicId: order.publicId, code: order.code, status: order.status }
      : null,
    expenseAccountId: row.expenseAccountId,
    expenseAccount: accountRef(row.expenseAccountId),
    currencyCode: row.currencyCode,
    currency: currency
      ? { code: currency.code, name: currency.name, symbol: currency.symbol }
      : null,
    exchangeRate: String(row.exchangeRate),
    totalForeignCurrency: row.totalForeignCurrency,
    totalIDR: row.totalIDR,
    paidAmountIDR: row.paidAmountIDR,
    items: row.items.map(itemView),
    payments: paymentsOfInvoice(row.id).map(paymentView),
  };
};

const fail = (status: number, message: string) =>
  json({ status, error: message }, status);

const fieldError = (path: string, message: string) =>
  json({ status: 400, error: message, issues: [{ path, message }] }, 400);

const serverError = () =>
  json({ status: 500, error: "Kesalahan server." }, 500);

const ACTION: Record<string, "VIEW" | "CREATE" | "UPDATE" | "DELETE"> = {
  GET: "VIEW",
  POST: "CREATE",
  PUT: "UPDATE",
  DELETE: "DELETE",
};

export const fakturSupplierMock: MockHandler = async ({
  request,
  url,
  path,
  method,
  can,
}) => {
  if (path !== "/faktur-supplier" && !path.startsWith("/faktur-supplier/")) {
    return null;
  }

  if (!can(MENU.SUPPLIER_INVOICE, ACTION[method] ?? "VIEW")) return denied();

  if (method !== "GET" && process.env.MOCK_INVOICE_SAVE_ERROR === "500") {
    return serverError();
  }

  if (path === "/faktur-supplier" && method === "GET") {
    if (process.env.MOCK_500) return serverError();

    const status = url.searchParams.get("status") ?? "";
    const supplierId = url.searchParams.get("supplierId") ?? "";
    const search = (url.searchParams.get("search") ?? "").toLowerCase();

    return list(
      SUPPLIER_INVOICE.filter(
        (row) =>
          isLive(row) &&
          (!status || row.status === status) &&
          (!supplierId || String(row.supplierId) === supplierId) &&
          (!search ||
            row.code.toLowerCase().includes(search) ||
            row.supplierInvoiceNumber.toLowerCase().includes(search)),
      )
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .map(view),
      url,
      "Faktur Supplier",
      "Faktur Supplier",
    );
  }

  if (path === "/faktur-supplier" && method === "POST") {
    const body = await readBody<Record<string, unknown>>(request);
    const issue = itemsIssue(body);
    if (issue) return fieldError(issue.path, issue.message);

    const id = SUPPLIER_INVOICE.length + 1;
    const total = money(Number(body.totalForeignCurrency ?? 0));
    const row: SupplierInvoiceRow = {
      id,
      publicId: crypto.randomUUID(),
      code: `INV-2026-${String(id).padStart(4, "0")}`,
      supplierInvoiceNumber: String(body.supplierInvoiceNumber ?? ""),
      supplierId: Number(body.supplierId ?? 0),
      purchaseOrderId: (body.purchaseOrderId as number | null) ?? null,
      expenseAccountId: (body.expenseAccountId as number | null) ?? null,
      invoiceDate: String(body.invoiceDate ?? "").slice(0, 10),
      dueDate: String(body.dueDate ?? "").slice(0, 10),
      currencyCode: String(body.currencyCode ?? "IDR"),
      exchangeRate: 1,
      totalForeignCurrency: total,
      totalIDR: total,
      status: "DRAFT",
      paidAmountIDR: money(0),
      items: itemsFromBody(body, 1, Number(total)),
      deletedAt: null,
    };
    SUPPLIER_INVOICE.push(row);

    return json(
      {
        status: 201,
        message: "Berhasil Membuat Faktur Supplier",
        data: view(row),
      },
      201,
    );
  }

  const match = path.match(
    /^\/faktur-supplier\/([^/]+)(?:\/(terbitkan|batal|pembayaran))?$/,
  );
  if (!match) return null;

  const [, publicId, step] = match as RegExpMatchArray;
  const row = supplierInvoiceOf(decodeURIComponent(publicId));
  if (!row) return fail(404, NOT_FOUND);

  if (!step && method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Faktur Supplier",
      data: view(row),
    });
  }

  if (!step && method === "PUT") {
    if (row.status !== "DRAFT") {
      return fail(400, "Hanya Faktur Berstatus Draft Yang Dapat Diubah");
    }

    const body = await readBody<Record<string, unknown>>(request);
    const issue = itemsIssue(body);
    if (issue) return fieldError(issue.path, issue.message);

    const total = money(Number(body.totalForeignCurrency ?? 0));
    Object.assign(row, {
      supplierInvoiceNumber: String(body.supplierInvoiceNumber ?? ""),
      supplierId: Number(body.supplierId ?? 0),
      purchaseOrderId: (body.purchaseOrderId as number | null) ?? null,
      expenseAccountId: (body.expenseAccountId as number | null) ?? null,
      invoiceDate: String(body.invoiceDate ?? "").slice(0, 10),
      dueDate: String(body.dueDate ?? "").slice(0, 10),
      currencyCode: String(body.currencyCode ?? "IDR"),
      totalForeignCurrency: total,
      totalIDR: total,
      items: itemsFromBody(body, 1, Number(total)),
    });

    return json({
      status: 200,
      message: "Berhasil Memperbarui Faktur Supplier",
      data: view(row),
    });
  }

  if (!step && method === "DELETE") {
    if (paymentsOfInvoice(row.id).length) {
      return fail(
        400,
        "Faktur Ini Sudah Ada Pembayaran Dan Tidak Dapat Dihapus",
      );
    }

    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Faktur Supplier",
      data: view(row),
    });
  }

  if (step === "terbitkan" && method === "PUT") {
    if (row.status !== "DRAFT") {
      return fail(400, "Hanya Faktur Berstatus Draft Yang Dapat Diterbitkan");
    }

    row.status = "AWAITING_PAYMENT";

    return json({
      status: 200,
      message: "Berhasil Menerbitkan Faktur Supplier",
      data: view(row),
    });
  }

  if (step === "batal" && method === "PUT") {
    if (row.status === "CANCELLED")
      return fail(400, "Faktur Ini Sudah Dibatalkan");
    if (paymentsOfInvoice(row.id).length) {
      return fail(
        400,
        "Faktur Ini Sudah Ada Pembayaran Dan Tidak Dapat Dibatalkan",
      );
    }

    row.status = "CANCELLED";

    return json({
      status: 200,
      message: "Berhasil Membatalkan Faktur Supplier",
      data: view(row),
    });
  }

  if (step === "pembayaran" && method === "POST") {
    if (row.status !== "AWAITING_PAYMENT" && row.status !== "PARTIALLY_PAID") {
      return fail(400, "Faktur Ini Tidak Dapat Dibayar");
    }

    const body = await readBody<Record<string, unknown>>(request);
    const amount = Number(body.amountIDR ?? 0);
    const left = Number(row.totalIDR) - Number(row.paidAmountIDR);

    if (amount <= 0) {
      return fieldError("amountIDR", "Nominal Pembayaran harus lebih dari 0");
    }
    if (amount > left) {
      return fieldError(
        "amountIDR",
        "Nominal Pembayaran Melebihi Sisa Tagihan Faktur Ini",
      );
    }

    const id = SUPPLIER_PAYMENT.length + 1;
    SUPPLIER_PAYMENT.push({
      id,
      publicId: crypto.randomUUID(),
      code: `PYS-2026-${String(id).padStart(4, "0")}`,
      supplierInvoiceId: row.id,
      paymentDate: String(body.paymentDate ?? "").slice(0, 10),
      amountIDR: money(amount),
      accountId: Number(body.accountId ?? 0),
      method: (body.method as string | null) ?? null,
      reference: (body.reference as string | null) ?? null,
      note: (body.note as string | null) ?? null,
    });

    const paid = Number(row.paidAmountIDR) + amount;
    row.paidAmountIDR = money(paid);
    row.status = paid >= Number(row.totalIDR) ? "PAID" : "PARTIALLY_PAID";

    return json(
      {
        status: 201,
        message: "Berhasil Mencatat Pembayaran Faktur",
        data: view(row),
      },
      201,
    );
  }

  return null;
};
