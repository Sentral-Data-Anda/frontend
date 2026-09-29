import { describe, expect, test } from "bun:test";

import { MENU, type MenuSlug } from "../../../src/config/menu";
import { addDays } from "../../../src/lib/date";
import {
  ASSET,
  DISPOSAL,
  RUN,
  STOCK_ITEM,
  STOCK_MOVEMENT,
  TODAY,
  TYPE_ITEM,
  UNIT,
  accumulatedOf,
  applyMovement,
  assetDdl,
  assetStatusOf,
  assetView,
  bookValueOf,
  calculateRun,
  codeOf,
  decideDisposal,
  openRun,
  postRun,
  roomHoldsInventory,
  runOpenFailure,
  stockItemDdl,
  submitDisposal,
} from "../inventaris-store";
import type { MockHandler } from "../kit";

import { inventarisMock } from "./inventaris";
import { createPermintaanPersetujuanMock } from "./permintaan-persetujuan";

const call = async (
  handler: MockHandler,
  path: string,
  grants: MenuSlug[],
  init: RequestInit = {},
) => {
  const url = new URL(path, "http://mock.test");
  const response = await handler({
    request: new Request(url, init),
    url,
    path: url.pathname,
    method: init.method ?? "GET",
    can: (slug) => grants.includes(slug),
    isAdmin: false,
    sessionCode: "test",
  });

  return response
    ? { status: response.status, body: await response.json() }
    : null;
};

const assetNamed = (name: string) => {
  const found = ASSET.find((row) => row.name === name);
  if (!found) throw new Error(name);

  return found;
};

const stockNamed = (name: string) => {
  const found = STOCK_ITEM.find((row) => row.name === name);
  if (!found) throw new Error(name);

  return found;
};

describe("kode", () => {
  test("kode baru master melanjutkan urutan seed, tidak bertabrakan", () => {
    const typeCode = codeOf("TYP_ITM");
    const unitCode = codeOf("UNT");

    expect(TYPE_ITEM.some((row) => row.code === typeCode)).toBe(false);
    expect(UNIT.some((row) => row.code === unitCode)).toBe(false);
    const serialOf = (code: string) => Number(code.slice(-4));
    const lastSerial = (rows: readonly { code: string }[]) =>
      Math.max(...rows.map((row) => serialOf(row.code)));

    expect(serialOf(typeCode)).toBeGreaterThan(lastSerial(TYPE_ITEM));
    expect(serialOf(unitCode)).toBeGreaterThan(lastSerial(UNIT));
  });
});

describe("stok", () => {
  test("stok akhir seed sesuai brief dan saldo berjalan urut tanggal", () => {
    expect(
      Object.fromEntries(
        STOCK_ITEM.filter((row) => row.deletedAt === null).map((row) => [
          row.name,
          row.quantity,
        ]),
      ),
    ).toMatchObject({
      "Lilin Altar": 48,
      "Roti Perjamuan": 3,
      "Anggur Perjamuan": 6,
      "Kertas HVS A4": 12,
      "Tinta Printer": 0,
      "Sabun Lantai": 8,
      Tisu: 30,
      "Amplop Persembahan": 15,
      "Kidung Jemaat": 120,
      "Spidol Papan Tulis": 0,
    });

    for (const item of STOCK_ITEM) {
      let balance = 0;
      for (const row of STOCK_MOVEMENT.filter(
        (one) => one.stockItemId === item.id,
      )) {
        balance =
          row.type === "OUT" ? balance - row.quantity : balance + row.quantity;
        expect(row.balanceAfter).toBe(balance);
      }
    }
  });

  test("applyMovement menolak masa depan, mundur tanggal, dan stok negatif", () => {
    const roti = stockNamed("Roti Perjamuan");
    const base = { type: "OUT", source: "USAGE", note: null } as const;

    expect(
      applyMovement(roti.id, {
        ...base,
        quantity: 1,
        movementDate: addDays(TODAY, 1),
      }),
    ).toEqual({
      failure: {
        status: 400,
        path: "movementDate",
        message: "Tanggal Mutasi Tidak Boleh Di Masa Depan",
      },
    });
    expect(
      applyMovement(roti.id, {
        ...base,
        quantity: 1,
        movementDate: addDays(TODAY, -30),
      }),
    ).toMatchObject({ failure: { path: "movementDate" } });
    expect(
      applyMovement(roti.id, { ...base, quantity: 9, movementDate: TODAY }),
    ).toMatchObject({
      failure: {
        path: "quantity",
        message: "Stok Tidak Mencukupi. Sisa Stok Roti Perjamuan Saat Ini 3",
      },
    });
  });

  test("ddl persediaan menyaring ruang; ruang berisi barang tidak bisa dihapus", () => {
    const aula = stockItemDdl({ filter: "", limit: null, roomId: 2 });

    expect(aula.every((row) => row.room?.id === 2)).toBe(true);
    expect(aula.find((row) => row.name === "Kertas HVS A4")).toMatchObject({
      quantity: 12,
      unit: { name: "Rim" },
    });
    expect([1, 2, 3, 4, 5].map(roomHoldsInventory)).toEqual([
      true,
      true,
      false,
      false,
      false,
    ]);
  });
});

