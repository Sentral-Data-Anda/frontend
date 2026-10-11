/**
 * Tiruan `/api/v1/laporan-aset` (be-sada `modules/laporan_aset`) di atas ASSET,
 * RUN, dan DISPOSAL store Inventaris. Menjawab 200 dengan nol, tidak pernah 404
 * saat kosong.
 *
 *   MOCK_EMPTY=1  → register kosong, tetap 200
 *   MOCK_500=1    → menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { bapelOf } from "../fasilitas-store";
import {
  ASSET,
  DISPOSAL,
  RUN,
  TYPE_ITEM,
  isLive,
  money,
  type AssetRow,
} from "../inventaris-store";
import { denied, json, paging, type MockHandler } from "../kit";

const dateKey = (value: string) => value.slice(0, 10);

const monthIndex = (year: number, month: number) => year * 12 + month - 1;

/** Aset yang pelepasannya sudah disetujui pada tanggal laporan tidak ikut. */
const isDisposedBy = (assetId: number, asOf: string) =>
  DISPOSAL.some(
    (row) =>
      row.assetId === assetId &&
      row.status === "APPROVED" &&
      dateKey(row.disposalDate) <= asOf,
  );

/** Tanggal perolehan boleh kosong di master; barisnya tetap ikut. */
const isHeldAt = (row: AssetRow, asOf: string) =>
  isLive(row) &&
  (row.acquisitionDate === null || dateKey(row.acquisitionDate) <= asOf) &&
  !isDisposedBy(row.id, asOf);

const postedDepreciation = (assetId: number, asOf: string) => {
  const limit = monthIndex(Number(asOf.slice(0, 4)), Number(asOf.slice(5, 7)));

  return RUN.filter(
    (run) =>
      run.status === "POSTED" && monthIndex(run.year, run.month) <= limit,
  )
    .flatMap((run) => run.entries)
    .filter((entry) => entry.assetId === assetId)
    .reduce((sum, entry) => sum + entry.amount, 0);
};

const rowOf = (row: AssetRow, asOf: string) => {
  const type = TYPE_ITEM.find((item) => item.id === row.typeId);
  const bapel = bapelOf(row.bapelId);
  const cost = row.acquisitionCost ?? 0;

  const opening =
    row.openingAccumulatedAsOf && dateKey(row.openingAccumulatedAsOf) <= asOf
      ? (row.openingAccumulatedDepreciation ?? 0)
      : 0;

  const accumulated = opening + postedDepreciation(row.id, asOf);

  return {
    publicId: row.publicId,
    code: row.code,
    name: row.name,
    type: { id: row.typeId, name: type?.name ?? "" },
    bapel: {
      id: row.bapelId,
      code: bapel?.code ?? "",
      name: bapel?.name ?? "",
    },
    acquisitionDate: row.acquisitionDate
      ? `${dateKey(row.acquisitionDate)}T00:00:00.000Z`
      : null,
    acquisitionCost: money(cost) as string,
    isDepreciable: row.isDepreciable,
    accumulated: money(accumulated) as string,
    bookValue: money(cost - accumulated) as string,
  };
};

export const laporanAsetMock: MockHandler = (ctx) => {
  const { path, method, url, can } = ctx;

  if (path !== "/laporan-aset") return null;
  if (method !== "GET") return null;
  if (!can(MENU.ASSET_REPORT, "VIEW")) return denied();

  if (process.env.MOCK_500) {
    return json({ status: 500, error: "Internal Server Error" }, 500);
  }

  const date = url.searchParams.get("date");

  if (!date) {
    return json({ status: 400, error: "Mohon Lengkapi Tanggal Laporan" }, 400);
  }

  const asOf = dateKey(date);
  const held = process.env.MOCK_EMPTY
    ? []
    : ASSET.filter((row) => isHeldAt(row, asOf)).sort((left, right) =>
        left.code.localeCompare(right.code),
      );

  const { page, limit } = paging(url);
  const rows = held
    .slice((page - 1) * limit, page * limit)
    .map((row) => rowOf(row, asOf));

  const pageTotals = rows.reduce(
    (sum, row) => ({
      acquisitionCost: sum.acquisitionCost + Number(row.acquisitionCost),
      accumulated: sum.accumulated + Number(row.accumulated),
      bookValue: sum.bookValue + Number(row.bookValue),
    }),
    { acquisitionCost: 0, accumulated: 0, bookValue: 0 },
  );

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Laporan Aset Tetap",
    data: {
      date: asOf,
      rows,
      pageTotals: {
        acquisitionCost: money(pageTotals.acquisitionCost),
        accumulated: money(pageTotals.accumulated),
        bookValue: money(pageTotals.bookValue),
      },
      totalData: held.length,
      totalPage: Math.max(1, Math.ceil(held.length / limit)),
    },
  });
};
