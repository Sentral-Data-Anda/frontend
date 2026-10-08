import { afterEach, describe, expect, test } from "bun:test";

import { STOCK_ITEM, STOCK_MOVEMENT, TODAY } from "../inventaris-store";
import type { MockAction } from "../kit";

import { mutasiStokMock } from "./mutasi-stok";

type Json = {
  status: number;
  error?: string;
  issues?: { path: string; message: string }[];
  totalData?: number;
  data?: unknown;
};

type Row = {
  source: string;
  movementDate: string;
  balanceAfter: number;
  stockItem: { name: string; room: { name: string } };
};

const ITEMS = STOCK_ITEM.map((row) => ({ ...row }));
const MOVEMENTS = STOCK_MOVEMENT.map((row) => ({ ...row }));

afterEach(() => {
  STOCK_ITEM.splice(0, STOCK_ITEM.length, ...ITEMS.map((row) => ({ ...row })));
  STOCK_MOVEMENT.splice(
    0,
    STOCK_MOVEMENT.length,
    ...MOVEMENTS.map((row) => ({ ...row })),
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
  const response = (await mutasiStokMock({
    request,
    url,
    path: input.split("?")[0],
    method,
    can,
    isAdmin: false,
    sessionCode: "test",
  })) as Response;

  return { status: response.status, body: (await response.json()) as Json };
};

const ROTI = 2;

const valid = (patch: Record<string, unknown> = {}) => ({
  stockItemId: ROTI,
  type: "OUT",
  source: "USAGE",
  quantity: 1,
  movementDate: TODAY,
  ...patch,
});

describe("daftar", () => {
  test("urut tanggal terbaru; sembilan sumber; baris membawa ruang", async () => {
    const all = await onCall("GET", "/mutasi-stok?limit=100");
    const rows = all.body.data as Row[];
    const dates = rows.map((row) => row.movementDate);

    expect(dates).toEqual([...dates].sort().reverse());
    expect(new Set(rows.map((row) => row.source)).size).toBe(9);
    expect(rows[0].stockItem.room.name).toBeTruthy();
  });

  test("filter kode/nama barang dan jenis", async () => {
    const rows = (
      await onCall("GET", "/mutasi-stok?limit=100&filter=roti&type=OUT")
    ).body.data as Row[];

    expect(rows.every((row) => row.stockItem.name === "Roti Perjamuan")).toBe(
      true,
    );
  });

  test("CREATE saja; tanpa izin 403", async () => {
    const denied = await onCall(
      "POST",
      "/mutasi-stok",
      valid(),
      (_, action) => action === "VIEW",
    );
    expect(denied.status).toBe(403);
  });
});

describe("tulis (urutan galat)", () => {
  test("zod: masa depan + sumber tidak sesuai jenis", async () => {
    const result = await onCall(
      "POST",
      "/mutasi-stok",
      valid({ source: "DONATION", movementDate: "2999-01-01" }),
    );

    expect(result.status).toBe(400);
    expect(result.body.issues).toEqual([
      {
        path: "movementDate",
        message: "Tanggal Mutasi Tidak Boleh Di Masa Depan",
      },
      { path: "source", message: "Sumber Tidak Sesuai Dengan Jenis Mutasi" },
      { path: "value", message: "Mohon Lengkapi Nilai Barang Sumbangan" },
    ]);
  });

  test("sumber milik proses lain → tanpa issues", async () => {
    const result = await onCall(
      "POST",
      "/mutasi-stok",
      valid({ type: "IN", source: "GOODS_RECEIPT" }),
    );

    expect(result.body).toEqual({
      status: 400,
      error:
        "Sumber Mutasi Ini Ditulis Oleh Proses Lain: Stok Awal, Penerimaan Barang, Atau Stok Opname",
    });
  });

  test("barang tidak ada → 404 stockItemId; tanggal lama → movementDate; stok kurang → quantity", async () => {
    const missing = await onCall(
      "POST",
      "/mutasi-stok",
      valid({ stockItemId: 999 }),
    );
    expect(missing.status).toBe(404);
    expect(missing.body.issues?.[0].path).toBe("stockItemId");

    const early = await onCall(
      "POST",
      "/mutasi-stok",
      valid({ movementDate: "2020-01-01" }),
    );
    expect(early.body.issues?.[0].path).toBe("movementDate");
    expect(early.body.error).toStartWith("Tanggal Mutasi Tidak Boleh Sebelum ");

    const short = await onCall("POST", "/mutasi-stok", valid({ quantity: 4 }));
    expect(short.body).toEqual({
      status: 400,
      error: "Stok Tidak Mencukupi. Sisa Stok Roti Perjamuan Saat Ini 3",
      issues: [
        {
          path: "quantity",
          message: "Stok Tidak Mencukupi. Sisa Stok Roti Perjamuan Saat Ini 3",
        },
      ],
    });
  });

  test("Masuk Donasi → 201, stok dan balanceAfter naik", async () => {
    const saved = await onCall(
      "POST",
      "/mutasi-stok",
      valid({
        type: "IN",
        source: "DONATION",
        quantity: 20,
        note: "Ibu Rina",
        value: 400_000,
      }),
    );

    expect(saved.status).toBe(201);
    expect(saved.body.data).toMatchObject({
      balanceAfter: 23,
      note: "Ibu Rina",
      // "400000", bukan "400000.00": `money` di inventaris-store membuang nol
      // di belakang. Tidak ada layar yang peduli -- `formatAmount` dan
      // `valueOf` dua-duanya mengurainya -- dan `lastUnitPrice` sudah
      // berbentuk sama sejak lama.
      value: "400000",
    });
    expect(STOCK_ITEM.find((row) => row.id === ROTI)?.quantity).toBe(23);
  });

  /**
   * Tiga aturan nilai, sama seperti server.
   *
   * Mock yang lebih longgar di sini membuat setiap layar dibangun melawan
   * aturan yang tidak ada, dan cacatnya baru muncul di produksi.
   */
  test("sumbangan tanpa nilai ditolak pada field nilainya", async () => {
    const saved = await onCall(
      "POST",
      "/mutasi-stok",
      valid({ type: "IN", source: "DONATION", quantity: 5, note: "Ibu Rina" }),
    );

    expect(saved.status).toBe(400);
    expect(saved.body.issues).toEqual([
      { path: "value", message: "Mohon Lengkapi Nilai Barang Sumbangan" },
    ]);
  });

  test("nilai pada mutasi keluar ditolak: harga rata-rata yang memutuskan", async () => {
    const saved = await onCall(
      "POST",
      "/mutasi-stok",
      valid({ type: "OUT", source: "USAGE", quantity: 1, value: 1 }),
    );

    expect(saved.status).toBe(400);
    expect(saved.body.issues).toEqual([
      {
        path: "value",
        message:
          "Nilai Hanya Diisi Untuk Mutasi Masuk. Mutasi Keluar Memakai Harga Rata-Rata",
      },
    ]);
  });

  // Harga rata-rata bergerak, bukan harga terakhir: itu satu-satunya cara
  // yang dikreditkan selalu bagian dari yang pernah didebit.
  test("mutasi masuk memindahkan harga rata-rata barangnya", async () => {
    const before = STOCK_ITEM.find((row) => row.id === ROTI);
    const quantity = before?.quantity ?? 0;

    await onCall(
      "POST",
      "/mutasi-stok",
      valid({
        type: "IN",
        source: "MANUAL",
        quantity: 10,
        value: 300_000,
        note: "Toko Sinar",
      }),
    );

    const after = STOCK_ITEM.find((row) => row.id === ROTI);
    expect(after?.quantity).toBe(quantity + 10);
    expect(after?.avgUnitPrice).not.toBeNull();
  });
});
