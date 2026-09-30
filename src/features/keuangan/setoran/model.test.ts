import { readdirSync } from "node:fs";

import { describe, expect, test } from "bun:test";

import { FetchError } from "@/lib/api/fetcher";
import { todayJakarta } from "@/lib/date";

import {
  MONTH_ALL,
  STATUS_TABS,
  emptyTransferForm,
  fixLinkOf,
  isMonthNarrowed,
  monthFilterOptions,
  pickAccountId,
  toTransferApiFilters,
  toTransferPayload,
  transferFormSchema,
  transferPathOf,
} from "./model";
import type { TransferAccountOption } from "./types";

const account = (
  id: number,
  code: string,
  name: string,
): TransferAccountOption => ({ id, code, name, type: "ASSET", isActive: true });

const ROWS = [
  account(2, "1-100", "Kas"),
  account(3, "1-110", "Kas Kecil"),
  account(4, "1-200", "Bank BCA"),
];

const issuesOf = (values: Record<string, string>) => {
  const parsed = transferFormSchema.safeParse(values);

  return parsed.success
    ? []
    : parsed.error.issues.map((issue) => issue.path.join("."));
};

const VALID = {
  transferDate: todayJakarta(),
  fromAccountId: "2",
  toAccountId: "4",
  amount: "6420000",
  reference: " SLIP-0098 ",
  description: "  Setoran   kolekte  ",
};

describe("arah setoran", () => {
  test("dirender sebagai panah, bukan kata arah", () => {
    const path = transferPathOf({
      fromAccount: ROWS[0],
      toAccount: ROWS[2],
    });

    expect(path).toBe("Kas → Bank BCA");
    expect(path).not.toMatch(/setoran|penarikan|masuk|keluar/i);
  });
});

describe("aturan form", () => {
  test("kedua akun sama ditolak di toAccountId", () => {
    expect(issuesOf({ ...VALID, toAccountId: "2" })).toEqual(["toAccountId"]);
  });

  test("tanggal masa depan, jumlah nol, dan keterangan kosong ditolak", () => {
    expect(
      issuesOf({
        ...VALID,
        transferDate: "2999-01-01",
        amount: "0",
        description: "   ",
      }),
    ).toEqual(["transferDate", "amount", "description"]);
  });

  test("bawaan: tanggal hari ini, tanpa akun terpilih", () => {
    expect(emptyTransferForm()).toEqual({
      transferDate: todayJakarta(),
      fromAccountId: "",
      toAccountId: "",
      amount: "",
      reference: "",
      description: "",
    });
  });
});

describe("payload", () => {
  test("bapelId selalu null dan tanpa field jenis apa pun", () => {
    const payload = toTransferPayload(VALID);

    expect(payload.bapelId).toBeNull();
    expect(Object.keys(payload).sort()).toEqual([
      "amount",
      "bapelId",
      "description",
      "fromAccountId",
      "reference",
      "toAccountId",
      "transferDate",
    ]);
  });

  test("nama dirapikan, referensi kosong menjadi null", () => {
    expect(toTransferPayload(VALID).description).toBe("Setoran kolekte");
    expect(
      toTransferPayload({ ...VALID, reference: "  " }).reference,
    ).toBeNull();
  });
});

describe("pintasan", () => {
  test("cocok persis pada kode maupun nama, tanpa peduli strip", () => {
    expect(pickAccountId(ROWS, "kas")).toBe("2");
    expect(pickAccountId(ROWS, "kas-kecil")).toBe("3");
    expect(pickAccountId(ROWS, "1-200")).toBe("4");
  });

  test("tidak ketemu menghasilkan kosong, bukan tebakan", () => {
    expect(pickAccountId(ROWS, "bank")).toBe("");
    expect(pickAccountId(ROWS, "")).toBe("");
    expect(pickAccountId([], "kas")).toBe("");
  });
});

describe("saringan daftar", () => {
  test("bawaan bulan berjalan, 'semua' melepas rentang", () => {
    const month = todayJakarta().slice(0, 7);

    expect(toTransferApiFilters({}).startDate).toBe(`${month}-01`);
    expect(toTransferApiFilters({ bulan: MONTH_ALL })).toEqual({
      startDate: "",
      endDate: "",
    });
    expect(isMonthNarrowed({ bulan: MONTH_ALL })).toBe(false);
    expect(isMonthNarrowed({})).toBe(true);
  });

  test("pilihan bulan menawarkan bulan ini dan semua bulan", () => {
    const options = monthFilterOptions();

    expect(options[0]).toEqual({ value: "", label: "Bulan ini" });
    expect(options[1]).toEqual({ value: MONTH_ALL, label: "Semua bulan" });
  });

  test("tab status tanpa APPROVED: status itu tidak pernah ditulis", () => {
    expect(STATUS_TABS.map((tab) => tab.value)).toEqual([
      "",
      "DRAFT",
      "PAID",
      "CANCELLED",
    ]);
  });
});

describe("tautan perbaikan", () => {
  test("dipilih dari code, bukan dari teks galat", () => {
    const period = new FetchError(400, "Bulan apa pun", [], "PERIOD_CLOSED");
    const inactive = new FetchError(400, "Apa pun", [], "ACCOUNT_INACTIVE");

    expect(fixLinkOf(period)?.href).toBe("/keuangan/periode-fiskal");
    expect(fixLinkOf(inactive)?.href).toBe("/keuangan/akun");
    expect(fixLinkOf(new FetchError(400, "Periode Sudah Ditutup"))).toBeNull();
  });
});

describe("rute", () => {
  test("tanpa /ubah: setoran dikoreksi lewat batal lalu catat ulang", () => {
    const entries = readdirSync("src/app/(app)/keuangan/setoran/[code]");

    expect(entries).not.toContain("ubah");
  });
});