describe("penyusutan", () => {
  test("dua periode diposting, satu draf; periode berikutnya menunggu posting", () => {
    expect(RUN.map((run) => run.status)).toEqual(["POSTED", "POSTED", "DRAFT"]);

    const draft = RUN[2];
    const failure = runOpenFailure(
      Number(TODAY.slice(0, 4)),
      Number(TODAY.slice(5, 7)),
    );

    expect(failure?.status).toBe(400);
    expect(failure?.message).toStartWith("Posting Penyusutan ");
    expect(failure?.message).toContain(String(draft.year));
  });

  test("tanpa draf: bulan sesudah posting terakhir boleh, bulan lebih awal = penyusutan berikutnya", () => {
    const draft = RUN[2];
    const first = RUN[0];
    const earlier =
      first.month === 1
        ? { year: first.year - 1, month: 12 }
        : { year: first.year, month: first.month - 1 };

    postRun(draft);
    const results = [
      runOpenFailure(first.year, first.month),
      runOpenFailure(Number(TODAY.slice(0, 4)), Number(TODAY.slice(5, 7))),
      runOpenFailure(earlier.year, earlier.month),
    ];
    Object.assign(draft, {
      status: "DRAFT",
      postedAt: null,
      journalCode: null,
    });

    expect(results[0]?.status).toBe(409);
    expect(results[1]).toBeNull();
    expect(results[2]).toMatchObject({ status: 400, path: "month" });
    expect(results[2]?.message).toStartWith("Penyusutan Berikutnya Adalah ");
  });

  test("barang lama habis: nilai buku = residu, tidak ada entri di draf", () => {
    const innova = assetNamed("Toyota Innova Pelayanan");

    expect(bookValueOf(innova)).toBe(50_000_000);
    expect(RUN[2].entries.some((entry) => entry.assetId === innova.id)).toBe(
      false,
    );
    expect(assetView(innova, true)).toMatchObject({
      depreciation: { bookValue: "50000000.00" },
    });
  });

  test("akumulasi hanya dari periode diposting; lepas disetujui berhenti sesudah bulannya", () => {
    const proyektor = assetNamed("Proyektor Epson EB-X51");
    const piano = assetNamed("Piano Yamaha U1");
    const printer = assetNamed("Printer Canon G2010");
    const draft = RUN[2];

    expect(accumulatedOf(proyektor)).toBe(2_000_000.04);
    expect(draft.entries.map((entry) => entry.assetId)).toEqual(
      expect.arrayContaining([piano.id, printer.id]),
    );

    const next = openRun(
      draft.month === 12 ? draft.year + 1 : draft.year,
      (draft.month % 12) + 1,
    );
    calculateRun(next);

    expect(next.entries.some((entry) => entry.assetId === piano.id)).toBe(
      false,
    );
    expect(next.entries.some((entry) => entry.assetId === printer.id)).toBe(
      true,
    );

    RUN.splice(RUN.indexOf(next), 1);
  });
});

