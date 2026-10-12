import { describe, expect, test } from "bun:test";

import {
  previewInterest,
  toPinjamanPayload,
  type PinjamanFormValues,
} from "./model";

const values = (overrides: Partial<PinjamanFormValues> = {}) =>
  ({
    direction: "BORROWED",
    counterpartyName: "GKPI Medan",
    jemaatId: "",
    principal: "10000000",
    agreementDate: "2026-01-10",
    termMonths: "12",
    interestMode: "NONE",
    interestPercent: "",
    notes: "",
    ...overrides,
  }) as PinjamanFormValues;

// Angka yang sama dengan loanRules.test.ts di be-sada. Dua tempat menghitung
// hal yang sama, jadi keduanya diuji dengan contoh yang sama supaya
// perbedaannya ketahuan, bukan tersembunyi sampai ada yang menyimpan.
describe("previewInterest", () => {
  test("tanpa bunga nol", () => {
    expect(previewInterest(values())).toBe(0);
  });

  test("flat seluruh masa", () => {
    expect(
      previewInterest(
        values({ interestMode: "FLAT_TOTAL", interestPercent: "5" }),
      ),
    ).toBe(500000);
  });

  test("flat per bulan", () => {
    expect(
      previewInterest(
        values({ interestMode: "FLAT_MONTHLY", interestPercent: "5" }),
      ),
    ).toBe(6000000);
  });

  test("menurun atas sisa pokok", () => {
    expect(
      previewInterest(
        values({ interestMode: "DECLINING", interestPercent: "5" }),
      ),
    ).toBe(3250000);
  });

  test("isian yang belum lengkap tidak menebak angka", () => {
    expect(
      previewInterest(
        values({
          interestMode: "FLAT_TOTAL",
          interestPercent: "",
          principal: "",
        }),
      ),
    ).toBe(0);
  });
});

describe("toPinjamanPayload", () => {
  // Persen tanpa dasar ditolak server. Membiarkannya terisi saat dasarnya
  // NONE adalah cara paling mudah mengirim bentuk yang ditolak itu.
  test("persen dikosongkan bersama dasarnya", () => {
    const payload = toPinjamanPayload(
      values({ interestMode: "NONE", interestPercent: "5" }),
    );

    expect(payload.interestPercent).toBeNull();
  });

  test("jemaat kosong dikirim null, bukan nol", () => {
    expect(toPinjamanPayload(values()).jemaatId).toBeNull();
  });

  test("catatan kosong dikirim null", () => {
    expect(toPinjamanPayload(values({ notes: "   " })).notes).toBeNull();
  });

  test("angka dikirim sebagai angka", () => {
    const payload = toPinjamanPayload(
      values({ interestMode: "DECLINING", interestPercent: "2.5" }),
    );

    expect(payload.termMonths).toBe(12);
    expect(payload.interestPercent).toBe(2.5);
  });
});
