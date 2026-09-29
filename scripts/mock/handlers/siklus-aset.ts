/**
 * Tiruan `/api/v1/siklus-aset/{perawatan,mutasi,pelepasan}` (be-sada sesudah
 * B1/B9/B12/B17/B22). Pelepasan lewat Persetujuan: ajukan membuat baris PENDING
 * lewat `submitDisposal`; setujui/tolak di mock Permintaan Persetujuan.
 *
 *   MOCK_EMPTY=1                      → daftar kosong (404)
 *   MOCK_500=1                        → daftar menjawab 500
 *   MOCK_ASSET_HISTORY_500=1          → daftar `?assetId=` (halaman Barang) menjawab 500
 *   MOCK_ASSET_CYCLE_SAVE_ERROR=500   → POST/PUT/DELETE menjawab 500
 *   MOCK_DISPOSAL_NO_WORKFLOW=1       → ajukan pelepasan 400 tanpa alur persetujuan
 */
import { z } from "zod";

import { MENU } from "../../../src/config/menu";
import { SESSION_USER_ID } from "../../mock-dashboard";
import { bapelOf } from "../fasilitas-store";
import {
  DISPOSAL,
  MAINTENANCE,
  TODAY,
  TRANSFER,
  assetOf,
  assetStatusOf,
  codeOf,
  decideDisposal,
  disposalView,
  isLive,
  maintenanceView,
  roomRowOf,
  submitDisposal,
  supplierOf,
  transferView,
  type MaintenanceRow,
  type TransferRow,
} from "../inventaris-store";
import {
  denied,
  json,
  list,
  readBody,
  type MockAction,
  type MockContext,
  type MockHandler,
} from "../kit";

type Issue = { path: string; message: string };

type Kind = "perawatan" | "mutasi" | "pelepasan";

const NAME: Record<Kind, string> = {
  perawatan: "Perawatan Barang",
  mutasi: "Mutasi Barang",
  pelepasan: "Pelepasan Barang",
};

const fail = (status: number, issues: Issue[] | string) =>
  typeof issues === "string"
    ? json({ status, error: issues }, status)
    : json({ status, error: issues[0].message, issues }, status);

const fieldFail = (status: number, path: string, message: string) =>
  fail(status, [{ path, message }]);

const saveError = () =>
  process.env.MOCK_ASSET_CYCLE_SAVE_ERROR === "500"
    ? json({ status: 500, error: "Internal Server Error" }, 500)
    : null;

const formDate = (label: string, isPastOnly: boolean) =>
  z
    .string({ error: `Mohon Lengkapi ${label}` })
    .regex(/^\d{4}-\d{2}-\d{2}$/, `Mohon Lengkapi ${label}`)
    .refine(
      (value) => !isPastOnly || value <= TODAY,
      `${label} Tidak Boleh Di Masa Depan`,
    );

const assetId = z.number({ error: "Mohon Lengkapi Barang" }).int().positive();

const maintenanceSchema = z
  .object({
    assetId,
    status: z
      .enum(["SCHEDULED", "IN_PROGRESS", "DONE", "CANCELLED"], {
        error: "Status Perawatan tidak valid",
      })
      .default("SCHEDULED"),
    scheduledDate: formDate("Tanggal Rencana", false),
    completedDate: formDate("Tanggal Selesai", true).nullish(),
    description: z
      .string({ error: "Mohon Lengkapi Keterangan" })
      .trim()
      .min(1, "Mohon Lengkapi Keterangan")
      .max(250, "Keterangan tidak boleh lebih dari 250 karakter"),
    cost: z.number().positive("Biaya harus lebih dari 0").nullish(),
    supplierId: z.number().int().positive().nullish(),
    performedBy: z
      .string()
      .max(150, "Dikerjakan Oleh tidak boleh lebih dari 150 karakter")
      .nullish(),
  })
  .superRefine((values, ctx) => {
    if (values.status === "DONE" && !values.completedDate) {
      ctx.addIssue({
        code: "custom",
        path: ["completedDate"],
        message: "Tanggal Selesai Wajib Diisi Untuk Perawatan Selesai",
      });
    }
    if (values.completedDate && values.completedDate < values.scheduledDate) {
      ctx.addIssue({
        code: "custom",
        path: ["completedDate"],
        message: "Tanggal Selesai tidak boleh sebelum Tanggal Rencana",
      });
    }
  });