describe("pelepasan", () => {
  test("status barang dari pelepasan terakhir; ddl barang hanya yang aktif", () => {
    expect(assetStatusOf(assetNamed("Piano Yamaha U1").id)).toBe("DILEPAS");
    expect(assetStatusOf(assetNamed("Printer Canon G2010").id)).toBe(
      "MENUNGGU_PELEPASAN",
    );
    expect(assetStatusOf(assetNamed("Sound Portable Huper").id)).toBe("AKTIF");

    const names = assetDdl({ filter: "", limit: null }).map((row) => row.name);
    expect(names).not.toContain("Piano Yamaha U1");
    expect(names).not.toContain("Printer Canon G2010");
    expect(names).toContain("Sound Portable Huper");
  });

  test("detail barang: pelepasan membawa approval, akumulasi awal kosong = 0", () => {
    const printer = assetView(assetNamed("Printer Canon G2010"), true);
    const keyboard = assetView(assetNamed("Keyboard Yamaha PSR-SX700"), true);

    expect(printer.disposal).toMatchObject({
      status: "PENDING",
      approval: { status: "PENDING" },
    });
    expect(printer.disposal?.approval?.publicId).toBeTruthy();
    expect(
      assetView(assetNamed("Printer Canon G2010")).disposal,
    ).not.toHaveProperty("approval");
    expect(keyboard.depreciation?.openingAccumulated).toBe("0.00");
  });

  test("ajukan lalu tarik: barang kembali aktif", () => {
    const kamera = assetNamed("Kamera Canon EOS M50");
    const row = submitDisposal({
      assetId: kamera.id,
      method: "SCRAPPED",
      disposalDate: TODAY,
      reason: "Lensa jamur",
      proceeds: 500_000,
    });

    expect(row.proceeds).toBe(0);
    expect(assetStatusOf(kamera.id)).toBe("MENUNGGU_PELEPASAN");
    expect(decideDisposal(row.code, "CANCELLED")?.status).toBe("CANCELLED");
    expect(assetStatusOf(kamera.id)).toBe("AKTIF");
    expect(decideDisposal(row.code, "APPROVED")).toBeNull();
  });

  test("bendahara menyetujui di Permintaan Persetujuan → barang dilepas", async () => {
    const approvals = createPermintaanPersetujuanMock({
      roleUserId: 4,
      positions: [],
      jemaatName: "Maria Hutapea",
    });
    const grants = [MENU.PERMINTAAN_PERSETUJUAN];
    const printer = assetNamed("Printer Canon G2010");
    const pending = DISPOSAL.find(
      (row) => row.assetId === printer.id && row.status === "PENDING",
    );
    if (!pending?.approval) throw new Error("seed");

    const queue = await call(
      approvals,
      "/persetujuan?menunggu=saya&limit=100",
      grants,
    );
    expect(
      queue?.body.data.some(
        (row: { publicId: string; documentType: string }) =>
          row.publicId === pending.approval?.publicId &&
          row.documentType === "ASSET_DISPOSAL",
      ),
    ).toBe(true);

    const approved = await call(
      approvals,
      `/persetujuan/${pending.approval.publicId}/setujui`,
      grants,
      { method: "PUT" },
    );

    expect(approved?.status).toBe(200);
    expect(assetStatusOf(printer.id)).toBe("DILEPAS");
  });
});

describe("handler inventaris", () => {
  test("ddl dijaga menu pemakai; kosong = 404 berpesan", async () => {
    expect(
      (await call(inventarisMock, "/ddl/unit", [MENU.RUANG]))?.status,
    ).toBe(403);
    expect(
      (await call(inventarisMock, "/ddl/unit", [MENU.BARANG_PERSEDIAAN]))
        ?.status,
    ).toBe(200);
    expect(
      await call(inventarisMock, "/ddl/asset?filter=tidak-ada", [
        MENU.SIKLUS_ASET,
      ]),
    ).toEqual({
      status: 404,
      body: { status: 404, error: "Barang Tidak Ditemukan" },
    });
    expect(await call(inventarisMock, "/ddl/jemaat", [MENU.BARANG])).toBeNull();
  });
});
