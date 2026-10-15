/**
 * Tiruan `/api/v1/retur-pembelian` (be-sada `retur_pembelian.*`).
 * `PURCHASE_RETURN` hanya ditulis lewat fungsi store; menyelesaikan retur
 * mengeluarkan stok lewat `applyMovement` dan mencabut aset dengan `deletedAt`.
 *
 *   MOCK_EMPTY=1                 → daftar kosong (404)
 *   MOCK_500=1                   → daftar menjawab 500
 *   MOCK_RETURN_SAVE_ERROR=500   → POST/PUT/DELETE menjawab 500
 *   MOCK_RETURN_ACTION_500=1     → /pengajuan, /selesai, /batal menjawab 500
 *   MOCK_RETURN_NO_WORKFLOW=1    → ajukan ditolak: belum ada alur persetujuan
 *   MOCK_RETURN_APPROVED=1       → ajukan langsung disetujui (store), supaya
 *                                  Selesaikan bisa ditelusuri tanpa Persetujuan
 */
import { MENU } from "../../../src/config/menu";
import {
  denied,
  json,
  list,
  readBody,
  type MockAction,
  type MockHandler,
} from "../kit";
import {
  PURCHASE_RETURN,
  cancelReturn,
  completeReturn,
  createReturn,
  deleteReturn,
  latestReturnApprovalOf,
  purchaseReturnByPublicId,
  purchaseReturnView,
  submitReturn,
  updateReturn,
  type PurchaseReturnRow,
  type ReturnLineInput,
} from "../pengadaan-store";

type Issue = { path: string; message: string };

const NAME = "Retur Pembelian";

const NOT_FOUND = `${NAME} Tidak Ditemukan`;

const REASON_MAX = 250;

const ok = (message: string, row: PurchaseReturnRow, status = 200) =>
  json({ status, message, data: purchaseReturnView(row) }, status);

const failure = (status: number, error: string) =>
  json({ status, error }, status);

const invalid = (issues: Issue[]) =>
  json({ status: 400, error: issues[0].message, issues }, 400);

const serverError = () =>
  json({ status: 500, error: "Kesalahan server." }, 500);

const isBlank = (value: unknown) =>
  value === undefined || value === null || value === "";

type Body = {
  goodsReceiptId?: unknown;
  returnDate?: unknown;
  reason?: unknown;
  items?: unknown;
};

type Parsed = {
  goodsReceiptId: number;
  returnDate: string;
  reason: string;
  items: ReturnLineInput[];
};

const parseLine = (
  raw: Record<string, unknown>,
  index: number,
  issues: Issue[],
): ReturnLineInput => {
  const path = (field: string) => `items.${index}.${field}`;
  const quantity = Number(raw.quantity);
  const reason = typeof raw.reason === "string" ? raw.reason.trim() : "";

  if (isBlank(raw.goodsReceiptItemId)) {
    issues.push({
      path: path("goodsReceiptItemId"),
      message: "Mohon Lengkapi Baris Penerimaan",
    });
  }
  if (isBlank(raw.quantity) || Number.isNaN(quantity)) {
    issues.push({ path: path("quantity"), message: "Mohon Lengkapi Jumlah" });
  } else if (!Number.isInteger(quantity)) {
    issues.push({
      path: path("quantity"),
      message: "Jumlah harus bilangan bulat",
    });
  } else if (quantity <= 0) {
    issues.push({
      path: path("quantity"),
      message: "Jumlah harus lebih dari 0",
    });
  }
  if (reason.length > REASON_MAX) {
    issues.push({
      path: path("reason"),
      message: `Alasan baris tidak boleh lebih dari ${REASON_MAX} karakter`,
    });
  }

  return {
    goodsReceiptItemId: Number(raw.goodsReceiptItemId),
    quantity,
    reason: reason || null,
  };
};

const parse = (
  body: Body,
): { failure: Response; value: null } | { failure: null; value: Parsed } => {
  const issues: Issue[] = [];
  const receiptId = Number(body.goodsReceiptId);
  const returnDate =
    typeof body.returnDate === "string" ? body.returnDate.slice(0, 10) : "";
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  const raw = Array.isArray(body.items) ? body.items : null;

  if (isBlank(body.goodsReceiptId)) {
    issues.push({
      path: "goodsReceiptId",
      message: "Mohon Lengkapi Penerimaan Barang",
    });
  } else if (!Number.isInteger(receiptId) || receiptId <= 0) {
    issues.push({
      path: "goodsReceiptId",
      message: "Penerimaan Barang tidak valid",
    });
  }
  if (!returnDate) {
    issues.push({
      path: "returnDate",
      message: "Mohon Lengkapi Tanggal Retur",
    });
  }
  if (!reason) {
    issues.push({ path: "reason", message: "Mohon Lengkapi Alasan" });
  } else if (reason.length > REASON_MAX) {
    issues.push({
      path: "reason",
      message: `Alasan tidak boleh lebih dari ${REASON_MAX} karakter`,
    });
  }
  if (!raw || raw.length === 0) {
    issues.push({
      path: "items",
      message: "Retur Pembelian harus memiliki minimal 1 baris",
    });
  }

  const items = (raw ?? []).map((line, index) =>
    parseLine((line ?? {}) as Record<string, unknown>, index, issues),
  );

  if (issues.length > 0) return { failure: invalid(issues), value: null };

  return {
    failure: null,
    value: { goodsReceiptId: receiptId, returnDate, reason, items },
  };
};

