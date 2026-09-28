/**
 * Tiruan `/api/v1/penyusutan` (be-sada `modules/penyusutan`, kontrak inventaris-gaps):
 * daftar, satu, buka periode, `/hitung`, `/posting`, hapus draf. Kunci `:code`.
 *
 *   MOCK_EMPTY=1                        → daftar kosong (404)
 *   MOCK_500=1                          → daftar menjawab 500
 *   MOCK_DEPRECIATION_SAVE_ERROR=500    → buka periode menjawab 500
 *   MOCK_DEPRECIATION_ACTION_500=1      → hitung/posting/hapus menjawab 500
 *   MOCK_PENYUSUTAN_NO_SETTING=1        → posting ditolak: akun Setelan Akuntansi
 *   MOCK_PENYUSUTAN_PERIOD_CLOSED=1     → posting ditolak: periode fiskal
 */
import { MENU } from "../../../src/config/menu";
import {
  ASSET,
  RUN,
  calculateRun,
  isLive,
  nextRunPeriod,
  openRun,
  periodLabel,
  postRun,
  runOpenFailure,
  runView,
  type RunRow,
} from "../inventaris-store";
import {
  denied,
  json,
  list,
  readBody,
  type MockAction,
  type MockHandler,
} from "../kit";

const NOT_FOUND = "Penyusutan Tidak Ditemukan";

const indexOf = (period: { year: number; month: number }) =>
  period.year * 12 + period.month - 1;

const byPeriodDesc = (a: RunRow, b: RunRow) => indexOf(b) - indexOf(a);

const fail = (status: number, message: string, path?: string) =>
  json(
    {
      status,
      error: message,
      ...(path ? { issues: [{ path, message }] } : {}),
    },
    status,
  );

const serverError = () =>
  json({ status: 500, error: "Internal Server Error" }, 500);

const ACTION: Record<string, MockAction> = {
  POST: "CREATE",
  PUT: "UPDATE",
  DELETE: "DELETE",
};

const findRun = (code: string) =>
  RUN.find((run) => run.code.toLowerCase() === code.toLowerCase());

const earlierDraftOf = (run: RunRow) =>
  RUN.filter(
    (item) => item.status === "DRAFT" && indexOf(item) < indexOf(run),
  ).sort((a, b) => indexOf(a) - indexOf(b))[0];

const hasPostedRun = () => RUN.some((run) => run.status === "POSTED");

const parseOpen = (body: { year?: unknown; month?: unknown }) => {
  const issues: { path: string; message: string }[] = [];
  const { year, month } = body;

  if (year === undefined || year === null || year === "") {
    issues.push({ path: "year", message: "Mohon Lengkapi Tahun" });
  } else if (!Number.isInteger(year) || (year as number) < 2000) {
    issues.push({ path: "year", message: "Tahun tidak valid" });
  }
  if (month === undefined || month === null || month === "") {
    issues.push({ path: "month", message: "Mohon Lengkapi Bulan" });
  } else if (
    !Number.isInteger(month) ||
    (month as number) < 1 ||
    (month as number) > 12
  ) {
    issues.push({ path: "month", message: "Bulan harus antara 1 dan 12" });
  }

  return issues.length
    ? { issues }
    : { value: { year: year as number, month: month as number } };
};

// Pembantu store belum membedakan bulan yang terlewat dari bulan yang sudah lalu.
const openFailureOf = (year: number, month: number) => {
  const failure = runOpenFailure(year, month);
  const isDraftOpen = RUN.some((run) => run.status === "DRAFT");

  if (failure?.path !== "month" || isDraftOpen || !hasPostedRun()) {
    return failure;
  }

  const next = nextRunPeriod();

  return indexOf({ year, month }) < indexOf(next)
    ? {
        ...failure,
        message: `Penyusutan Berikutnya Adalah ${periodLabel(next.year, next.month)}`,
      }
    : failure;
};

const onList = (url: URL) => {
  if (process.env.MOCK_500) return serverError();

  const year = Number(url.searchParams.get("year")) || null;
  const status = url.searchParams.get("status");

  return list(
    RUN.filter((run) => (year ? run.year === year : true))
      .filter((run) => (status ? run.status === status : true))
      .sort(byPeriodDesc)
      .map((run) => runView(run)),
    url,
    "Penyusutan",
    "Penyusutan",
    "Berhasil Mendapatkan Penyusutan",
  );
};

