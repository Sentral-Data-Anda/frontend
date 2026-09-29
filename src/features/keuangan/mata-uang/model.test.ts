import { describe, expect, test } from "bun:test";

import { addDays, todayJakarta } from "@/lib/date";

import {
  currencyFormSchema,
  currencyServerError,
  formatRate,
  latestRateLabel,
  rateDeleteText,
  rateFormSchema,
  rateServerError,
  toCurrencyCode,
  toCurrencyPayload,
  toRateApiFilters,
  toRateForm,
  toRatePayload,
} from "./model";
import type { Currency, Rate } from "./types";

const issuesOf = (
  schema: typeof currencyFormSchema | typeof rateFormSchema,
  value: unknown,
) => {
  const parsed = schema.safeParse(value);

  return parsed.success
    ? []
    : parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
};

describe("skema mata uang", () => {
  test("kode diketik jadi huruf besar, hanya huruf, maks 3", () => {
    expect(toCurrencyCode("usd")).toBe("USD");
    expect(toCurrencyCode("u$1sdx")).toBe("USD");
    expect(toCurrencyCode("eu")).toBe("EU");
  });

  test("kode harus 3 huruf; nama dan simbol wajib dengan batas panjang", () => {
    expect(
      issuesOf(currencyFormSchema, {
        code: "USD",
        name: "Dolar",
        symbol: "US$",
      }),
    ).toEqual([]);
    expect(
      issuesOf(currencyFormSchema, { code: "US", name: "", symbol: "" }),
    ).toEqual([
      "code: Kode mata uang harus 3 huruf, mis. USD",
      "name: Isi nama mata uang",
      "symbol: Isi simbol mata uang",
    ]);
    expect(
      issuesOf(currencyFormSchema, {
        code: "USD",
        name: "x".repeat(51),
        symbol: "123456",
      }),
    ).toEqual([
      "name: Nama mata uang maksimal 50 karakter",
      "symbol: Simbol maksimal 5 karakter",
    ]);
  });

  test("payload merapikan spasi nama dan huruf kode", () => {
    expect(
      toCurrencyPayload({
        code: "sgd",
        name: "  Dolar   Singapura ",
        symbol: " S$ ",
      }),
    ).toEqual({ code: "SGD", name: "Dolar Singapura", symbol: "S$" });
  });

  test("409 kode dipakai jatuh ke field kode", () => {
    expect(currencyServerError("Mata Uang Sudah Tersedia")?.field).toBe("code");
    expect(currencyServerError("Kesalahan server.")).toBeNull();
  });
});

describe("skema kurs", () => {
  test("kurs desimal > 0 lolos, nol dan kosong ditolak", () => {
    const today = todayJakarta();

    expect(
      issuesOf(rateFormSchema, { rateDate: today, rate: "15800.5" }),
    ).toEqual([]);
    expect(issuesOf(rateFormSchema, { rateDate: today, rate: "0" })).toEqual([
      "rate: Kurs harus lebih dari 0",
    ]);
    expect(issuesOf(rateFormSchema, { rateDate: "", rate: "" })).toEqual([
      "rateDate: Isi tanggal kurs",
      "rate: Isi kurs",
    ]);
  });

  test("tanggal kurs di masa depan ditolak", () => {
    expect(
      issuesOf(rateFormSchema, {
        rateDate: addDays(todayJakarta(), 1),
        rate: "1",
      }),
    ).toEqual(["rateDate: Tanggal kurs tidak boleh di masa depan"]);
  });

  test("payload selalu MANUAL, kode dari halaman", () => {
    expect(
      toRatePayload({ rateDate: "2026-09-27", rate: "15800.5" }, "USD"),
    ).toEqual({
      currencyCode: "USD",
      rateDate: "2026-09-27",
      rate: "15800.5",
      source: "MANUAL",
    });
  });

  test("isi awal form menerima desimal terpendek maupun 6 desimal", () => {
    const rate = { rateDate: "2026-09-27T00:00:00.000Z" } as Rate;

    expect(toRateForm({ ...rate, rate: "15800" })).toEqual({
      rateDate: "2026-09-27",
      rate: "15800",
    });
    expect(toRateForm({ ...rate, rate: "15800.500000" }).rate).toBe("15800.5");
    expect(toRateForm({ ...rate, rate: "15800.000000" }).rate).toBe("15800");
    expect(toRateForm({ ...rate, rate: "0.123456" }).rate).toBe("0.123456");
  });

  test("409 kurs ganda jatuh ke tanggal kurs", () => {
    expect(
      rateServerError("Kurs Untuk Tanggal Dan Sumber Ini Sudah Ada")?.field,
    ).toBe("rateDate");
  });
});

describe("tampilan", () => {
  test("kurs sampai 6 desimal tanpa nol berlebih", () => {
    expect(formatRate("15800")).toBe("Rp 15.800");
    expect(formatRate("15800.500000")).toBe("Rp 15.800,5");
    expect(formatRate("0.000123")).toBe("Rp 0,000123");
  });

  test("label kurs terakhir; kosong bila belum ada kurs", () => {
    const usd = {
      latestRate: { rate: "15800", rateDate: "2026-09-25T00:00:00.000Z" },
    } as Currency;

    expect(latestRateLabel(usd)).toBe("Rp 15.800 · 25 Sep 2026");
    expect(latestRateLabel({ ...usd, latestRate: null })).toBeNull();
  });

  test("teks hapus kurs menyebut kode dan tanggal", () => {
    expect(rateDeleteText("USD", "2026-09-25T00:00:00.000Z")).toBe(
      "Apakah Anda ingin menghapus kurs USD tanggal 25 September 2026? Pesanan yang sudah memakainya tidak berubah.",
    );
  });

  test("filter bulan jadi rentang tanggal kurs", () => {
    expect(toRateApiFilters("USD", { bulan: "2026-02" })).toEqual({
      currencyCode: "USD",
      startDate: "2026-02-01",
      endDate: "2026-02-28",
    });
    expect(toRateApiFilters("USD", {})).toEqual({
      currencyCode: "USD",
      startDate: "",
      endDate: "",
    });
  });
});
