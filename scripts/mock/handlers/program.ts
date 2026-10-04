/**
 * Tiruan `/api/v1/program` (kontrak Anggaran §4). Larik `PROGRAM` milik
 * handler ini.
 *
 * Bacaan dan aturan pagunya milik TL; jalur tulis diisi agent AG.
 *
 *   MOCK_EMPTY=1          → daftar kosong (404)
 *   MOCK_500=1            → daftar menjawab 500
 *   MOCK_NO_CEILING=1     → ajukan ditolak: tahun itu tanpa pagu
 *   MOCK_CEILING_FULL=1   → ajukan ditolak: melebihi sisa pagu
 *   MOCK_NO_WORKFLOW=1    → ajukan ditolak: belum ada alur persetujuan
 *   MOCK_NO_PENGURUS=1    → ajukan ditolak: komisi tanpa pemegang jabatan
 */
import { MENU } from "../../../src/config/menu";
import {
  PROGRAM,
  isVisibleBapel,
  komisiScopeOf,
  heldBy,
  isLive,
  isWithinCeiling,
  programOpenApproval,
  programView,
  remainingFor,
  type KomisiScope,
} from "../anggaran-store";
import { denied, json, list, type MockAction, type MockHandler } from "../kit";

type Issue = { path: string; message: string };

const NOT_FOUND = "Program Tidak Ditemukan";

export const programFailure = (
  status: number,
  error: string,
  extra: { issues?: Issue[]; code?: string; remaining?: string | null } = {},
) => json({ status, error, ...extra }, status);

/**
 * Penolakan pengajuan, atau null bila lolos. Urutannya sama dengan be-sada:
 * pagu lebih dulu, lalu alur, lalu pemegang jabatan — dan layar mencabangkan
 * pada `code`, bukan pada kalimatnya.
 */
export const submitFailureOf = (row: {
  id: number;
  bapelId: number;
  year: number;
  items: { quantity: string; unitPrice: string }[];
}) => {
  const proposed = heldBy(row as Parameters<typeof heldBy>[0]);

  if (process.env.MOCK_NO_CEILING) {
    return {
      status: 400,
      code: "CEILING_MISSING" as const,
      error: `Majelis Jemaat Belum Menetapkan Pagu Anggaran Komisi Ini Untuk Tahun ${row.year}`,
    };
  }

  if (
    process.env.MOCK_CEILING_FULL ||
    !isWithinCeiling(row.bapelId, row.year, proposed, row.id)
  ) {
    const remaining = remainingFor(row.bapelId, row.year, row.id);

    return remaining === null
      ? {
          status: 400,
          code: "CEILING_MISSING" as const,
          error: `Majelis Jemaat Belum Menetapkan Pagu Anggaran Komisi Ini Untuk Tahun ${row.year}`,
        }
      : {
          status: 400,
          code: "CEILING_EXCEEDED" as const,
          error: `Pengajuan Ini Melebihi Pagu Anggaran Komisi Untuk Tahun ${row.year}. Sisa Pagu: ${remaining}`,
          remaining,
        };
  }

  if (process.env.MOCK_NO_WORKFLOW) {
    return {
      status: 400,
      code: "NO_WORKFLOW" as const,
      error: "Belum Ada Alur Persetujuan Untuk Dokumen Dengan Nominal Ini",
    };
  }

  if (process.env.MOCK_NO_PENGURUS) {
    return {
      status: 400,
      code: "NO_POSITION_HOLDER" as const,
      error: "Komisi Ini Belum Punya Pengurus Berjabatan Ketua",
    };
  }

  return null;
};

const listRows = (url: URL, scope: KomisiScope) => {
  const year = Number(url.searchParams.get("year")) || 0;
  const bapelId = Number(url.searchParams.get("bapelId")) || 0;
  const status = url.searchParams.get("status") ?? "";
  const pending = url.searchParams.get("isPendingApproval") ?? "";
  const filter = (url.searchParams.get("filter") ?? "").toLowerCase();

  return PROGRAM.filter((row) => {
    if (!isLive(row)) return false;
    if (!isVisibleBapel(scope, row.bapelId)) return false;
    if (year && row.year !== year) return false;
    if (bapelId && row.bapelId !== bapelId) return false;
    if (status && row.status !== status) return false;

    const isPending = programOpenApproval(row) !== null;
    if (pending === "1" && !isPending) return false;
    if (pending === "0" && isPending) return false;

    return (
      !filter ||
      row.name.toLowerCase().includes(filter) ||
      row.code.toLowerCase().includes(filter)
    );
  })
    .map((row) => programView(row))
    .sort(
      (left, right) =>
        right.year - left.year || right.code.localeCompare(left.code),
    );
};

export const programMock: MockHandler = (ctx) => {
  const match = ctx.path.match(/^\/program(?:\/([^/]+))?$/);
  if (!match) return null;

  const [, id] = match;
  const can = (action: MockAction) => ctx.can(MENU.PROGRAM, action);
  const scope = komisiScopeOf(ctx.isAdmin, ctx.can(MENU.PAGU_ANGGARAN, "VIEW"));

  if (ctx.method === "GET") {
    if (!can("VIEW")) return denied();

    if (!id) {
      if (process.env.MOCK_500) {
        return programFailure(500, "Internal Server Error");
      }

      return list(listRows(ctx.url, scope), ctx.url, "Program", "Program");
    }

    // Di luar lingkup komisi dijawab 404, sama dengan tidak ada — bentuk yang
    // sama dengan Permintaan Persetujuan, dan sengaja tidak dibedakan.
    const row = PROGRAM.find(
      (item) =>
        isLive(item) &&
        item.publicId === id &&
        isVisibleBapel(scope, item.bapelId),
    );

    return row
      ? json({
          status: 200,
          message: "Berhasil Mendapatkan Program",
          data: programView(row, true),
        })
      : programFailure(404, NOT_FOUND);
  }

  return null;
};
