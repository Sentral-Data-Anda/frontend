/**
 * Tiruan `/api/v1/permintaan-pembelian` (be-sada `permintaan_pembelian`, bentuk sesudah gap
 * B2, B9, B10, B12, B20, B25, B27). Mengubah hanya `PURCHASE_REQUEST`; ajukan/tarik lewat
 * pembantu store supaya Permintaan Persetujuan membaca hal yang sama.
 *
 *   MOCK_EMPTY=1               → daftar kosong (404)
 *   MOCK_500=1                 → daftar menjawab 500
 *   MOCK_PR_SAVE_ERROR=500     → POST/PUT/DELETE menjawab 500
 *   MOCK_PR_NO_WORKFLOW=1      → ajukan ditolak: belum ada alur persetujuan
 *   MOCK_PR_ACTION_500=1       → /pengajuan dan /tarik menjawab 500
 *   MOCK_MEDIA_EXPIRED=1       → lampiran 403 (media.ts)
 */
import { MENU } from "../../../src/config/menu";
import { SESSION_USER_ID } from "../../mock-dashboard";
import { bapelOf } from "../fasilitas-store";
import { denied, json, list, type MockAction, type MockHandler } from "../kit";
import { filesOf, putMedia, readMultipart } from "../media";
import {
  PURCHASE_REQUEST,
  TODAY,
  codeOf,
  decidePurchaseRequest,
  latestApprovalOf,
  purchaseRequestByCode,
  purchaseRequestView,
  requestItem,
  submitPurchaseRequest,
  type Attachment,
  type PurchaseRequestRow,
} from "../pengadaan-store";

type Issue = { path: string; message: string };

type Line = { name: string; quantity: number; estimatedUnitPrice: number };

type Parsed = {
  bapelId: number;
  purpose: string;
  neededDate: string | null;
  items: Line[];
  kept: string[] | null;
  files: File[];
};

const NAME = "Permintaan Pembelian";
const NOT_FOUND = `${NAME} Tidak Ditemukan`;
const MAX_FILES = 3;

const failure = (status: number, error: string, issues?: Issue[]) =>
  json(issues ? { status, error, issues } : { status, error }, status);

const invalid = (issues: Issue[], status = 400) =>
  failure(status, issues[0].message, issues);

const serverError = () => failure(500, "Internal Server Error");

const ok = (message: string, row: PurchaseRequestRow, status = 200) =>
  json({ status, message, data: purchaseRequestView(row, true) }, status);

const text = (form: FormData, key: string) => {
  const value = form.get(key);

  return typeof value === "string" ? value.trim() : "";
};

const collapse = (value: string) => value.trim().replace(/\s+/g, " ");

const isBlank = (value: unknown) =>
  value === undefined || value === null || value === "";