const transferSchema = z.object({
  assetId,
  toRoomId: z.number({ error: "Mohon Lengkapi Ruang Tujuan" }).int().positive(),
  toBapelId: z
    .number({ error: "Mohon Lengkapi Badan Pelayanan Tujuan" })
    .int()
    .positive(),
  transferDate: formDate("Tanggal Pindah", true),
  reason: z
    .string()
    .max(250, "Alasan tidak boleh lebih dari 250 karakter")
    .nullish(),
});

const disposalSchema = z
  .object({
    assetId,
    method: z.enum(["SOLD", "SCRAPPED", "DONATED", "LOST"], {
      error: "Mohon Lengkapi Cara Pelepasan",
    }),
    disposalDate: formDate("Tanggal Pelepasan", true),
    reason: z
      .string({ error: "Mohon Lengkapi Alasan" })
      .trim()
      .min(1, "Mohon Lengkapi Alasan")
      .max(250, "Alasan tidak boleh lebih dari 250 karakter"),
    proceeds: z
      .number()
      .min(0, "Hasil Pelepasan tidak boleh negatif")
      .nullish(),
  })
  .superRefine((values, ctx) => {
    if (values.method === "SOLD" && !values.proceeds) {
      ctx.addIssue({
        code: "custom",
        path: ["proceeds"],
        message: "Mohon Lengkapi Hasil Penjualan",
      });
    }
  });

const parse = async <T>(schema: z.ZodType<T>, request: Request) => {
  const parsed = schema.safeParse(await readBody<unknown>(request));

  if (parsed.success) return { data: parsed.data, error: null };

  return {
    data: null,
    error: fail(
      400,
      parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    ),
  };
};

const assetFailure = (id: number, isPendingBlocked: boolean) => {
  if (!assetOf(id)) return fieldFail(404, "assetId", "Barang Tidak Ditemukan");

  const status = assetStatusOf(id);

  if (status === "DILEPAS") {
    return fieldFail(
      400,
      "assetId",
      "Barang Ini Sudah Dilepas Dan Tidak Dapat Diproses Lagi",
    );
  }
  if (isPendingBlocked && status === "MENUNGGU_PELEPASAN") {
    return fieldFail(
      400,
      "assetId",
      "Barang Sedang Menunggu Persetujuan Pelepasan",
    );
  }

  return null;
};

const matches = (filter: string, ...values: string[]) =>
  !filter ||
  values.some((value) => value.toLowerCase().includes(filter.toLowerCase()));

const inRange = (date: string, params: URLSearchParams) =>
  (!params.get("startDate") || date >= String(params.get("startDate"))) &&
  (!params.get("endDate") || date <= String(params.get("endDate")));

const assetCodeName = (id: number) => {
  const found = assetOf(id);

  return found ? [found.code, found.name] : [];
};

const listRows = (kind: Kind, params: URLSearchParams) => {
  const assetFilter = Number(params.get("assetId")) || null;
  const filter = params.get("filter") ?? "";
  const status = params.get("status") ?? "";
  const common = (row: { assetId: number; code: string }, date: string) =>
    (assetFilter === null || row.assetId === assetFilter) &&
    inRange(date, params) &&
    matches(filter, row.code, ...assetCodeName(row.assetId));

  if (kind === "perawatan") {
    return MAINTENANCE.filter(
      (row) =>
        isLive(row) &&
        common(row, row.scheduledDate) &&
        (!status || row.status === status),
    )
      .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))
      .map(maintenanceView);
  }
  if (kind === "mutasi") {
    return TRANSFER.filter((row) => common(row, row.transferDate))
      .sort((a, b) => b.transferDate.localeCompare(a.transferDate))
      .map(transferView);
  }

  const method = params.get("method") ?? "";

  return DISPOSAL.filter(
    (row) =>
      common(row, row.disposalDate) &&
      (!status || row.status === status) &&
      (!method || row.method === method),
  )
    .sort((a, b) => b.disposalDate.localeCompare(a.disposalDate))
    .map(disposalView);
};

