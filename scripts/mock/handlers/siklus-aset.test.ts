import { afterEach, describe, expect, test } from "bun:test";

import { addDays, todayJakarta } from "../../../src/lib/date";
import {
  ASSET,
  DISPOSAL,
  MAINTENANCE,
  TRANSFER,
  assetDdl,
  assetStatusOf,
} from "../inventaris-store";
import type { MockAction } from "../kit";

import { siklusAsetMock } from "./siklus-aset";

const SNAPSHOT = structuredClone({ ASSET, DISPOSAL, MAINTENANCE, TRANSFER });
const TODAY = todayJakarta();

afterEach(() => {
  ASSET.splice(0, Infinity, ...structuredClone(SNAPSHOT.ASSET));
  DISPOSAL.splice(0, Infinity, ...structuredClone(SNAPSHOT.DISPOSAL));
  MAINTENANCE.splice(0, Infinity, ...structuredClone(SNAPSHOT.MAINTENANCE));
  TRANSFER.splice(0, Infinity, ...structuredClone(SNAPSHOT.TRANSFER));
  delete process.env.MOCK_DISPOSAL_NO_WORKFLOW;
  delete process.env.MOCK_ASSET_HISTORY_500;
});

type Row = {
  code: string;
  status: string;
  asset: { name: string };
  toRoom: { name: string };
  approval: { status: string } | null;
};

type Body = {
  status: number;
  error?: string;
  message?: string;
  issues?: { path: string; message: string }[];
  totalData?: number;
  data: Row & Row[];
};

