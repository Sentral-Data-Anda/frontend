import { describe, expect, test } from "bun:test";

import { toApiQuery } from "@/hooks/use-list-params";
import { addDays, todayJakarta } from "@/lib/date";

import {
  FORM_SOURCE_OPTIONS,
  emptyMovementForm,
  movementFormSchema,
  serverFieldError,
  sourceLabelOf,
  stockShortageOf,
  toMovementPayload,
  toMutasiApiFilters,
  type MovementFormValues,
} from "./model";
import type { StockOption } from "./types";

const ROTI: StockOption = {
  id: 2,
  code: "BRP-0002",
  name: "Roti Perjamuan",
  quantity: 3,
  unit: { name: "Pak" },
  room: { id: 1, name: "Gedung Gereja" },
};

const valid = (
  patch: Partial<MovementFormValues> = {},
): MovementFormValues => ({
  ...emptyMovementForm(),
  stockItemId: "2",
  quantity: "2",
  ...patch,
});

const messagesOf = (values: MovementFormValues) =>
  movementFormSchema
    .safeParse(values)
    .error?.issues.map((issue) => [issue.path[0], issue.message]);

describe("jenis → sumber", () => {
  test("Masuk: Donasi / Beli langsung; Keluar: Pemakaian / Rusak; tanpa Koreksi dan Pindah lokasi", () => {
    expect(FORM_SOURCE_OPTIONS.IN).toEqual([
      { value: "DONATION", label: "Donasi" },
      { value: "MANUAL", label: "Beli langsung" },
    ]);
    expect(FORM_SOURCE_OPTIONS.OUT.map((option) => option.value)).toEqual([
      "USAGE",
      "DISPOSAL",
    ]);
    expect(Object.keys(FORM_SOURCE_OPTIONS)).toEqual(["IN", "OUT"]);
    expect(sourceLabelOf({ type: "IN", source: "MANUAL" })).toBe(
      "Beli langsung",
    );
    expect(sourceLabelOf({ type: "OUT", source: "MANUAL" })).toBe("Lainnya");
  });
});

describe("skema", () => {
  test("bawaan Keluar · Pemakaian · hari ini WIB", () => {
    expect(emptyMovementForm()).toMatchObject({
      type: "OUT",
      source: "USAGE",
      movementDate: todayJakarta(),
    });
    expect(messagesOf(valid())).toBeUndefined();
  });

  test("barang wajib; jumlah bulat ≥ 1", () => {
    expect(messagesOf(valid({ stockItemId: "", quantity: "0" }))).toEqual([
      ["stockItemId", "Pilih barang persediaan"],
      ["quantity", "Isi jumlah, minimal 1"],
    ]);
    expect(messagesOf(valid({ quantity: "1.5" }))).toEqual([
      ["quantity", "Isi jumlah, minimal 1"],
    ]);
  });

  test("Donasi wajib catatan; Beli langsung tidak", () => {
    expect(
      messagesOf(valid({ type: "IN", source: "DONATION", note: " " })),
    ).toEqual([["note", "Tulis nama pemberi"]]);
    expect(
      messagesOf(valid({ type: "IN", source: "MANUAL", note: "" })),
    ).toBeUndefined();
  });

  test("tanggal tidak boleh di masa depan; sumber harus sesuai jenis", () => {
    expect(
      messagesOf(
        valid({ movementDate: addDays(todayJakarta(), 1), source: "MANUAL" }),
      ),
    ).toEqual([
      ["source", "Pilih alasan"],
      ["movementDate", "Tanggal mutasi tidak boleh di masa depan"],
    ]);
  });

  test("stok cukup dari baris ddl; Masuk tidak dicek", () => {
    expect(stockShortageOf(valid({ quantity: "4" }), ROTI)).toBe(
      "Stok tidak cukup. Sisa 3 Pak.",
    );
    expect(stockShortageOf(valid({ quantity: "3" }), ROTI)).toBeNull();
    expect(
      stockShortageOf(valid({ type: "IN", quantity: "40" }), ROTI),
    ).toBeNull();
    expect(stockShortageOf(valid({ quantity: "40" }), undefined)).toBeNull();
  });
});

test("payload: angka, tanggal YYYY-MM-DD, catatan kosong tidak dikirim", () => {
  expect(
    toMovementPayload(
      valid({
        type: "IN",
        source: "DONATION",
        note: "  Ibu Rina ",
        quantity: "20",
      }),
    ),
  ).toEqual({
    stockItemId: 2,
    type: "IN",
    source: "DONATION",
    quantity: 20,
    movementDate: todayJakarta(),
    note: "Ibu Rina",
  });
  expect(toMovementPayload(valid())).not.toHaveProperty("note");
});

test("galat server tanpa issues → field", () => {
  expect(
    serverFieldError(
      "Stok Tidak Mencukupi. Sisa Stok Roti Perjamuan Saat Ini 3",
    )?.field,
  ).toBe("quantity");
  expect(
    serverFieldError("Tanggal Mutasi Tidak Boleh Sebelum 12 Mei 2026")?.field,
  ).toBe("movementDate");
  expect(
    serverFieldError(
      "Sumber Mutasi Ini Ditulis Oleh Proses Lain: Stok Awal, Penerimaan Barang, Atau Stok Opname",
    ),
  ).toBeNull();
});

test("filter → toApiQuery: bulan → startDate/endDate, jenis, sumber, cari → filter", () => {
  expect(
    toApiQuery({
      page: 1,
      limit: 10,
      search: "BRP-0001",
      status: "",
      apiFilters: toMutasiApiFilters({
        bulan: "2026-02",
        jenis: "OUT",
        sumber: "USAGE",
      }),
    }),
  ).toBe(
    "page=1&limit=10&filter=BRP-0001&type=OUT&source=USAGE&startDate=2026-02-01&endDate=2026-02-28",
  );
});
