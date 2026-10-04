/**
 * Tiruan `/api/v1/laporan-budget` (kontrak Anggaran §5). Larik
 * `BUDGET_USAGE_REPORT` milik handler ini.
 *
 * Bacaan, `belum-lapor`, dan `prefill` milik TL — ketiganya memakai fungsi
 * pencairan yang sama dengan gerbang, supaya layar dan gerbang tidak pernah
 * berbeda pendapat. Jalur tulis diisi agent AL.
 *
 *   MOCK_EMPTY=1        → daftar kosong (404)
 *   MOCK_500=1          → daftar menjawab 500
 *   MOCK_NO_PREFILL=1   → prefill kosong (bukan galat)
 *   MOCK_NO_WORKFLOW=1  → ajukan ditolak: belum ada alur persetujuan
 *   MOCK_NO_PENGURUS=1  → ajukan ditolak: komisi tanpa pemegang jabatan
 */
import { MENU } from "../../../src/config/menu";
import {
  BUDGET_USAGE_REPORT,
  TODAY,
  complianceRows,
  currentBudgetYear,
  isLive,
  prefillLines,
  isVisibleBapel,
  komisiScopeOf,
  reportOpenApproval,
  reportView,
  type KomisiScope,
} from "../anggaran-store";
import { denied, json, list, type MockAction, type MockHandler } from "../kit";

type Issue = { path: string; message: string };

const NOT_FOUND = "Laporan Pemakaian Budget Tidak Ditemukan";

export const reportFailure = (
  status: number,
  error: string,
  extra: { issues?: Issue[]; code?: string } = {},
) => json({ status, error, ...extra }, status);

const listRows = (url: URL, scope: KomisiScope) => {
  const year = Number(url.searchParams.get("year")) || 0;
  const month = Number(url.searchParams.get("month")) || 0;
  const bapelId = Number(url.searchParams.get("bapelId")) || 0;
  const status = url.searchParams.get("status") ?? "";
  const filter = (url.searchParams.get("filter") ?? "").toLowerCase();

  return BUDGET_USAGE_REPORT.filter((row) => {
    if (!isLive(row)) return false;
    if (!isVisibleBapel(scope, row.bapelId)) return false;
    if (year && row.year !== year) return false;
    if (month && row.month !== month) return false;
    if (bapelId && row.bapelId !== bapelId) return false;
    if (status === "DRAFT" || status === "APPROVED") {
      if (row.status !== status) return false;
    }

    return true;
  })
    .map((row) => reportView(row))
    .filter(
      (row) =>
        !filter ||
        row.code.toLowerCase().includes(filter) ||
        (row.bapel?.name ?? "").toLowerCase().includes(filter),
    )
    .sort(
      (left, right) =>
        right.year - left.year ||
        right.month - left.month ||
        right.code.localeCompare(left.code),
    );
};

// Bawaan bulan lalu: LPJ ditulis di awal bulan untuk bulan yang baru selesai.
// Bulan KALENDER, bukan tahun pelayanan (kontrak §1.0).
const defaultPeriod = () => {
  const year = Number(TODAY.slice(0, 4));
  const month = Number(TODAY.slice(5, 7));

  return month === 1
    ? { year: year - 1, month: 12 }
    : { year, month: month - 1 };
};

const monthParams = (url: URL) => {
  const fallback = defaultPeriod();

  return {
    year: Number(url.searchParams.get("year")) || fallback.year,
    month: Number(url.searchParams.get("month")) || fallback.month,
  };
};

const compliance = (url: URL, scope: KomisiScope) => {
  const { year, month } = monthParams(url);

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Kepatuhan Laporan",
    data: complianceRows(year, month, scope),
  });
};

const prefill = (url: URL, scope: KomisiScope) => {
  const { year, month } = monthParams(url);
  const bapelId = Number(url.searchParams.get("bapelId")) || 0;

  if (bapelId && !isVisibleBapel(scope, bapelId)) {
    return reportFailure(404, NOT_FOUND);
  }

  if (!bapelId) {
    return reportFailure(400, "Komisi tidak valid", {
      issues: [{ path: "bapelId", message: "Komisi tidak valid" }],
    });
  }

  const data = process.env.MOCK_NO_PREFILL
    ? { lines: [], total: "0" }
    : prefillLines(bapelId, year, month);

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Rincian Kas Keluar",
    data,
  });
};

export const laporanBudgetMock: MockHandler = (ctx) => {
  const match = ctx.path.match(/^\/laporan-budget(?:\/([^/]+))?$/);
  if (!match) return null;

  const [, segment] = match;
  const can = (action: MockAction) => ctx.can(MENU.LAPORAN_BUDGET, action);
  const scope = komisiScopeOf(ctx.isAdmin, ctx.can(MENU.PAGU_ANGGARAN, "VIEW"));

  if (ctx.method !== "GET") return null;
  if (!can("VIEW")) return denied();

  if (segment === "belum-lapor") return compliance(ctx.url, scope);
  if (segment === "prefill") return prefill(ctx.url, scope);

  if (!segment) {
    if (process.env.MOCK_500) {
      return reportFailure(500, "Internal Server Error");
    }

    return list(
      listRows(ctx.url, scope),
      ctx.url,
      "Laporan Pemakaian Budget",
      "Laporan Pemakaian Budget",
    );
  }

  // Kwitansi LPJ adalah berkas paling sensitif di grup ini; di luar lingkup
  // komisi dijawab 404, sama dengan tidak ada.
  const row = BUDGET_USAGE_REPORT.find(
    (item) =>
      isLive(item) &&
      item.publicId === segment &&
      isVisibleBapel(scope, item.bapelId),
  );

  return row
    ? json({
        status: 200,
        message: "Berhasil Mendapatkan Laporan Pemakaian Budget",
        data: reportView(row, true),
      })
    : reportFailure(404, NOT_FOUND);
};

export { reportOpenApproval, currentBudgetYear };