const onWrite = async (
  request: Request,
  row?: PurchaseReturnRow,
): Promise<Response> => {
  const parsed = parse(await readBody<Body>(request));
  if (parsed.failure) return parsed.failure;

  const result = row
    ? updateReturn(row, parsed.value)
    : createReturn(parsed.value);

  if ("failure" in result) {
    return failure(result.failure.status, result.failure.message);
  }

  return row
    ? ok(`Berhasil Mengubah ${NAME}`, result.row)
    : ok(`Berhasil Menambahkan ${NAME}`, result.row, 201);
};

const onSubmit = (row: PurchaseReturnRow) => {
  const result = submitReturn(row);
  if ("failure" in result) {
    return failure(result.failure.status, result.failure.message);
  }

  const approval = latestReturnApprovalOf(result.row);

  return json({
    status: 200,
    message: `Berhasil Mengajukan ${NAME}`,
    data: approval
      ? {
          publicId: approval.publicId,
          code: approval.code,
          status: approval.status,
        }
      : null,
  });
};

const onComplete = (row: PurchaseReturnRow) => {
  const result = completeReturn(row);

  return "failure" in result
    ? failure(result.failure.status, result.failure.message)
    : ok(`Berhasil Menyelesaikan ${NAME}`, result.row);
};

const onCancel = (row: PurchaseReturnRow) => {
  const result = cancelReturn(row);

  return "failure" in result
    ? failure(result.failure.status, result.failure.message)
    : ok(`Berhasil Membatalkan ${NAME}`, result.row);
};

const onDelete = (row: PurchaseReturnRow) => {
  const result = deleteReturn(row);

  return "failure" in result
    ? failure(result.failure.status, result.failure.message)
    : json({
        status: 200,
        message: `Berhasil Menghapus ${NAME}`,
        data: { publicId: row.publicId, code: row.code },
      });
};

const ACTIONS = {
  pengajuan: { method: "POST", guard: "UPDATE", run: onSubmit },
  selesai: { method: "PUT", guard: "UPDATE", run: onComplete },
  batal: { method: "PUT", guard: "DELETE", run: onCancel },
} as const satisfies Record<
  string,
  {
    method: string;
    guard: MockAction;
    run: (row: PurchaseReturnRow) => Response;
  }
>;

const listRows = (url: URL) => {
  const supplierId = Number(url.searchParams.get("supplierId")) || null;
  const status = url.searchParams.get("status");

  return PURCHASE_RETURN.filter((row) => row.deletedAt === null)
    .filter((row) => supplierId === null || row.supplierId === supplierId)
    .filter((row) => !status || row.status === status)
    .sort((a, b) => b.returnDate.localeCompare(a.returnDate) || b.id - a.id)
    .map((row) => purchaseReturnView(row));
};

export const returPembelianMock: MockHandler = async (ctx) => {
  const match = ctx.path.match(
    /^\/retur-pembelian(?:\/([^/]+))?(?:\/(pengajuan|selesai|batal))?$/,
  );
  if (!match) return null;

  const publicId = match[1] ? decodeURIComponent(match[1]) : undefined;
  const actionName = match[2] as keyof typeof ACTIONS | undefined;
  const can = (action: MockAction) => ctx.can(MENU.PURCHASE_RETURN, action);

  const action = actionName ? ACTIONS[actionName] : undefined;

  if (action && publicId) {
    if (ctx.method !== action.method) return null;
    if (!can(action.guard)) return denied();
    if (process.env.MOCK_RETURN_ACTION_500) return serverError();

    const row = purchaseReturnByPublicId(publicId);

    return row ? action.run(row) : failure(404, NOT_FOUND);
  }

  if (ctx.method === "GET") {
    if (!can("VIEW")) return denied();
    if (!publicId) {
      if (process.env.MOCK_500) return serverError();

      return list(
        listRows(ctx.url),
        ctx.url,
        NAME,
        NAME,
        `Berhasil Mendapatkan ${NAME}`,
      );
    }

    const row = purchaseReturnByPublicId(publicId);

    return row
      ? ok(`Berhasil Mendapatkan ${NAME}`, row)
      : failure(404, NOT_FOUND);
  }

  const guard: MockAction | null =
    ctx.method === "POST" && !publicId
      ? "CREATE"
      : ctx.method === "PUT" && publicId
        ? "UPDATE"
        : ctx.method === "DELETE" && publicId
          ? "DELETE"
          : null;
  if (!guard) return null;
  if (!can(guard)) return denied();
  if (process.env.MOCK_RETURN_SAVE_ERROR === "500") return serverError();

  if (guard === "CREATE") return onWrite(ctx.request);

  const row = purchaseReturnByPublicId(publicId as string);
  if (!row) return failure(404, NOT_FOUND);

  return guard === "UPDATE" ? onWrite(ctx.request, row) : onDelete(row);
};
