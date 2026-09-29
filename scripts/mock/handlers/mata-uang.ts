/**
 * Tiruan `/api/v1/mata-uang` (+ `/kurs`) be-sada `modules/mata_uang` sesudah MU1–MU3,
 * di atas larik CURRENCY dan EXCHANGE_RATE store Pengadaan.
 *
 *   MOCK_EMPTY=1                   → daftar kosong (404)
 *   MOCK_500=1                     → daftar menjawab 500
 *   MOCK_CURRENCY_SAVE_ERROR=500   → POST/PUT/DELETE menjawab 500
 */
import { MENU } from "../../../src/config/menu";
import { collapseSpaces } from "../../../src/lib/name";
import { denied, json, list, readBody, type MockHandler } from "../kit";
import {
  CURRENCY,
  EXCHANGE_RATE,
  TODAY,
  currencyInUse,
  currencyOf,
  currencyView,
  isLive,
  rateView,
  type CurrencyRow,
  type RateRow,
} from "../pengadaan-store";

type Issue = { path: string; message: string };

type Body = Record<string, unknown>;

const failure = (status: number, issues: Issue[]) =>
  json({ status, error: issues[0]?.message, issues }, status);

const notFound = (error: string) => json({ status: 404, error }, 404);

const serverError = () =>
  json({ status: 500, error: "Kesalahan server." }, 500);

const MAX_RATE = 999_999_999_999;

const nextId = (rows: readonly { id: number }[]) =>
  Math.max(0, ...rows.map((row) => row.id)) + 1;

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : null;

const parseCurrency = (body: Body) => {
  const issues: Issue[] = [];
  const code = text(body.code);
  const name = text(body.name);
  const symbol = text(body.symbol);

  if (code === null) {
    issues.push({ path: "code", message: "Mohon Lengkapi Kode Mata Uang" });
  } else if (code.length !== 3) {
    issues.push({ path: "code", message: "Kode Mata Uang harus 3 huruf" });
  } else if (!/^[A-Za-z]{3}$/.test(code)) {
    issues.push({ path: "code", message: "Kode Mata Uang hanya boleh huruf" });
  }

  if (!name) {
    issues.push({ path: "name", message: "Mohon Lengkapi Nama Mata Uang" });
  } else if (name.length > 50) {
    issues.push({
      path: "name",
      message: "Nama Mata Uang tidak boleh lebih dari 50 karakter",
    });
  }

  if (!symbol) {
    issues.push({ path: "symbol", message: "Mohon Lengkapi Simbol" });
  } else if (symbol.length > 5) {
    issues.push({
      path: "symbol",
      message: "Simbol tidak boleh lebih dari 5 karakter",
    });
  }

  return issues.length > 0
    ? { issues }
    : {
        code: (code ?? "").toUpperCase(),
        name: collapseSpaces(name ?? ""),
        symbol: symbol ?? "",
      };
};

const parseRate = (body: Body) => {
  const issues: Issue[] = [];
  const currencyCode = text(body.currencyCode);
  const rateDate = text(body.rateDate)?.slice(0, 10) ?? "";
  const rate = Number(body.rate);
  const source = body.source ?? "MANUAL";

  if (!currencyCode) {
    issues.push({ path: "currencyCode", message: "Mohon Lengkapi Mata Uang" });
  } else if (currencyCode.length !== 3) {
    issues.push({
      path: "currencyCode",
      message: "Kode Mata Uang harus 3 huruf",
    });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(rateDate)) {
    issues.push({ path: "rateDate", message: "Mohon Lengkapi Tanggal Kurs" });
  } else if (rateDate > TODAY) {
    issues.push({
      path: "rateDate",
      message: "Tanggal Kurs Tidak Boleh Di Masa Depan",
    });
  }

  if (body.rate === undefined || body.rate === "" || Number.isNaN(rate)) {
    issues.push({ path: "rate", message: "Mohon Lengkapi Kurs" });
  } else if (rate <= 0) {
    issues.push({ path: "rate", message: "Kurs harus lebih dari 0" });
  } else if (rate > MAX_RATE) {
    issues.push({
      path: "rate",
      message: "Kurs tidak boleh lebih dari 999.999.999.999",
    });
  } else if ((String(body.rate).split(".")[1] ?? "").length > 6) {
    issues.push({
      path: "rate",
      message: "Kurs maksimal 6 angka di belakang koma",
    });
  }

  if (source !== "MANUAL" && source !== "AUTO") {
    issues.push({ path: "source", message: "Sumber Kurs tidak valid" });
  }

  return issues.length > 0
    ? { issues }
    : { currencyCode: (currencyCode ?? "").toUpperCase(), rateDate, rate };
};