const byCode = <T extends { code: string }>(rows: T[], code: string) =>
  rows.find((row) => row.code.toLowerCase() === code.toLowerCase());

const findRow = (kind: Kind, code: string) => {
  if (kind === "perawatan") {
    const row = byCode(MAINTENANCE.filter(isLive), code);
    return row ? maintenanceView(row) : null;
  }
  if (kind === "mutasi") {
    const row = byCode(TRANSFER, code);
    return row ? transferView(row) : null;
  }

  const row = byCode(DISPOSAL, code);
  return row ? disposalView(row) : null;
};

const notFound = (kind: Kind) => fail(404, `${NAME[kind]} Tidak Ditemukan`);

const newIds = () => ({
  publicId: crypto.randomUUID(),
  code: codeOf("SKA", { yearly: true }),
});

const saveMaintenance = async (ctx: MockContext, code?: string) => {
  const { data, error } = await parse(maintenanceSchema, ctx.request);
  if (error) return error;

  const row = code ? byCode(MAINTENANCE.filter(isLive), code) : undefined;
  if (code && !row) return notFound("perawatan");
  if (!row) {
    const assetError = assetFailure(data.assetId, false);
    if (assetError) return assetError;
  }
  if (data.supplierId && !supplierOf(data.supplierId)) {
    return fieldFail(404, "supplierId", "Supplier Tidak Ditemukan");
  }

  const values = {
    status: data.status,
    scheduledDate: data.scheduledDate,
    completedDate: data.status === "DONE" ? (data.completedDate ?? null) : null,
    description: data.description,
    cost: data.cost ?? null,
    supplierId: data.supplierId ?? null,
    performedBy: data.performedBy?.trim() || null,
  };

  if (row) {
    Object.assign(row, values);
    return json({
      status: 200,
      message: "Berhasil Mengubah Perawatan Barang",
      data: maintenanceView(row),
    });
  }

  const created: MaintenanceRow = {
    id: MAINTENANCE.length + 1,
    ...newIds(),
    assetId: data.assetId,
    deletedAt: null,
    ...values,
  };
  MAINTENANCE.push(created);

  return json(
    {
      status: 201,
      message: "Berhasil Menambahkan Perawatan Barang",
      data: maintenanceView(created),
    },
    201,
  );
};

const createTransfer = async (ctx: MockContext) => {
  const { data, error } = await parse(transferSchema, ctx.request);
  if (error) return error;

  const assetError = assetFailure(data.assetId, true);
  if (assetError) return assetError;

  const asset = assetOf(data.assetId);
  const room = roomRowOf(data.toRoomId);
  if (!asset) return fieldFail(404, "assetId", "Barang Tidak Ditemukan");
  if (!room || room.deletedAt) {
    return fieldFail(404, "toRoomId", "Ruang Tidak Ditemukan");
  }
  if (!bapelOf(data.toBapelId)) {
    return fieldFail(404, "toBapelId", "Badan Pelayanan Tidak Ditemukan");
  }
  if (asset.roomId === data.toRoomId && asset.bapelId === data.toBapelId) {
    return fieldFail(
      400,
      "toRoomId",
      "Barang Ini Sudah Berada Di Ruangan Dan Komisi Tersebut",
    );
  }
  if (asset.roomId !== data.toRoomId && !room.isActive) {
    return fieldFail(400, "toRoomId", "Ruang Tidak Aktif");
  }

  const created: TransferRow = {
    id: TRANSFER.length + 1,
    ...newIds(),
    assetId: asset.id,
    fromRoomId: asset.roomId,
    toRoomId: data.toRoomId,
    fromBapelId: asset.bapelId,
    toBapelId: data.toBapelId,
    transferDate: data.transferDate,
    reason: data.reason?.trim() || null,
  };
  TRANSFER.push(created);
  asset.roomId = data.toRoomId;
  asset.bapelId = data.toBapelId;

  return json(
    {
      status: 201,
      message: "Berhasil Menambahkan Mutasi Barang",
      data: transferView(created),
    },
    201,
  );
};

