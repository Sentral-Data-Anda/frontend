import { afterEach, describe, expect, test } from "bun:test";

import { OPNAME, STOCK_ITEM, STOCK_MOVEMENT, TODAY } from "../inventaris-store";
import type { MockAction } from "../kit";

import { stokOpnameMock } from "./stok-opname";

const OPNAME_SNAPSHOT = structuredClone(OPNAME);
const STOCK_SNAPSHOT = structuredClone(STOCK_ITEM);
const MOVEMENT_SNAPSHOT = structuredClone(STOCK_MOVEMENT);

afterEach(() => {
  OPNAME.splice(0, Infinity, ...structuredClone(OPNAME_SNAPSHOT));
  STOCK_ITEM.splice(0, Infinity, ...structuredClone(STOCK_SNAPSHOT));
  STOCK_MOVEMENT.splice(0, Infinity, ...structuredClone(MOVEMENT_SNAPSHOT));
  delete process.env.MOCK_OPNAME_ACTION_500;
});

type Body = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  data: Record<string, unknown> & Record<string, unknown>[];
};

const onCall = async (
  input: string,
  init: { method?: string; body?: unknown } = {},
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(input, "http://mock.test");
  const method = init.method ?? "GET";
  const response = (await stokOpnameMock({
    request: new Request(url, {
      method,
      body: init.body ? JSON.stringify(init.body) : undefined,
    }),
    url,
    path: url.pathname,
    method,
    can,
    isAdmin: false,
    sessionCode: "test",
  })) as Response;

  return { status: response.status, body: (await response.json()) as Body };
};

const idOf = (name: string) =>
  STOCK_ITEM.find((row) => row.name === name)?.id ?? 0;

const AULA = 2;

describe("daftar dan detail", () => {
  test("daftar tanpa items, urut tanggal turun, filter status/ruang/kode", async () => {
    const all = await onCall("/stok-opname?limit=100");

    expect(all.body.data[0].code).toBe("OPN-2026-0005");
    expect("items" in all.body.data[0]).toBe(false);
    expect(all.body.data[0].itemCount).toBe(3);

    const drafts = await onCall(`/stok-opname?status=DRAFT&roomId=${AULA}`);

    expect(drafts.body.data.map((row) => row.code)).toEqual(["OPN-2026-0005"]);

    const none = await onCall("/stok-opname?filter=zzz");

    expect(none.status).toBe(404);
    expect(none.body.error).toBe("Stok Opname Tidak Ditemukan");
  });

  test("detail tanpa peka huruf besar; tanpa VIEW 403", async () => {
    const detail = await onCall("/stok-opname/opn-2026-0004");

    expect(detail.body.data.isCompletedByViewer).toBe(true);
    expect(
      (await onCall("/stok-opname/OPN-2026-0004", {}, () => false)).status,
    ).toBe(403);
  });
});