const byBaseThenCode = (a: CurrencyRow, b: CurrencyRow) =>
  Number(b.isBase) - Number(a.isBase) || a.code.localeCompare(b.code);

const matches = (row: CurrencyRow, filter: string) =>
  !filter ||
  row.code.toLowerCase().includes(filter) ||
  row.name.toLowerCase().includes(filter);

const rateOf = (id: string) =>
  EXCHANGE_RATE.find((row) => String(row.id) === id);

const isRateTaken = (currencyCode: string, rateDate: string) =>
  EXCHANGE_RATE.some(
    (row) =>
      row.currencyCode === currencyCode &&
      row.rateDate === rateDate &&
      row.source === "MANUAL",
  );

const actionOf = (method: string) =>
  method === "POST"
    ? "CREATE"
    : method === "PUT"
      ? "UPDATE"
      : method === "DELETE"
        ? "DELETE"
        : "VIEW";

const rates: MockHandler = async ({ request, url, path, method }) => {
  const id = path.match(/^\/mata-uang\/kurs\/([^/]+)$/)?.[1];

  if (!id && method === "GET") {
    if (process.env.MOCK_500) return serverError();

    const params = url.searchParams;
    const code = (params.get("currencyCode") ?? "").toUpperCase();
    const start = params.get("startDate") ?? "";
    const end = params.get("endDate") ?? "";

    return list(
      EXCHANGE_RATE.filter(
        (row) =>
          (!code || row.currencyCode === code) &&
          (!start || row.rateDate >= start) &&
          (!end || row.rateDate <= end),
      )
        .sort((a, b) => b.rateDate.localeCompare(a.rateDate) || b.id - a.id)
        .map(rateView),
      url,
      "Kurs",
      "Kurs",
      "Berhasil Mendapatkan Kurs",
    );
  }

  if (!id && method === "POST") {
    const parsed = parseRate(await readBody<Body>(request));
    if (parsed.issues) return failure(400, parsed.issues);

    const currency = currencyOf(parsed.currencyCode);
    if (!currency) {
      return failure(404, [
        { path: "currencyCode", message: "Mata Uang Tidak Ditemukan" },
      ]);
    }
    if (currency.isBase) {
      return failure(400, [
        {
          path: "currencyCode",
          message:
            "Mata Uang Dasar Tidak Memiliki Kurs. Satu Rupiah Tetap Satu Rupiah",
        },
      ]);
    }
    if (isRateTaken(currency.code, parsed.rateDate)) {
      return failure(409, [
        {
          path: "rateDate",
          message: "Kurs Untuk Tanggal Dan Sumber Ini Sudah Ada",
        },
      ]);
    }

    const row: RateRow = {
      id: nextId(EXCHANGE_RATE),
      publicId: crypto.randomUUID(),
      currencyCode: currency.code,
      rateDate: parsed.rateDate,
      rate: parsed.rate,
      source: "MANUAL",
    };
    EXCHANGE_RATE.push(row);

    return json(
      {
        status: 201,
        message: "Berhasil Menambahkan Kurs",
        data: rateView(row),
      },
      201,
    );
  }

  if (!id) return null;

  if (method === "PUT") {
    const parsed = parseRate(await readBody<Body>(request));
    if (parsed.issues) return failure(400, parsed.issues);

    const row = rateOf(id);
    if (!row) return notFound("Kurs Tidak Ditemukan");

    row.rate = parsed.rate;

    return json({
      status: 200,
      message: "Berhasil Mengubah Kurs",
      data: rateView(row),
    });
  }

  const row = rateOf(id);
  if (!row) return notFound("Kurs Tidak Ditemukan");

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Kurs",
      data: rateView(row),
    });
  }

  if (method === "DELETE") {
    EXCHANGE_RATE.splice(EXCHANGE_RATE.indexOf(row), 1);

    return json({
      status: 200,
      message: "Berhasil Menghapus Kurs",
      data: rateView(row),
    });
  }

  return null;
};