const onCall = async (
  input: string,
  init: { method?: string; body?: unknown } = {},
  can: (slug: string, action: MockAction) => boolean = () => true,
) => {
  const url = new URL(input, "http://mock.test");
  const method = init.method ?? "GET";
  const response = (await siklusAsetMock({
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

const assetId = (name: string) =>
  ASSET.find((row) => row.name === name)?.id ?? 0;

describe("daftar dan baca", () => {
  test("filter status, cara, cari; kosong 404; ?assetId= dijawab", async () => {
    const done = await onCall("/siklus-aset/perawatan?status=DONE&limit=100");
    expect(done.body.data.every((row) => row.status === "DONE")).toBe(true);

    const sold = await onCall("/siklus-aset/pelepasan?method=SOLD");
    expect(sold.body.data.map((row) => row.asset.name)).toEqual([
      "Piano Yamaha U1",
    ]);

    const found = await onCall("/siklus-aset/mutasi?filter=lemari");
    expect(found.body.totalData).toBe(1);

    expect((await onCall("/siklus-aset/pelepasan?filter=zzz")).status).toBe(
      404,
    );

    const history = await onCall(
      `/siklus-aset/pelepasan?assetId=${assetId("Printer Canon G2010")}`,
    );
    expect(history.body.data[0].status).toBe("PENDING");

    process.env.MOCK_ASSET_HISTORY_500 = "1";
    expect(
      (
        await onCall(
          `/siklus-aset/perawatan?assetId=${assetId("AC Daikin 2 PK")}`,
        )
      ).status,
    ).toBe(500);
  });

  test("baca per kode tanpa peka huruf besar; tidak ada 404; tanpa VIEW 403", async () => {
    const code = MAINTENANCE[0].code.toLowerCase();

    expect((await onCall(`/siklus-aset/perawatan/${code}`)).status).toBe(200);
    expect((await onCall("/siklus-aset/mutasi/SKA-1999-0001")).body.error).toBe(
      "Mutasi Barang Tidak Ditemukan",
    );
    expect(
      (await onCall("/siklus-aset/perawatan", {}, () => false)).status,
    ).toBe(403);
  });
});

describe("perawatan", () => {
  test("Selesai tanpa tanggal selesai → 400 completedDate; lalu tambah, ubah, hapus", async () => {
    const body = {
      assetId: assetId("Genset Honda 5000 W"),
      status: "DONE",
      scheduledDate: TODAY,
      description: "Ganti oli",
    };
    const missing = await onCall("/siklus-aset/perawatan", {
      method: "POST",
      body,
    });

    expect(missing.status).toBe(400);
    expect(missing.body.issues?.[0]).toEqual({
      path: "completedDate",
      message: "Tanggal Selesai Wajib Diisi Untuk Perawatan Selesai",
    });

    const created = await onCall("/siklus-aset/perawatan", {
      method: "POST",
      body: { ...body, completedDate: TODAY },
    });
    expect(created.status).toBe(201);

    const { code } = created.body.data;
    const updated = await onCall(`/siklus-aset/perawatan/${code}`, {
      method: "PUT",
      body: { ...body, status: "CANCELLED" },
    });
    expect(updated.body.data.status).toBe("CANCELLED");

    expect(
      (await onCall(`/siklus-aset/perawatan/${code}`, { method: "DELETE" }))
        .body.message,
    ).toBe("Berhasil Menghapus Perawatan Barang");
    expect((await onCall(`/siklus-aset/perawatan/${code}`)).status).toBe(404);
  });

  test("barang dilepas 400 assetId; supplier tidak ada 404 supplierId", async () => {
    const base = { scheduledDate: TODAY, description: "Stem" };

    expect(
      (
        await onCall("/siklus-aset/perawatan", {
          method: "POST",
          body: { ...base, assetId: assetId("Piano Yamaha U1") },
        })
      ).body.issues?.[0].path,
    ).toBe("assetId");
    expect(
      (
        await onCall("/siklus-aset/perawatan", {
          method: "POST",
          body: { ...base, assetId: assetId("AC Daikin 2 PK"), supplierId: 99 },
        })
      ).body.issues?.[0],
    ).toEqual({ path: "supplierId", message: "Supplier Tidak Ditemukan" });
  });
});

describe("pindah lokasi", () => {
  const onMove = (body: Record<string, unknown>) =>
    onCall("/siklus-aset/mutasi", {
      method: "POST",
      body: { transferDate: TODAY, ...body },
    });

  test("lokasi sama, ruang nonaktif, masa depan, barang menunggu ditolak per field", async () => {
    const kamera = assetId("Kamera Canon EOS M50");

    expect(
      (await onMove({ assetId: kamera, toRoomId: 1, toBapelId: 2 })).body
        .issues?.[0],
    ).toEqual({
      path: "toRoomId",
      message: "Barang Ini Sudah Berada Di Ruangan Dan Komisi Tersebut",
    });
    expect(
      (await onMove({ assetId: kamera, toRoomId: 5, toBapelId: 2 })).body
        .issues?.[0],
    ).toEqual({ path: "toRoomId", message: "Ruang Tidak Aktif" });
    expect(
      (
        await onMove({
          assetId: kamera,
          toRoomId: 2,
          toBapelId: 2,
          transferDate: addDays(TODAY, 1),
        })
      ).body.issues?.[0].message,
    ).toBe("Tanggal Pindah Tidak Boleh Di Masa Depan");
    expect(
      (
        await onMove({
          assetId: assetId("Printer Canon G2010"),
          toRoomId: 1,
          toBapelId: 1,
        })
      ).body.issues?.[0].message,
    ).toBe("Barang Sedang Menunggu Persetujuan Pelepasan");
  });

  test("berhasil: catatan baru dan lokasi barang berubah", async () => {
    const kamera = assetId("Kamera Canon EOS M50");
    const moved = await onMove({ assetId: kamera, toRoomId: 2, toBapelId: 2 });

    expect(moved.status).toBe(201);
    expect(moved.body.data.toRoom.name).toBe("Aula Serbaguna");
    expect(ASSET.find((row) => row.id === kamera)?.roomId).toBe(2);
  });
});

describe("pelepasan", () => {
  const kamera = () => assetId("Kamera Canon EOS M50");

  test("Dijual tanpa hasil 400 proceeds; tanpa alur 400; tanpa DELETE 403", async () => {
    const body = {
      assetId: kamera(),
      method: "SOLD",
      disposalDate: TODAY,
      reason: "Diganti kamera baru",
    };

    expect(
      (await onCall("/siklus-aset/pelepasan", { method: "POST", body })).body
        .issues?.[0],
    ).toEqual({ path: "proceeds", message: "Mohon Lengkapi Hasil Penjualan" });

    process.env.MOCK_DISPOSAL_NO_WORKFLOW = "1";
    const noFlow = await onCall("/siklus-aset/pelepasan", {
      method: "POST",
      body: { ...body, proceeds: 1_000_000 },
    });
    expect(noFlow.status).toBe(400);
    expect(noFlow.body.issues).toBeUndefined();

    expect(
      (
        await onCall(
          "/siklus-aset/pelepasan",
          { method: "POST", body },
          (_slug, action) => action !== "DELETE",
        )
      ).status,
    ).toBe(403);
  });

  test("ajukan → Menunggu, barang hilang dari ddl; tarik → Ditarik, barang aktif lagi", async () => {
    const submitted = await onCall("/siklus-aset/pelepasan", {
      method: "POST",
      body: {
        assetId: kamera(),
        method: "SOLD",
        disposalDate: TODAY,
        reason: "Diganti kamera baru",
        proceeds: 1_000_000,
      },
    });

    expect(submitted.status).toBe(201);
    expect(submitted.body.data.status).toBe("PENDING");
    expect(submitted.body.data.approval?.status).toBe("PENDING");
    expect(assetDdl({ filter: "kamera", limit: null })).toEqual([]);

    const { code } = submitted.body.data;
    const withdrawn = await onCall(`/siklus-aset/pelepasan/${code}/tarik`, {
      method: "PUT",
    });

    expect(withdrawn.body.data.status).toBe("CANCELLED");
    expect(assetStatusOf(kamera())).toBe("AKTIF");
    expect(
      (await onCall(`/siklus-aset/pelepasan/${code}/tarik`, { method: "PUT" }))
        .body.error,
    ).toBe("Permintaan Persetujuan Ini Sudah Selesai");
  });

  test("tarik pengajuan orang lain 403", async () => {
    const printer = DISPOSAL.find((row) => row.status === "PENDING");
    const response = await onCall(
      `/siklus-aset/pelepasan/${printer?.code}/tarik`,
      { method: "PUT" },
    );

    expect(response.status).toBe(403);
    expect(response.body.error).toBe(
      "Hanya Pengaju Yang Dapat Menarik Permintaan Ini",
    );
  });
});