const createDisposal = async (ctx: MockContext) => {
  const { data, error } = await parse(disposalSchema, ctx.request);
  if (error) return error;

  const assetError = assetFailure(data.assetId, true);
  if (assetError) return assetError;
  if (process.env.MOCK_DISPOSAL_NO_WORKFLOW) {
    return fail(
      400,
      "Belum Ada Alur Persetujuan Untuk Dokumen Dengan Nominal Ini",
    );
  }

  const created = submitDisposal({
    assetId: data.assetId,
    method: data.method,
    disposalDate: data.disposalDate,
    reason: data.reason,
    proceeds: data.proceeds ?? 0,
  });

  return json(
    {
      status: 201,
      message: "Berhasil Mengajukan Pelepasan Barang",
      data: disposalView(created),
    },
    201,
  );
};

const deleteMaintenance = (code: string) => {
  const row = byCode(MAINTENANCE.filter(isLive), code);
  if (!row) return notFound("perawatan");

  row.deletedAt = new Date().toISOString();

  return json({
    status: 200,
    message: "Berhasil Menghapus Perawatan Barang",
    data: maintenanceView(row),
  });
};

const withdrawDisposal = (code: string) => {
  const row = byCode(DISPOSAL, code);
  if (!row) return notFound("pelepasan");
  if (row.status !== "PENDING") {
    return fail(400, "Permintaan Persetujuan Ini Sudah Selesai");
  }
  if (row.submittedBy !== SESSION_USER_ID) {
    return fail(403, "Hanya Pengaju Yang Dapat Menarik Permintaan Ini");
  }

  decideDisposal(row.code, "CANCELLED");

  return json({
    status: 200,
    message: "Berhasil Menarik Pengajuan Pelepasan",
    data: disposalView(row),
  });
};

type Route = { action: MockAction; run: () => Promise<Response> | Response };

const routeOf = (
  ctx: MockContext,
  kind: Kind,
  code: string | undefined,
  isWithdraw: boolean,
): Route | null => {
  const { method } = ctx;

  if (method === "GET" && !isWithdraw) {
    return { action: "VIEW", run: () => read(ctx, kind, code) };
  }
  if (method === "POST" && !code) {
    if (kind === "perawatan") {
      return { action: "CREATE", run: () => saveMaintenance(ctx) };
    }
    return kind === "mutasi"
      ? { action: "CREATE", run: () => createTransfer(ctx) }
      : { action: "DELETE", run: () => createDisposal(ctx) };
  }
  if (!code) return null;
  if (kind === "pelepasan" && isWithdraw && method === "PUT") {
    return { action: "DELETE", run: () => withdrawDisposal(code) };
  }
  if (kind !== "perawatan" || isWithdraw) return null;
  if (method === "PUT") {
    return { action: "UPDATE", run: () => saveMaintenance(ctx, code) };
  }
  if (method === "DELETE") {
    return { action: "DELETE", run: () => deleteMaintenance(code) };
  }

  return null;
};

const read = (ctx: MockContext, kind: Kind, code: string | undefined) => {
  if (code) {
    const row = findRow(kind, code);
    return row
      ? json({
          status: 200,
          message: `Berhasil Mendapatkan ${NAME[kind]}`,
          data: row,
        })
      : notFound(kind);
  }

  const isHistory = ctx.url.searchParams.has("assetId");
  if (
    (isHistory && process.env.MOCK_ASSET_HISTORY_500) ||
    (!isHistory && process.env.MOCK_500)
  ) {
    return json({ status: 500, error: "Internal Server Error" }, 500);
  }

  return list(
    listRows(kind, ctx.url.searchParams),
    ctx.url,
    NAME[kind],
    NAME[kind],
    `Berhasil Mendapatkan ${NAME[kind]}`,
  );
};

export const siklusAsetMock: MockHandler = async (ctx) => {
  const match = ctx.path.match(
    /^\/siklus-aset\/(perawatan|mutasi|pelepasan)(?:\/([^/]+)(\/tarik)?)?$/,
  );
  if (!match) return null;

  const route = routeOf(
    ctx,
    match[1] as Kind,
    match[2] ? decodeURIComponent(match[2]) : undefined,
    Boolean(match[3]),
  );
  if (!route) return null;
  if (!ctx.can(MENU.SIKLUS_ASET, route.action)) return denied();
  if (ctx.method !== "GET") {
    const error = saveError();
    if (error) return error;
  }

  return route.run();
};
