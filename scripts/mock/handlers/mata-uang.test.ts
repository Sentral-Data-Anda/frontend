import { afterEach, describe, expect, test } from "bun:test";

import { MENU } from "../../../src/config/menu";
import type { MockAction } from "../kit";
import { CURRENCY, EXCHANGE_RATE, TODAY } from "../pengadaan-store";

import { mataUangMock } from "./mata-uang";

type Json = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data?: unknown;
};

const SEED_CURRENCY = CURRENCY.map((row) => ({ ...row }));
const SEED_RATE = EXCHANGE_RATE.map((row) => ({ ...row }));

afterEach(() => {
  CURRENCY.splice(
    0,
    CURRENCY.length,
    ...SEED_CURRENCY.map((row) => ({ ...row })),
  );
  EXCHANGE_RATE.splice(
    0,
    EXCHANGE_RATE.length,
    ...SEED_RATE.map((row) => ({ ...row })),
  );
});

const onCall = async (
  method: string,
  input: string,
  body?: unknown,
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(`/api/v1${input}`, "http://mock.test");
  const request = new Request(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const response = await mataUangMock({
    request,
    url,
    path: input.split("?")[0] ?? "",
    method,
    can,
    isAdmin: true,
    sessionCode: "test",
  });

  if (!response) return null;

  return { status: response.status, body: (await response.json()) as Json };
};

const codesOf = (body: Json | undefined) =>
  (body?.data as { code: string }[]).map((row) => row.code);

describe("mock /mata-uang", () => {
  test("daftar dasar dulu lalu kode; cari kode atau nama; desimal terpendek", async () => {
    const all = await onCall("GET", "/mata-uang");
    expect(codesOf(all?.body)).toEqual(["IDR", "EUR", "SGD", "USD"]);

    const usd = (all?.body.data as { code: string; latestRate: unknown }[]).at(
      -1,
    );
    expect(usd?.latestRate).toEqual({
      rate: "15800",
      rateDate: expect.any(String),
    });

    const found = await onCall("GET", "/mata-uang?filter=singa");
    expect(codesOf(found?.body)).toEqual(["SGD"]);
  });

  test("kode tanpa peka huruf besar; tidak ada 404", async () => {
    expect((await onCall("GET", "/mata-uang/usd"))?.status).toBe(200);
    expect((await onCall("GET", "/mata-uang/XYZ"))?.body.error).toBe(
      "Mata Uang Tidak Ditemukan",
    );
  });

  test("tambah: zod dengan issues, lalu 409 kode", async () => {
    const invalid = await onCall("POST", "/mata-uang", {
      code: "U1",
      name: "",
      symbol: "123456",
    });
    expect(invalid?.body.issues?.map((issue) => issue.path)).toEqual([
      "code",
      "name",
      "symbol",
    ]);

    const taken = await onCall("POST", "/mata-uang", {
      code: "usd",
      name: "Dolar",
      symbol: "$",
    });
    expect(taken?.status).toBe(409);
    expect(taken?.body.issues).toEqual([
      { path: "code", message: "Mata Uang Sudah Tersedia" },
    ]);

    const created = await onCall("POST", "/mata-uang", {
      code: "jpy",
      name: "  Yen   Jepang ",
      symbol: "¥",
    });
    expect(created?.status).toBe(201);
    expect(created?.body.data).toMatchObject({
      code: "JPY",
      name: "Yen Jepang",
    });
  });

  test("ubah tidak mengganti kode", async () => {
    const updated = await onCall("PUT", "/mata-uang/USD", {
      code: "XXX",
      name: "Dolar AS",
      symbol: "$",
    });
    expect(updated?.body.data).toMatchObject({ code: "USD", name: "Dolar AS" });
  });

  test("hapus: dasar ditolak, dipakai kurs ditolak, tanpa kurs boleh", async () => {
    expect((await onCall("DELETE", "/mata-uang/IDR"))?.body.error).toBe(
      "Mata Uang Dasar Tidak Dapat Dihapus",
    );
    expect((await onCall("DELETE", "/mata-uang/USD"))?.body.error).toBe(
      "Mata Uang Ini Masih Dipakai Oleh Permintaan, Pesanan, Faktur Atau Kurs",
    );
    expect((await onCall("DELETE", "/mata-uang/EUR"))?.status).toBe(200);
    expect((await onCall("GET", "/mata-uang/EUR"))?.status).toBe(404);
  });

  test("guard per aksi", async () => {
    const viewOnly = (slug: string, action: MockAction) =>
      slug === MENU.MATA_UANG && action === "VIEW";

    expect(
      (await onCall("GET", "/mata-uang", undefined, viewOnly))?.status,
    ).toBe(200);
    expect(
      (await onCall("POST", "/mata-uang/kurs", {}, viewOnly))?.status,
    ).toBe(403);
  });
});

describe("mock /mata-uang/kurs", () => {
  test("daftar per mata uang, urut tanggal terbaru, rentang tanggal", async () => {
    const usd = await onCall("GET", "/mata-uang/kurs?currencyCode=usd");
    const dates = (usd?.body.data as { rateDate: string }[]).map(
      (row) => row.rateDate,
    );
    expect(dates).toEqual([...dates].sort().reverse());
    expect(dates).toHaveLength(4);

    const none = await onCall(
      "GET",
      "/mata-uang/kurs?currencyCode=USD&startDate=2000-01-01&endDate=2000-01-31",
    );
    expect(none?.body.error).toBe("Kurs Tidak Ditemukan");
  });

  test("tambah: masa depan, IDR, mata uang tidak ada, ganda", async () => {
    const future = await onCall("POST", "/mata-uang/kurs", {
      currencyCode: "USD",
      rateDate: "2999-01-01",
      rate: "1",
    });
    expect(future?.body.issues?.[0]?.message).toBe(
      "Tanggal Kurs Tidak Boleh Di Masa Depan",
    );

    const base = await onCall("POST", "/mata-uang/kurs", {
      currencyCode: "IDR",
      rateDate: TODAY,
      rate: "1",
    });
    expect(base?.body.issues?.[0]?.path).toBe("currencyCode");

    const unknown = await onCall("POST", "/mata-uang/kurs", {
      currencyCode: "XYZ",
      rateDate: TODAY,
      rate: "1",
    });
    expect(unknown?.status).toBe(404);
    expect(unknown?.body.issues?.[0]?.path).toBe("currencyCode");

    const created = await onCall("POST", "/mata-uang/kurs", {
      currencyCode: "usd",
      rateDate: TODAY,
      rate: "15900.25",
    });
    expect(created?.status).toBe(201);
    expect(created?.body.data).toMatchObject({
      currencyCode: "USD",
      rate: "15900.25",
      source: "MANUAL",
    });

    const twice = await onCall("POST", "/mata-uang/kurs", {
      currencyCode: "USD",
      rateDate: TODAY,
      rate: "1",
      source: "MANUAL",
    });
    expect(twice?.status).toBe(409);
    expect(twice?.body.issues?.[0]?.path).toBe("rateDate");
  });

  test("ubah hanya angka kurs; hapus permanen", async () => {
    const id = EXCHANGE_RATE[0]?.id;
    const before = EXCHANGE_RATE[0]?.rateDate;

    const updated = await onCall("PUT", `/mata-uang/kurs/${id}`, {
      currencyCode: "USD",
      rateDate: TODAY,
      rate: "16000",
      source: "MANUAL",
    });
    expect(updated?.body.data).toMatchObject({ rate: "16000" });
    expect(EXCHANGE_RATE[0]?.rateDate).toBe(before);

    expect((await onCall("DELETE", `/mata-uang/kurs/${id}`))?.status).toBe(200);
    expect((await onCall("GET", `/mata-uang/kurs/${id}`))?.status).toBe(404);
  });
});
