import { describe, expect, test } from "bun:test";

import {
  accountText,
  serverFieldError,
  tipeBarangFormSchema,
  toTipeBarangForm,
  toTipeBarangPayload,
} from "./model";

const issuesOf = (name: string) => {
  // Keempat picker akun ikut dikirim: skema ini menggambarkan NILAI FORM, dan
  // form selalu punya keempatnya. Tanpa ini setiap kasus di bawah membawa
  // empat issue tambahan yang tidak ada hubungannya dengan nama.
  const parsed = tipeBarangFormSchema.safeParse({
    name,
    assetAccountId: "",
    depreciationExpenseAccountId: "",
    accumulatedDepreciationAccountId: "",
    inventoryExpenseAccountId: "",
  });

  return parsed.success
    ? []
    : parsed.error.issues.map(
        (issue) => `${issue.path.join(".")}: ${issue.message}`,
      );
};

describe("tipeBarangFormSchema", () => {
  test("nama 2–50 karakter lolos", () => {
    expect(issuesOf("TV")).toEqual([]);
    expect(issuesOf("ATK")).toEqual([]);
    expect(issuesOf("x".repeat(50))).toEqual([]);
  });

  test("kosong, spasi, atau satu huruf ditolak dengan pesan yang sama", () => {
    for (const name of ["", "    ", "a", "  b  "]) {
      expect(issuesOf(name)).toEqual([
        "name: Isi nama tipe, minimal 2 karakter",
      ]);
    }
  });

  test("batas dihitung sesudah normalisasi", () => {
    expect(issuesOf("x".repeat(51))).toEqual([
      "name: Nama tipe maksimal 50 karakter",
    ]);
    expect(issuesOf(`${"x".repeat(25)}   ${"y".repeat(24)}`)).toEqual([]);
  });
});

const NO_ACCOUNTS = {
  assetAccountId: "",
  depreciationExpenseAccountId: "",
  accumulatedDepreciationAccountId: "",
  inventoryExpenseAccountId: "",
};

describe("form ↔ payload", () => {
  test("spasi nama dirapikan, hurufnya tidak diubah", () => {
    expect(
      toTipeBarangPayload({ name: "  tv   led ", ...NO_ACCOUNTS }).name,
    ).toBe("tv led");
    expect(toTipeBarangPayload({ name: "ATK", ...NO_ACCOUNTS }).name).toBe(
      "ATK",
    );
    expect(
      tipeBarangFormSchema.parse({ name: " alat  musik ", ...NO_ACCOUNTS })
        .name,
    ).toBe("alat musik");
  });

  /**
   * Picker kosong dikirim sebagai NULL, bukan dihilangkan dari payload.
   * Server membedakan null (kosongkan akunnya) dari field yang tidak dikirim
   * (biarkan apa adanya) -- dihilangkan, picker yang dikosongkan tidak akan
   * pernah benar-benar terkosongkan.
   */
  test("picker kosong jadi null, bukan field yang hilang", () => {
    expect(toTipeBarangPayload({ name: "ATK", ...NO_ACCOUNTS })).toEqual({
      name: "ATK",
      assetAccountId: null,
      depreciationExpenseAccountId: null,
      accumulatedDepreciationAccountId: null,
      inventoryExpenseAccountId: null,
    });
  });

  test("picker terisi jadi angka", () => {
    expect(
      toTipeBarangPayload({
        name: "Kendaraan",
        assetAccountId: "11",
        depreciationExpenseAccountId: "61",
        accumulatedDepreciationAccountId: "21",
        inventoryExpenseAccountId: "29",
      }),
    ).toEqual({
      name: "Kendaraan",
      assetAccountId: 11,
      depreciationExpenseAccountId: 61,
      accumulatedDepreciationAccountId: 21,
      inventoryExpenseAccountId: 29,
    });
  });

  test("detail be-sada jadi nilai form, akun sebagai id string", () => {
    expect(
      toTipeBarangForm({
        publicId: "p-1",
        code: "TYP_ITM-0001",
        name: "Elektronik",
        assetAccount: { id: 11, code: "1-200", name: "Peralatan" },
        depreciationExpenseAccount: null,
        accumulatedDepreciationAccount: {
          id: 21,
          code: "1-290",
          name: "Akumulasi Penyusutan",
        },
        inventoryExpenseAccount: null,
      }),
    ).toEqual({
      name: "Elektronik",
      assetAccountId: "11",
      depreciationExpenseAccountId: "",
      accumulatedDepreciationAccountId: "21",
      inventoryExpenseAccountId: "",
    });
  });
});

describe("accountText", () => {
  test("kode dan nama, bukan id mentah", () => {
    expect(accountText({ code: "5-200", name: "Beban Penyusutan" })).toBe(
      "5-200 — Beban Penyusutan",
    );
  });

  test("akun yang belum diatur dikatakan apa adanya", () => {
    expect(accountText(null)).toBe("Belum diatur");
  });
});

describe("serverFieldError", () => {
  test("nama ganda dipetakan ke field nama lewat teks", () => {
    expect(serverFieldError("Tipe Barang Sudah Tersedia")).toEqual({
      field: "name",
      message: "Tipe dengan nama ini sudah ada. Pakai nama lain.",
    });
  });

  test("pesan hapus ditolak tidak dipetakan (jatuh ke galat form)", () => {
    expect(
      serverFieldError(
        "Tipe Barang Tidak Dapat Dihapus Karena Terhubung dengan Data Barang",
      ),
    ).toBeNull();
  });
});