const onOpen = async (request: Request) => {
  if (process.env.MOCK_DEPRECIATION_SAVE_ERROR === "500") return serverError();

  const parsed = parseOpen(await readBody(request));
  if (parsed.issues) {
    return json(
      { status: 400, error: parsed.issues[0].message, issues: parsed.issues },
      400,
    );
  }

  const failure = openFailureOf(parsed.value.year, parsed.value.month);
  if (failure) return fail(failure.status, failure.message, failure.path);

  return json(
    {
      status: 201,
      message: "Berhasil Membuka Penyusutan",
      data: runView(openRun(parsed.value.year, parsed.value.month), true),
    },
    201,
  );
};

const guardDraft = (run: RunRow) => {
  if (run.status !== "DRAFT") {
    return fail(400, "Penyusutan Ini Sudah Diposting Atau Dibalik");
  }

  const earlier = earlierDraftOf(run);

  return earlier
    ? fail(
        400,
        `Posting Penyusutan ${periodLabel(earlier.year, earlier.month)} Terlebih Dahulu`,
      )
    : null;
};

const onCalculate = (run: RunRow) => {
  const blocked = guardDraft(run);
  if (blocked) return blocked;

  if (!ASSET.some((row) => isLive(row) && row.isDepreciable)) {
    return fail(
      400,
      "Tidak Ada Barang Yang Disusutkan. Tandai Barang Sebagai Dapat Disusutkan Terlebih Dahulu",
    );
  }

  return json({
    status: 200,
    message: "Berhasil Menghitung Penyusutan",
    data: runView(calculateRun(run), true),
  });
};

const onPost = (run: RunRow) => {
  const blocked = guardDraft(run);
  if (blocked) return blocked;

  if (!run.updatedAt) {
    return fail(400, "Penyusutan Ini Belum Dihitung. Hitung Terlebih Dahulu");
  }
  if (run.entries.length > 0 && process.env.MOCK_PENYUSUTAN_NO_SETTING) {
    return fail(400, "Akun Beban Penyusutan Belum Diatur Di Setelan Akuntansi");
  }
  if (run.entries.length > 0 && process.env.MOCK_PENYUSUTAN_PERIOD_CLOSED) {
    return fail(
      400,
      "Periode Fiskal Untuk Bulan Ini Belum Dibuka Atau Sudah Ditutup",
    );
  }

  return json({
    status: 200,
    message: "Berhasil Memposting Penyusutan Ke Jurnal",
    data: runView(postRun(run), true),
  });
};

const onDelete = (run: RunRow) => {
  if (run.status !== "DRAFT") {
    return fail(400, "Penyusutan Ini Sudah Diposting Atau Dibalik");
  }

  RUN.splice(RUN.indexOf(run), 1);

  return json({
    status: 200,
    message: "Berhasil Menghapus Penyusutan",
    data: runView(run, true),
  });
};

export const penyusutanMock: MockHandler = async (ctx) => {
  const { path, method, url, request } = ctx;
  if (path !== "/penyusutan" && !path.startsWith("/penyusutan/")) return null;

  const match = path.match(/^\/penyusutan\/([^/]+)(?:\/(hitung|posting))?$/);
  if (path !== "/penyusutan" && !match) return null;

  if (!ctx.can(MENU.PENYUSUTAN, ACTION[method] ?? "VIEW")) return denied();

  if (path === "/penyusutan") {
    if (method === "GET") return onList(url);
    if (method === "POST") return onOpen(request);

    return null;
  }

  const [, code, step] = match as RegExpMatchArray;
  const isWrite = method !== "GET";

  if (isWrite && process.env.MOCK_DEPRECIATION_ACTION_500) return serverError();

  const run = findRun(decodeURIComponent(code));
  if (!run) return fail(404, NOT_FOUND);

  if (!step && method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Penyusutan",
      data: runView(run, true),
    });
  }
  if (step === "hitung" && method === "PUT") return onCalculate(run);
  if (step === "posting" && method === "PUT") return onPost(run);
  if (!step && method === "DELETE") return onDelete(run);

  return null;
};
