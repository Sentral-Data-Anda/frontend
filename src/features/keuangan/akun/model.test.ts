import { describe, expect, test } from "bun:test";

import {
  accountFormSchema,
  accountRows,
  accountServerError,
  isDeactivateOffered,
  ledgerHref,
  toAccountCode,
  toAccountForm,
  toAccountPayload,
} from "./model";
import type { Account } from "./types";

const issuesOf = (value: unknown) => {
  const parsed = accountFormSchema.safeParse(value);

  return parsed.success
    ? []
    : parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
};

const VALID = {
  code: "1-100",
  name: "Kas",
  type: "ASSET",
  parentAccountId: "",
  isActive: "true",
};

const account = (
  id: number,
  code: string,
  parentAccountId: number | null,
): Account => ({
  id,
  publicId: `acc-${id}`,
  code,
  name: `Akun ${code}`,
  type: "ASSET",
  parentAccountId,
  parent: null,
  isActive: true,
  childCount: 0,
});

describe("skema akun", () => {
  test("kode diketik jadi huruf besar, hanya huruf/angka/titik/strip, maks 20", () => {
    expect(toAccountCode("1-100")).toBe("1-100");
    expect(toAccountCode("kas besar")).toBe("KASBESAR");
    expect(toAccountCode("a/b_c.d")).toBe("ABC.D");
    expect(toAccountCode("1".repeat(25))).toHaveLength(20);
  });

  test("kode, nama, dan tipe wajib dengan batas panjang", () => {
    expect(issuesOf(VALID)).toEqual([]);
    expect(issuesOf({ ...VALID, code: "", name: "", type: "SALAH" })).toEqual([
      "code: Isi kode akun",
      "name: Isi nama akun",
      "type: Pilih tipe akun",
    ]);
    expect(issuesOf({ ...VALID, code: "1 100" })).toEqual([
      "code: Kode akun hanya boleh huruf, angka, titik, dan strip",
    ]);
    expect(issuesOf({ ...VALID, code: "1".repeat(21) })).toEqual([
      "code: Kode akun maksimal 20 karakter",
    ]);
    expect(issuesOf({ ...VALID, name: "x".repeat(101) })).toEqual([
      "name: Nama akun maksimal 100 karakter",
    ]);
  });

  test("payload: kode huruf besar, nama dirapikan, induk kosong jadi null", () => {
    expect(
      toAccountPayload({
        code: " 1-100 ",
        name: "  Kas   Kecil ",
        type: "ASSET",
        parentAccountId: "",
        isActive: "false",
      }),
    ).toEqual({
      code: "1-100",
      name: "Kas Kecil",
      type: "ASSET",
      parentAccountId: null,
      isActive: false,
    });
  });

  test("form terisi dari bacaan, induk jadi teks", () => {
    expect(
      toAccountForm({ ...account(2, "1-100", 1), isActive: false }),
    ).toEqual({
      code: "1-100",
      name: "Akun 1-100",
      type: "ASSET",
      parentAccountId: "1",
      isActive: "false",
    });
  });
});

describe("accountRows", () => {
  const ITEMS = [
    account(3, "1-110", 1),
    account(1, "1", null),
    account(5, "2-100", 4),
    account(2, "1-100", 1),
    account(4, "2", null),
  ];

  test("urut sebagai pohon dengan depth per tingkat", () => {
    expect(accountRows(ITEMS).map((row) => [row.code, row.depth])).toEqual([
      ["1", 0],
      ["1-100", 1],
      ["1-110", 1],
      ["2", 0],
      ["2-100", 1],
    ]);
  });

  test("anak tanpa induk di halaman ini naik jadi akar", () => {
    expect(
      accountRows([account(9, "1-900", 99)]).map((row) => row.depth),
    ).toEqual([0]);
  });

  test("pencarian aktif meratakan pohon: urutan server, depth nol", () => {
    expect(
      accountRows(ITEMS, true).map((row) => [row.code, row.depth]),
    ).toEqual([
      ["1-110", 0],
      ["1", 0],
      ["2-100", 0],
      ["1-100", 0],
      ["2", 0],
    ]);
  });
});

describe("pesan server", () => {
  test("kode ganda jatuh ke field kode", () => {
    expect(accountServerError("Akun Sudah Tersedia")).toEqual({
      field: "code",
      message: "Kode ini sudah dipakai akun lain",
    });
    expect(accountServerError("Akun Tidak Ditemukan")).toBeNull();
  });

  test("Nonaktifkan hanya ditawarkan untuk penolakan karena jurnal", () => {
    expect(
      isDeactivateOffered(
        "Akun Tidak Dapat Dihapus Karena Sudah Dipakai Jurnal. Nonaktifkan Saja",
      ),
    ).toBe(true);
    expect(
      isDeactivateOffered(
        "Akun Tidak Dapat Dihapus Karena Masih Memiliki Sub Akun",
      ),
    ).toBe(false);
  });
});

describe("tautan", () => {
  test("buku besar membawa kode akun", () => {
    expect(ledgerHref("1-100")).toBe(
      "/keuangan/laporan-keuangan?tab=buku-besar&code=1-100",
    );
  });
});
