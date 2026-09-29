import { describe, expect, test } from "bun:test";

import {
  accountIssueOf,
  accountLabelOf,
  offeringTypeFormSchema,
  serverFieldError,
  toOfferingTypeForm,
  toOfferingTypePayload,
} from "./model";
import type { OfferingType } from "./types";

const ROW: OfferingType = {
  id: 1,
  publicId: "tps-0001",
  code: "TPS-0001",
  name: "Kolekte",
  isActive: true,
  hasPeriod: false,
  requiresJemaat: false,
  accountId: 16,
  account: {
    id: 16,
    code: "4-100",
    name: "Persembahan Kolekte",
    type: "INCOME",
    isActive: true,
  },
};

describe("skema nama", () => {
  test("nama di bawah 4 karakter ditolak", () => {
    const parsed = offeringTypeFormSchema.safeParse({
      name: "Kas",
      accountId: "",
      hasPeriod: "false",
      requiresJemaat: "false",
      isActive: "true",
    });

    expect(parsed.success).toBe(false);
  });

  test("spasi berlebih dilebur sebelum batas panjang diuji", () => {
    const parsed = offeringTypeFormSchema.safeParse({
      name: "  Dana   Pembangunan  ",
      accountId: "19",
      hasPeriod: "false",
      requiresJemaat: "true",
      isActive: "true",
    });

    expect(parsed.success).toBe(true);
    expect(parsed.data?.name).toBe("Dana Pembangunan");
  });

  test("nama lebih dari 50 karakter ditolak", () => {
    const parsed = offeringTypeFormSchema.safeParse({
      name: "a".repeat(51),
      accountId: "",
      hasPeriod: "false",
      requiresJemaat: "false",
      isActive: "true",
    });

    expect(parsed.success).toBe(false);
  });
});

describe("payload", () => {
  test("akun kosong dikirim null, flag jadi boolean", () => {
    expect(
      toOfferingTypePayload({
        name: " Syukur ",
        accountId: "",
        hasPeriod: "true",
        requiresJemaat: "false",
        isActive: "false",
      }),
    ).toEqual({
      name: "Syukur",
      accountId: null,
      hasPeriod: true,
      requiresJemaat: false,
      isActive: false,
    });
  });

  test("bacaan kembali ke nilai form", () => {
    expect(toOfferingTypeForm(ROW)).toEqual({
      name: "Kolekte",
      accountId: "16",
      hasPeriod: "false",
      requiresJemaat: "false",
      isActive: "true",
    });
  });
});

describe("penanda akun", () => {
  test("tanpa akun: peringatan Belum ada akun", () => {
    const issue = accountIssueOf({ ...ROW, accountId: null, account: null });

    expect(issue).toEqual({ label: "Belum ada akun", variant: "warning" });
    expect(accountLabelOf({ ...ROW, account: null })).toBeNull();
  });

  test("akun dinonaktifkan sesudah ditunjuk: destruktif", () => {
    const issue = accountIssueOf({
      ...ROW,
      account: { ...ROW.account!, isActive: false },
    });

    expect(issue).toEqual({ label: "Akun nonaktif", variant: "destructive" });
  });

  test("akun bukan pendapatan: destruktif", () => {
    const issue = accountIssueOf({
      ...ROW,
      account: { ...ROW.account!, type: "ASSET" },
    });

    expect(issue).toEqual({
      label: "Bukan akun pendapatan",
      variant: "destructive",
    });
  });

  test("akun pendapatan aktif: tanpa penanda", () => {
    expect(accountIssueOf(ROW)).toBeNull();
    expect(accountLabelOf(ROW)).toBe("4-100 — Persembahan Kolekte");
  });
});

describe("galat server", () => {
  test("nama ganda dipetakan ke field nama", () => {
    expect(serverFieldError("Tipe Persembahan Sudah Tersedia")?.field).toBe(
      "name",
    );
  });

  test("galat akun dipetakan ke field akun", () => {
    expect(serverFieldError("Akun Tidak Aktif")?.field).toBe("accountId");
    expect(serverFieldError("Akun Harus Bertipe Pendapatan")?.field).toBe(
      "accountId",
    );
  });

  test("pesan lain dibiarkan jadi galat form", () => {
    expect(serverFieldError("Kesalahan server.")).toBeNull();
  });
});
