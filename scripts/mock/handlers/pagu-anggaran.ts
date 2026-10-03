/**
 * Tiruan `/api/v1/pagu-anggaran` (kontrak Anggaran §3). Larik
 * `BUDGET_ALLOCATION` milik handler ini.
 *
 * Bacaan dan penjaganya milik TL; jalur tulis diisi agent AP.
 *
 *   MOCK_EMPTY=1   → daftar kosong (404)
 *   MOCK_500=1     → daftar menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import {
  BUDGET_ALLOCATION,
  allocationOf,
  allocationView,
  liveProgramsOf,
} from "../anggaran-store";
import { denied, json, list, type MockAction, type MockHandler } from "../kit";

type Issue = { path: string; message: string };

const NOT_FOUND = "Pagu Anggaran Tidak Ditemukan";

export const paguFailure = (
  status: number,
  error: string,
  extra: { issues?: Issue[]; code?: string } = {},
) => json({ status, error, ...extra }, status);

/**
 * Pagu yang masih dipakai program tidak bisa dihapus — dan "dipakai" berarti
 * program non-CANCELLED, definisi yang sama dengan perhitungan pagunya. Pagu
 * yang seluruh programnya dibatalkan nol rupiah terpakai, jadi boleh dihapus.
 */
export const isCeilingInUse = (bapelId: number, year: number) =>
  liveProgramsOf(bapelId, year).length > 0;

export const duplicateCeiling = (
  bapelId: number,
  year: number,
  exceptId?: number,
) => {
  const existing = allocationOf(bapelId, year);

  return existing && existing.id !== exceptId ? existing : null;
};

const listRows = (url: URL) => {
  const year = Number(url.searchParams.get("year")) || 0;
  const bapelId = Number(url.searchParams.get("bapelId")) || 0;
  const filter = (url.searchParams.get("filter") ?? "").toLowerCase();

  return BUDGET_ALLOCATION.filter(
    (row) =>
      (!year || row.year === year) && (!bapelId || row.bapelId === bapelId),
  )
    .map((row) => allocationView(row))
    .filter((row) => !filter || row.bapel?.name.toLowerCase().includes(filter))
    .sort(
      (left, right) =>
        right.year - left.year ||
        (left.bapel?.name ?? "").localeCompare(right.bapel?.name ?? ""),
    );
};

export const paguAnggaranMock: MockHandler = (ctx) => {
  const match = ctx.path.match(/^\/pagu-anggaran(?:\/([^/]+))?$/);
  if (!match) return null;

  const [, id] = match;
  const can = (action: MockAction) => ctx.can(MENU.PAGU_ANGGARAN, action);

  if (ctx.method === "GET") {
    if (!can("VIEW")) return denied();

    if (!id) {
      if (process.env.MOCK_500) {
        return paguFailure(500, "Internal Server Error");
      }

      return list(listRows(ctx.url), ctx.url, "Pagu Anggaran", "Pagu Anggaran");
    }

    const row = BUDGET_ALLOCATION.find((item) => item.publicId === id);

    return row
      ? json({
          status: 200,
          message: "Berhasil Mendapatkan Pagu Anggaran",
          data: allocationView(row, true),
        })
      : paguFailure(404, NOT_FOUND);
  }

  return null;
};
