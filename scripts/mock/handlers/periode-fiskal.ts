/**
 * Tiruan `/api/v1/periode-fiskal`. Bentuk bacaan daftar dipakai juga oleh widget
 * Beranda, jadi kuncinya tidak boleh berubah (README §4 TL-4).
 *
 *   MOCK_NO_PERIOD=1      → belum ada periode sama sekali
 *   MOCK_PERIOD_CLOSED=1  → seluruh bulan tertutup
 *   MOCK_500=1            → daftar menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { SESSION_USER_ID } from "../../mock-dashboard";
import {
  FISCAL_PERIOD,
  monthLabel,
  periodView,
  type FiscalPeriodRow,
} from "../keuangan-store";
import { denied, json, list, readBody, type MockHandler } from "../kit";

type Issue = { path: string; message: string };

const failure = (status: number, issues: Issue[]) =>
  json({ status, error: issues[0]?.message, issues }, status);

const serverError = () =>
  json({ status: 500, error: "Kesalahan server." }, 500);

const CHECKLIST: Record<string, [number, number]> = {};

if (process.env.MOCK_NO_PERIOD) {
  FISCAL_PERIOD.length = 0;
}

if (process.env.MOCK_PERIOD_CLOSED) {
  for (const row of FISCAL_PERIOD) {
    row.status = "CLOSED";
    row.closedById = SESSION_USER_ID;
    row.closedAt = `${row.year}-${String(row.month).padStart(2, "0")}-28T09:00:00.000Z`;
  }
}

const seededRow =
  FISCAL_PERIOD.find(
    (row) => row.status === "OPEN" && periodView(row).draftCount > 0,
  ) ?? FISCAL_PERIOD.find((row) => row.status === "OPEN");

if (seededRow) CHECKLIST[seededRow.id] = [3, 1];

const detailView = (row: FiscalPeriodRow) => {
  const [unposted, unpaid] = CHECKLIST[row.id] ?? [0, 0];

  return {
    ...periodView(row),
    unpostedPersembahanCount: unposted,
    unpaidApprovedExpenseCount: unpaid,
  };
};

const rowOf = (id: string) => FISCAL_PERIOD.find((row) => row.id === id);

const isBefore = (row: FiscalPeriodRow, target: FiscalPeriodRow) =>
  row.year < target.year ||
  (row.year === target.year && row.month < target.month);

const labelOf = (row: FiscalPeriodRow) => monthLabel(row.year, row.month);

const actionOf = (method: string) =>
  method === "POST" ? "CREATE" : method === "PUT" ? "UPDATE" : "VIEW";

const openYear = (year: number) => {
  const rows = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;

    return {
      id: `fp-${year}-${month}`,
      year,
      month,
      status: "OPEN",
      closedById: null,
      closedAt: null,
      reopenedById: null,
      reopenedAt: null,
      reopenReason: null,
    } satisfies FiscalPeriodRow;
  });

  FISCAL_PERIOD.push(...rows);

  return rows;
};

const readYear = (body: Record<string, unknown>) => {
  const year = Number(body.year);
  const issues: Issue[] = [];
  let status = 400;

  if (body.year === undefined || body.year === "" || !Number.isInteger(year)) {
    issues.push({ path: "year", message: "Mohon Lengkapi Tahun" });
  } else if (year < 2000 || year > 2100) {
    issues.push({ path: "year", message: "Tahun Harus Antara 2000 Dan 2100" });
  } else if (FISCAL_PERIOD.some((row) => row.year === year)) {
    status = 409;
    issues.push({
      path: "year",
      message: `Periode Fiskal Tahun ${year} Sudah Dibuka`,
    });
  }

  return issues.length > 0 ? { issues, status } : { year };
};

export const periodeFiskalMock: MockHandler = async (ctx) => {
  const { request, path, method, url, can } = ctx;

  if (path !== "/periode-fiskal" && !path.startsWith("/periode-fiskal/")) {
    return null;
  }
  if (!can(MENU.PERIODE_FISKAL, actionOf(method))) return denied();

  if (path === "/periode-fiskal" && method === "GET") {
    if (process.env.MOCK_500) return serverError();

    const year = Number(url.searchParams.get("year")) || null;
    const status = url.searchParams.get("status");
    const rows = FISCAL_PERIOD.filter(
      (row) =>
        (!year || row.year === year) &&
        (!["OPEN", "CLOSED"].includes(status ?? "") || row.status === status),
    )
      .sort((a, b) => a.year - b.year || a.month - b.month)
      .map(periodView);

    return list(rows, url, "Periode Fiskal", "Periode Fiskal");
  }

  if (path === "/periode-fiskal" && method === "POST") {
    const parsed = readYear(await readBody<Record<string, unknown>>(request));

    if (parsed.issues) return failure(parsed.status, parsed.issues);

    return json(
      {
        status: 201,
        message: `Berhasil Membuka Tahun ${parsed.year}`,
        data: openYear(parsed.year).map(periodView),
      },
      201,
    );
  }

  const rest = path.slice("/periode-fiskal/".length);
  const [rawId, action] = rest.split("/");
  const row = rowOf(decodeURIComponent(rawId ?? ""));

  if (!row) {
    return json({ status: 404, error: "Periode Fiskal Tidak Ditemukan" }, 404);
  }

  if (!action && method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Periode Fiskal",
      data: detailView(row),
    });
  }

  if (action === "tutup" && method === "PUT") {
    if (row.status === "CLOSED") {
      return json({ status: 400, error: "Periode Sudah Tertutup" }, 400);
    }

    const earlier = FISCAL_PERIOD.filter(
      (item) => item.status === "OPEN" && isBefore(item, row),
    ).sort((a, b) => a.year - b.year || a.month - b.month)[0];

    if (earlier) {
      return json(
        { status: 400, error: `Tutup ${labelOf(earlier)} Terlebih Dahulu` },
        400,
      );
    }

    const { draftCount } = periodView(row);

    if (draftCount > 0) {
      return json(
        {
          status: 400,
          error: `Periode Masih Memiliki ${draftCount} Entri Draf Jurnal`,
        },
        400,
      );
    }

    row.status = "CLOSED";
    row.closedById = SESSION_USER_ID;
    row.closedAt = new Date().toISOString();

    return json({
      status: 200,
      message: `Berhasil Menutup Buku ${labelOf(row)}`,
      data: detailView(row),
    });
  }

  if (action === "buka" && method === "PUT") {
    if (row.status === "OPEN") {
      return json({ status: 400, error: "Periode Masih Terbuka" }, 400);
    }

    const body = await readBody<Record<string, unknown>>(request);
    const reason =
      typeof body.reopenReason === "string" ? body.reopenReason.trim() : "";

    if (!reason) {
      return failure(400, [
        { path: "reopenReason", message: "Mohon Lengkapi Alasan" },
      ]);
    }
    if (reason.length > 250) {
      return failure(400, [
        {
          path: "reopenReason",
          message: "Alasan tidak boleh lebih dari 250 karakter",
        },
      ]);
    }

    row.status = "OPEN";
    row.reopenedById = SESSION_USER_ID;
    row.reopenedAt = new Date().toISOString();
    row.reopenReason = reason;

    return json({
      status: 200,
      message: `Berhasil Membuka Kembali Buku ${labelOf(row)}`,
      data: detailView(row),
    });
  }

  return null;
};
