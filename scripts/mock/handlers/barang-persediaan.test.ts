import { afterEach, describe, expect, test } from "bun:test";

import { ROOM } from "../fasilitas-store";
import { STOCK_ITEM, STOCK_MOVEMENT } from "../inventaris-store";
import type { MockAction } from "../kit";

import { barangPersediaanMock } from "./barang-persediaan";
import { mutasiStokMock } from "./mutasi-stok";

type Json = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  totalData?: number;
  data?: unknown;
};

type View = {
  code: string;
  name: string;
  quantity: number;
  description: string;
  lastUnitPrice: string | null;
};

const ITEMS = STOCK_ITEM.map((row) => ({ ...row }));
const MOVEMENTS = STOCK_MOVEMENT.map((row) => ({ ...row }));
const ROOMS = ROOM.map((row) => ({ ...row }));

afterEach(() => {
  STOCK_ITEM.splice(0, STOCK_ITEM.length, ...ITEMS.map((row) => ({ ...row })));
  STOCK_MOVEMENT.splice(
    0,
    STOCK_MOVEMENT.length,
    ...MOVEMENTS.map((row) => ({ ...row })),
  );
  ROOM.splice(0, ROOM.length, ...ROOMS.map((row) => ({ ...row })));
});

const onCall = async (
  method: string,
  input: string,
  body?: unknown,
  can: (slug: string, action: MockAction) => boolean = () => true,
  handler = barangPersediaanMock,
) => {
  const url = new URL(`/api/v1${input}`, "http://mock.test");
  const request = new Request(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const response = (await handler({
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

const VALID = {
  name: "Lilin Paskah",
  typeId: 6,
  bapelId: 1,
  roomId: 1,
  unitId: 1,
  reorderPoint: null,
};

describe("daftar", () => {
  test("urut nama; menipis=ya hanya stok ≤ batas; tanpa izin 403", async () => {
    const all = await onCall("GET", "/barang-persediaan?limit=100");
    const names = (all.body.data as View[]).map((row) => row.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "id")));
    expect(all.body.totalData).toBe(10);
    expect(
      (all.body.data as View[]).find((row) => row.name === "Kidung Jemaat")
        ?.lastUnitPrice,
    ).toBe("85000");

    const low = await onCall("GET", "/barang-persediaan?menipis=ya");
    expect((low.body.data as View[]).map((row) => row.name)).toEqual([
      "Roti Perjamuan",
      "Tinta Printer",
    ]);

    const denied = await onCall(
      "GET",
      "/barang-persediaan",
      undefined,
      () => false,
    );
    expect(denied.status).toBe(403);
  });

  test("cari tanpa hasil → 404 Barang Persediaan Tidak Ditemukan", async () => {
    const empty = await onCall("GET", "/barang-persediaan?filter=zzz");
    expect(empty).toEqual({
      status: 404,
      body: { status: 404, error: "Barang Persediaan Tidak Ditemukan" },
    });
  });
});

describe("tulis", () => {
  test('tambah dengan stok awal menulis mutasi Stok awal; keterangan kosong = ""', async () => {
    const created = await onCall("POST", "/barang-persediaan", {
      ...VALID,
      openingQuantity: 25,
    });
    const view = created.body.data as View;
    expect(created.status).toBe(201);
    expect(view).toMatchObject({ quantity: 25, description: "" });

    const history = await onCall(
      "GET",
      `/mutasi-stok?stockItemId=${STOCK_ITEM.at(-1)?.id}`,
      undefined,
      () => true,
      mutasiStokMock,
    );
    expect(history.body.data).toMatchObject([
      { type: "IN", source: "OPENING_BALANCE", quantity: 25, balanceAfter: 25 },
    ]);
  });

  test("urutan galat: zod → 409 nama → 404 relasi → ruang nonaktif", async () => {
    const invalid = await onCall("POST", "/barang-persediaan", {
      name: " ",
      openingQuantity: -1,
    });
    expect(invalid.status).toBe(400);
    expect(invalid.body.issues?.map((issue) => issue.path)).toEqual([
      "name",
      "typeId",
      "bapelId",
      "roomId",
      "unitId",
      "openingQuantity",
    ]);

    const taken = await onCall("POST", "/barang-persediaan", {
      ...VALID,
      name: "lilin altar",
      typeId: 999,
    });
    expect(taken.status).toBe(409);
    expect(taken.body.issues).toEqual([
      { path: "name", message: "Barang Persediaan Sudah Tersedia" },
    ]);

    const missing = await onCall("POST", "/barang-persediaan", {
      ...VALID,
      typeId: 999,
      unitId: 999,
    });
    expect(missing.status).toBe(404);
    expect(missing.body.issues?.map((issue) => issue.path)).toEqual([
      "typeId",
      "unitId",
    ]);

    const room = ROOM.find((row) => row.id === 3);
    if (room) room.isActive = false;
    const inactive = await onCall("POST", "/barang-persediaan", {
      ...VALID,
      roomId: 3,
    });
    expect(inactive.body.issues).toEqual([
      { path: "roomId", message: "Ruang Tidak Aktif" },
    ]);
  });

  test("ubah: :code tanpa peka huruf besar, stok tetap, openingQuantity diabaikan", async () => {
    const updated = await onCall("PUT", "/barang-persediaan/brp-0001", {
      ...VALID,
      name: "Lilin Altar",
      openingQuantity: 99,
      reorderPoint: 10,
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data).toMatchObject({ quantity: 48, reorderPoint: 10 });
  });

  test("hapus: stok ≠ 0 ditolak; stok 0 lolos", async () => {
    const refused = await onCall("DELETE", "/barang-persediaan/BRP-0001");
    expect(refused).toEqual({
      status: 400,
      body: {
        status: 400,
        error:
          "Barang Ini Masih Memiliki Stok 48. Keluarkan Stoknya Terlebih Dahulu",
      },
    });

    const removed = await onCall("DELETE", "/barang-persediaan/BRP-0010");
    expect(removed.status).toBe(200);
    expect((await onCall("GET", "/barang-persediaan/BRP-0010")).status).toBe(
      404,
    );
  });
});