const currencies: MockHandler = async ({ request, url, path, method }) => {
  const code = path.match(/^\/mata-uang\/([^/]+)$/)?.[1];

  if (!code && method === "GET") {
    if (process.env.MOCK_500) return serverError();

    const filter = (url.searchParams.get("filter") ?? "").toLowerCase();

    return list(
      CURRENCY.filter((row) => isLive(row) && matches(row, filter))
        .sort(byBaseThenCode)
        .map(currencyView),
      url,
      "Mata Uang",
      "Mata Uang",
      "Berhasil Mendapatkan Mata Uang",
    );
  }

  if (!code && method === "POST") {
    const parsed = parseCurrency(await readBody<Body>(request));
    if (parsed.issues) return failure(400, parsed.issues);
    if (currencyOf(parsed.code)) {
      return failure(409, [
        { path: "code", message: "Mata Uang Sudah Tersedia" },
      ]);
    }

    const row: CurrencyRow = {
      id: nextId(CURRENCY),
      publicId: crypto.randomUUID(),
      code: parsed.code,
      name: parsed.name,
      symbol: parsed.symbol,
      isBase: false,
      deletedAt: null,
    };
    CURRENCY.push(row);

    return json(
      {
        status: 201,
        message: "Berhasil Menambahkan Mata Uang",
        data: currencyView(row),
      },
      201,
    );
  }

  if (!code) return null;

  if (method === "PUT") {
    const parsed = parseCurrency(await readBody<Body>(request));
    if (parsed.issues) return failure(400, parsed.issues);

    const row = currencyOf(code);
    if (!row) return notFound("Mata Uang Tidak Ditemukan");

    row.name = parsed.name;
    row.symbol = parsed.symbol;

    return json({
      status: 200,
      message: "Berhasil Mengubah Mata Uang",
      data: currencyView(row),
    });
  }

  const row = currencyOf(code);
  if (!row) return notFound("Mata Uang Tidak Ditemukan");

  if (method === "GET") {
    return json({
      status: 200,
      message: "Berhasil Mendapatkan Mata Uang",
      data: currencyView(row),
    });
  }

  if (method === "DELETE") {
    if (row.isBase) {
      return json(
        { status: 400, error: "Mata Uang Dasar Tidak Dapat Dihapus" },
        400,
      );
    }
    if (currencyInUse(row.code)) {
      return json(
        {
          status: 400,
          error:
            "Mata Uang Ini Masih Dipakai Oleh Permintaan, Pesanan, Faktur Atau Kurs",
        },
        400,
      );
    }

    row.deletedAt = new Date().toISOString();

    return json({
      status: 200,
      message: "Berhasil Menghapus Mata Uang",
      data: currencyView(row),
    });
  }

  return null;
};

export const mataUangMock: MockHandler = (ctx) => {
  const { path, method, can } = ctx;

  if (path !== "/mata-uang" && !path.startsWith("/mata-uang/")) return null;
  if (!can(MENU.MATA_UANG, actionOf(method))) return denied();
  if (method !== "GET" && process.env.MOCK_CURRENCY_SAVE_ERROR === "500") {
    return serverError();
  }

  const isRate =
    path === "/mata-uang/kurs" || path.startsWith("/mata-uang/kurs/");

  return isRate ? rates(ctx) : currencies(ctx);
};