describe("simpan", () => {
  test("zod: tanggal masa depan, baris kosong, fisik negatif", async () => {
    const future = await onCall("/stok-opname", {
      method: "POST",
      body: { opnameDate: "2999-01-01", items: [] },
    });

    expect(future.status).toBe(400);
    expect(future.body.issues).toEqual([
      {
        path: "opnameDate",
        message: "Tanggal Opname Tidak Boleh Di Masa Depan",
      },
      { path: "items", message: "Stok Opname harus memiliki minimal 1 barang" },
    ]);

    const negative = await onCall("/stok-opname", {
      method: "POST",
      body: {
        opnameDate: TODAY,
        items: [{ stockItemId: 1, physicalQuantity: -1 }],
      },
    });

    expect(negative.body.issues?.[0]).toEqual({
      path: "items.0.physicalQuantity",
      message: "Jumlah Fisik tidak boleh negatif",
    });
  });

  test("baris ganda dan barang ruang lain ditolak per baris", async () => {
    const twice = await onCall("/stok-opname", {
      method: "POST",
      body: {
        opnameDate: TODAY,
        roomId: AULA,
        items: [
          { stockItemId: idOf("Tisu"), physicalQuantity: 1 },
          { stockItemId: idOf("Tisu"), physicalQuantity: 2 },
        ],
      },
    });

    expect(twice.body.issues).toEqual([
      { path: "items.1.stockItemId", message: "Barang Sudah Ada Di Baris 1" },
    ]);

    const elsewhere = await onCall("/stok-opname", {
      method: "POST",
      body: {
        opnameDate: TODAY,
        roomId: AULA,
        items: [{ stockItemId: idOf("Lilin Altar"), physicalQuantity: 1 }],
      },
    });

    expect(elsewhere.body.issues?.[0].message).toBe(
      "Barang Tidak Berada Di Ruang Ini",
    );
  });

  test("tambah: stok buku difoto, kode tahunan, status Draf", async () => {
    const created = await onCall("/stok-opname", {
      method: "POST",
      body: {
        opnameDate: TODAY,
        roomId: null,
        items: [
          { stockItemId: idOf("Tisu"), physicalQuantity: 28, note: "Basah" },
        ],
      },
    });
    const [line] = created.body.data.items as unknown as Record<
      string,
      number
    >[];

    expect(created.status).toBe(201);
    expect(created.body.data.status).toBe("DRAFT");
    expect(String(created.body.data.code)).toMatch(/^OPN-\d{4}-\d{4}$/);
    expect(line.systemQuantity).toBe(30);
    expect(line.difference).toBe(-2);
  });

  test("ubah bukan Draf ditolak", async () => {
    const posted = await onCall("/stok-opname/OPN-2026-0001", {
      method: "PUT",
      body: {
        opnameDate: TODAY,
        items: [{ stockItemId: idOf("Tisu"), physicalQuantity: 1 }],
      },
    });

    expect(posted.body.error).toBe(
      "Hanya Stok Opname Berstatus Draft Yang Dapat Diubah",
    );
  });
});

describe("aksi", () => {
  test("selesai menolak baris selisih tanpa catatan", async () => {
    const result = await onCall("/stok-opname/OPN-2026-0005/selesai", {
      method: "PUT",
    });

    expect(result.status).toBe(400);
    expect(result.body.issues).toEqual([
      { path: "items.1.note", message: "Tulis Alasan Selisih" },
    ]);
  });

  test("posting 409 bila ada mutasi sesudah tanggal opname", async () => {
    const result = await onCall("/stok-opname/OPN-2026-0003/posting", {
      method: "PUT",
    });

    expect(result.status).toBe(409);
    expect(result.body.error).toBe(
      "Ada Mutasi Kertas HVS A4 Sesudah Tanggal Opname. Ulangi Stok Opname",
    );
  });

  test("posting menulis satu koreksi per barang selisih", async () => {
    const before = STOCK_MOVEMENT.length;
    const result = await onCall("/stok-opname/OPN-2026-0004/posting", {
      method: "PUT",
    });
    const lilin = STOCK_ITEM.find((row) => row.name === "Lilin Altar");

    expect(result.body.data.status).toBe("POSTED");
    expect(STOCK_MOVEMENT.length).toBe(before + 1);
    expect(STOCK_MOVEMENT.at(-1)).toMatchObject({
      type: "ADJUSTMENT",
      source: "STOCK_OPNAME",
      quantity: -2,
      note: "Stok opname OPN-2026-0004",
    });
    expect(lilin?.quantity).toBe(46);
  });

  test("batal: guard DELETE, sudah diposting ditolak", async () => {
    const noDelete = await onCall(
      "/stok-opname/OPN-2026-0005/batal",
      { method: "PUT" },
      (_slug, action) => action !== "DELETE",
    );

    expect(noDelete.status).toBe(403);

    const posted = await onCall("/stok-opname/OPN-2026-0001/batal", {
      method: "PUT",
    });

    expect(posted.body.error).toBe(
      "Stok Opname Ini Sudah Diposting Dan Tidak Dapat Dibatalkan",
    );

    const draft = await onCall("/stok-opname/OPN-2026-0005/batal", {
      method: "PUT",
    });

    expect(draft.body.data.status).toBe("CANCELLED");
  });

  test("MOCK_OPNAME_ACTION_500", async () => {
    process.env.MOCK_OPNAME_ACTION_500 = "1";

    expect(
      (await onCall("/stok-opname/OPN-2026-0005/selesai", { method: "PUT" }))
        .status,
    ).toBe(500);
  });
});