const jsonOf = (raw: string): unknown => {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const lineOf = (raw: unknown, index: number, issues: Issue[]): Line => {
  const line = (raw ?? {}) as Record<string, unknown>;
  const name = collapse(String(line.name ?? ""));
  const at = (field: string) => `items.${index}.${field}`;

  if (!name)
    issues.push({ path: at("name"), message: "Mohon Lengkapi Nama Barang" });
  else if (name.length > 150) {
    issues.push({
      path: at("name"),
      message: "Nama Barang tidak boleh lebih dari 150 karakter",
    });
  }

  const quantity = Number(line.quantity);
  if (isBlank(line.quantity) || Number.isNaN(quantity)) {
    issues.push({ path: at("quantity"), message: "Mohon Lengkapi Jumlah" });
  } else if (!Number.isInteger(quantity)) {
    issues.push({
      path: at("quantity"),
      message: "Jumlah harus bilangan bulat",
    });
  } else if (quantity <= 0) {
    issues.push({ path: at("quantity"), message: "Jumlah harus lebih dari 0" });
  }

  const price = Number(line.estimatedUnitPrice);
  if (isBlank(line.estimatedUnitPrice) || Number.isNaN(price)) {
    issues.push({
      path: at("estimatedUnitPrice"),
      message: "Mohon Lengkapi Perkiraan Harga Satuan",
    });
  } else if (price <= 0) {
    issues.push({
      path: at("estimatedUnitPrice"),
      message: "Perkiraan Harga Satuan harus lebih dari 0",
    });
  }

  return { name, quantity, estimatedUnitPrice: price };
};

const keptOf = (form: FormData, isUpdate: boolean): string[] | null | "bad" => {
  const raw = isUpdate ? form.get("keepFiles") : null;
  if (typeof raw !== "string") return null;

  const parsed = jsonOf(raw);

  return Array.isArray(parsed) &&
    parsed.every((item) => typeof item?.publicId === "string")
    ? parsed.map((item: { publicId: string }) => item.publicId)
    : "bad";
};

const parse = (form: FormData, isUpdate: boolean): Parsed | Issue[] => {
  const issues: Issue[] = [];
  const bapelId = Number(text(form, "bapelId")) || null;
  const purpose = collapse(text(form, "purpose"));
  const neededDate = text(form, "neededDate") || null;
  const rawItems = jsonOf(text(form, "items") || "[]");
  const kept = keptOf(form, isUpdate);
  const files = filesOf(form, "image");

  if (!bapelId) {
    issues.push({ path: "bapelId", message: "Mohon Lengkapi Badan Pelayanan" });
  }
  if (!purpose) {
    issues.push({ path: "purpose", message: "Mohon Lengkapi Keperluan" });
  } else if (purpose.length > 250) {
    issues.push({
      path: "purpose",
      message: "Keperluan tidak boleh lebih dari 250 karakter",
    });
  }
  if (neededDate && !/^\d{4}-\d{2}-\d{2}$/.test(neededDate)) {
    issues.push({
      path: "neededDate",
      message: "Tanggal Dibutuhkan Tidak Valid",
    });
  } else if (neededDate && neededDate < TODAY) {
    issues.push({
      path: "neededDate",
      message: "Tanggal Dibutuhkan Tidak Boleh Sebelum Hari Ini",
    });
  }

  const lines = Array.isArray(rawItems) ? rawItems : [];
  if (!Array.isArray(rawItems)) {
    issues.push({ path: "items", message: "Format Barang Tidak Valid" });
  } else if (lines.length === 0) {
    issues.push({
      path: "items",
      message: "Permintaan Pembelian harus memiliki minimal 1 barang",
    });
  }
  const items = lines.map((raw, index) => lineOf(raw, index, issues));

  if (kept === "bad") {
    issues.push({
      path: "keepFiles",
      message: "Format Lampiran Yang Dipertahankan Tidak Valid",
    });
  } else if ((kept?.length ?? 0) + files.length > MAX_FILES) {
    issues.push({ path: "image", message: "Lampiran Maksimal 3" });
  }

  if (issues.length > 0) return issues;

  return {
    bapelId: bapelId as number,
    purpose,
    neededDate,
    items,
    kept: kept as string[] | null,
    files,
  };
};

const attachmentFailure = (
  parsed: Parsed,
  current: readonly Attachment[],
): Response | null => {
  if (
    parsed.kept?.some((id) => !current.some((item) => item.publicId === id))
  ) {
    return invalid([{ path: "image", message: "Lampiran Tidak Ditemukan" }]);
  }

  const keptCount = parsed.kept?.length ?? current.length;

  return keptCount + parsed.files.length > MAX_FILES
    ? invalid([{ path: "image", message: "Lampiran Maksimal 3" }])
    : null;
};

const statusFailure = (row: PurchaseRequestRow): Response | null => {
  if (row.status === "PENDING_APPROVAL") {
    return failure(
      400,
      "Permintaan Pembelian Ini Sedang Menunggu Persetujuan. Tarik Pengajuannya Terlebih Dahulu",
    );
  }
  if (row.status === "REJECTED") {
    return failure(
      400,
      "Permintaan Pembelian Ini Sudah Ditolak. Ajukan Ulang Sebagai Permintaan Baru",
    );
  }

  return row.status === "APPROVED"
    ? failure(400, "Permintaan Pembelian Ini Sudah Diajukan")
    : null;
};

const bapelFailure = (bapelId: number) =>
  bapelOf(bapelId)
    ? null
    : invalid(
        [{ path: "bapelId", message: "Badan Pelayanan Tidak Ditemukan" }],
        404,
      );

const storeFile = async (file: File): Promise<Attachment> => ({
  publicId: crypto.randomUUID(),
  ...(await putMedia(file, "purchase-request")),
});

const toItems = (lines: Line[]) =>
  lines.map((line) =>
    requestItem(line.name, line.quantity, line.estimatedUnitPrice),
  );

const onCreate = async (request: Request) => {
  const form = await readMultipart(request);
  if (form instanceof Response) return form;

  const parsed = parse(form, false);
  if (Array.isArray(parsed)) return invalid(parsed);

  const rejected = bapelFailure(parsed.bapelId);
  if (rejected) return rejected;

  const row: PurchaseRequestRow = {
    id: PURCHASE_REQUEST.length + 1,
    publicId: crypto.randomUUID(),
    code: codeOf("PRQ", { yearly: true }),
    deletedAt: null,
    status: "DRAFT",
    bapelId: parsed.bapelId,
    purpose: parsed.purpose,
    neededDate: parsed.neededDate,
    requestedBy: SESSION_USER_ID,
    createdAt: new Date().toISOString(),
    items: toItems(parsed.items),
    attachments: await Promise.all(parsed.files.map(storeFile)),
    approvals: [],
  };
  PURCHASE_REQUEST.push(row);

  return ok(`Berhasil Menambahkan ${NAME}`, row, 201);
};

const onUpdate = async (request: Request, code: string) => {
  const form = await readMultipart(request);
  if (form instanceof Response) return form;

  const parsed = parse(form, true);
  if (Array.isArray(parsed)) return invalid(parsed);

  const row = purchaseRequestByCode(code);
  if (!row) return failure(404, NOT_FOUND);

  const rejected =
    statusFailure(row) ??
    bapelFailure(parsed.bapelId) ??
    attachmentFailure(parsed, row.attachments);
  if (rejected) return rejected;

  const kept = parsed.kept;
  Object.assign(row, {
    bapelId: parsed.bapelId,
    purpose: parsed.purpose,
    neededDate: parsed.neededDate,
    items: toItems(parsed.items),
    attachments: [
      ...(kept
        ? row.attachments.filter((item) => kept.includes(item.publicId))
        : row.attachments),
      ...(await Promise.all(parsed.files.map(storeFile))),
    ],
  });

  return ok(`Berhasil Mengubah ${NAME}`, row);
};

const onDelete = (code: string) => {
  const row = purchaseRequestByCode(code);
  if (!row) return failure(404, NOT_FOUND);

  const rejected = statusFailure(row);
  if (rejected) return rejected;

  row.deletedAt = new Date().toISOString();

  return json({
    status: 200,
    message: `Berhasil Menghapus ${NAME}`,
    data: { publicId: row.publicId, code: row.code },
  });
};

const onSubmit = (row: PurchaseRequestRow) => {
  const result = submitPurchaseRequest(row);
  if ("failure" in result) {
    return failure(result.failure.status, result.failure.message);
  }

  const approval = latestApprovalOf(result.row);

  return json(
    {
      status: 201,
      message: `Berhasil Mengajukan ${NAME}`,
      data: approval
        ? {
            publicId: approval.publicId,
            code: approval.code,
            status: approval.status,
          }
        : null,
    },
    201,
  );
};

const onWithdraw = (row: PurchaseRequestRow) => {
  if (latestApprovalOf(row)?.status !== "PENDING") {
    return failure(400, "Permintaan Persetujuan Ini Sudah Selesai");
  }
  if (latestApprovalOf(row)?.submittedBy !== SESSION_USER_ID) {
    return failure(403, "Hanya Pengaju Yang Dapat Menarik Permintaan Ini");
  }

  decidePurchaseRequest(row.code, "CANCELLED");

  return ok(`Berhasil Menarik ${NAME}`, row);
};

const ACTIONS = {
  pengajuan: { method: "POST", run: onSubmit },
  tarik: { method: "PUT", run: onWithdraw },
} as const;

const jakartaDateOf = (iso: string) =>
  new Date(Date.parse(iso) + 7 * 3_600_000).toISOString().slice(0, 10);

const listRows = (url: URL) => {
  const params = url.searchParams;
  const bapelId = Number(params.get("bapelId")) || null;
  const status = params.get("status");
  const startDate = params.get("startDate");
  const endDate = params.get("endDate");
  const isMine = params.get("requestedBy") === "me";
  const filter = (params.get("filter") ?? "").toLowerCase();

  return PURCHASE_REQUEST.filter((row) => row.deletedAt === null)
    .filter((row) => bapelId === null || row.bapelId === bapelId)
    .filter((row) => !status || row.status === status)
    .filter((row) => !isMine || row.requestedBy === SESSION_USER_ID)
    .filter((row) => !startDate || jakartaDateOf(row.createdAt) >= startDate)
    .filter((row) => !endDate || jakartaDateOf(row.createdAt) <= endDate)
    .filter(
      (row) =>
        !filter ||
        [row.code, row.purpose, bapelOf(row.bapelId)?.name ?? ""].some(
          (value) => value.toLowerCase().includes(filter),
        ),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id - a.id)
    .map((row) => purchaseRequestView(row));
};

export const permintaanPembelianMock: MockHandler = async (ctx) => {
  const match = ctx.path.match(
    /^\/permintaan-pembelian(?:\/([^/]+))?(?:\/(pengajuan|tarik))?$/,
  );
  if (!match) return null;

  const code = match[1] ? decodeURIComponent(match[1]) : undefined;
  const actionName = match[2] as keyof typeof ACTIONS | undefined;
  const can = (action: MockAction) => ctx.can(MENU.PURCHASE_REQUEST, action);

  if (actionName && code) {
    const action = ACTIONS[actionName];
    if (ctx.method !== action.method) return null;
    if (!can("UPDATE")) return denied();
    if (process.env.MOCK_PR_ACTION_500) return serverError();

    const row = purchaseRequestByCode(code);

    return row ? action.run(row) : failure(404, NOT_FOUND);
  }

  if (ctx.method === "GET") {
    if (!can("VIEW")) return denied();
    if (!code) {
      if (process.env.MOCK_500) return serverError();

      return list(
        listRows(ctx.url),
        ctx.url,
        NAME,
        NAME,
        `Berhasil Mendapatkan ${NAME}`,
      );
    }

    const row = purchaseRequestByCode(code);

    return row
      ? ok(`Berhasil Mendapatkan ${NAME}`, row)
      : failure(404, NOT_FOUND);
  }

  const guard: MockAction | null =
    ctx.method === "POST" && !code
      ? "CREATE"
      : ctx.method === "PUT" && code
        ? "UPDATE"
        : ctx.method === "DELETE" && code
          ? "DELETE"
          : null;
  if (!guard) return null;
  if (!can(guard)) return denied();
  if (process.env.MOCK_PR_SAVE_ERROR === "500") return serverError();

  if (guard === "CREATE") return onCreate(ctx.request);
  if (guard === "UPDATE") return onUpdate(ctx.request, code as string);

  return onDelete(code as string);
};
