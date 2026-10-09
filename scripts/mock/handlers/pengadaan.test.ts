import { afterAll, describe, expect, test } from "bun:test";

import { MENU, type MenuSlug } from "../../../src/config/menu";
import { TODAY } from "../inventaris-store";
import type { MockHandler } from "../kit";
import { PURCHASE_REQUEST } from "../pengadaan-store";

import { inventarisMock } from "./inventaris";
import { pengadaanMock } from "./pengadaan";
import { createPermintaanPersetujuanMock } from "./permintaan-persetujuan";

type Body = {
  status: number;
  error?: string;
  data?: unknown;
};

const call = async (
  handler: MockHandler,
  path: string,
  grants: MenuSlug[],
  init: RequestInit = {},
) => {
  const url = new URL(`/api/v1${path}`, "http://mock.test");
  const response = await handler({
    request: new Request(url, init),
    url,
    path: path.split("?")[0] ?? path,
    method: init.method ?? "GET",
    can: (slug) => grants.includes(slug),
    isAdmin: false,
    sessionCode: "test",
  });

  return response
    ? { status: response.status, body: (await response.json()) as Body }
    : null;
};

const saved = PURCHASE_REQUEST.map((row) => structuredClone(row));

afterAll(() => {
  PURCHASE_REQUEST.splice(saved.length);
  saved.forEach((row, index) =>
    Object.assign(PURCHASE_REQUEST[index] ?? {}, row),
  );
});

const rowsOf = (body: Body) => body.data as Record<string, unknown>[];

describe("ddl pengadaan", () => {
  test("permintaan pembelian: dijaga Pesanan, hanya yang disetujui", async () => {
    const denied = await call(pengadaanMock, "/ddl/permintaan-pembelian", [
      MENU.STOCK_MOVEMENT,
    ]);
    const allowed = await call(pengadaanMock, "/ddl/permintaan-pembelian", [
      MENU.PURCHASE_ORDER,
    ]);

    expect(denied?.status).toBe(403);
    expect(allowed?.status).toBe(200);
    expect(rowsOf(allowed?.body ?? { status: 0 })[0]).toHaveProperty(
      "orderedTotalIDR",
    );
  });

  test("pesanan terbuka untuk Penerimaan", async () => {
    const open = await call(pengadaanMock, "/ddl/pesanan-pembelian?terbuka=1", [
      MENU.GOODS_RECEIPT,
    ]);
    const statuses = rowsOf(open?.body ?? { status: 0 }).map(
      (row) => row.status,
    );

    expect(statuses.length).toBeGreaterThan(0);
    expect(
      statuses.every(
        (status) => status === "ISSUED" || status === "PARTIALLY_RECEIVED",
      ),
    ).toBe(true);
  });

  test("mata uang dan kurs", async () => {
    const grants = [MENU.PURCHASE_ORDER];
    const currency = await call(pengadaanMock, "/ddl/currency", grants);
    const usd = await call(
      pengadaanMock,
      `/ddl/kurs?currencyCode=USD&date=${TODAY}`,
      grants,
    );
    const eur = await call(
      pengadaanMock,
      `/ddl/kurs?currencyCode=EUR&date=${TODAY}`,
      grants,
    );

    expect(rowsOf(currency?.body ?? { status: 0 })[0]?.code).toBe("IDR");
    expect(usd?.body.data).toMatchObject({
      currencyCode: "USD",
      rate: "15800",
    });
    expect(eur?.status).toBe(404);
    expect(eur?.body).toMatchObject({
      error:
        "Belum Ada Kurs EUR Untuk Tanggal Tersebut. Isi Kursnya Terlebih Dahulu",
      issues: [{ path: "currencyCode" }],
    });

    const unknown = await call(
      pengadaanMock,
      `/ddl/kurs?currencyCode=XYZ&date=${TODAY}`,
      grants,
    );
    const missing = await call(
      pengadaanMock,
      "/ddl/kurs?currencyCode=USD",
      grants,
    );

    expect(unknown?.status).toBe(404);
    expect(unknown?.body.error).toBe("Mata Uang Tidak Ditemukan");
    expect(missing?.status).toBe(400);
    expect(missing?.body.error).toBe("Mohon Lengkapi Tanggal");
  });

  test("guard ddl Inventaris diperluas untuk form Pengadaan", async () => {
    for (const path of ["/ddl/type-item", "/ddl/unit", "/ddl/supplier"]) {
      const result = await call(inventarisMock, path, [MENU.PURCHASE_ORDER]);
      expect(result?.status).toBe(200);
    }

    const stock = await call(inventarisMock, "/ddl/barang-persediaan", [
      MENU.GOODS_RECEIPT,
    ]);
    expect(rowsOf(stock?.body ?? { status: 0 })[0]?.unit).toHaveProperty("id");
  });
});

describe("persetujuan permintaan pembelian", () => {
  const bendahara = createPermintaanPersetujuanMock({
    roleUserId: 4,
    positions: [{ name: "Bendahara", bapelId: 1 }],
    jemaatName: "Maria Hutapea",
  });
  const all = [MENU.APPROVAL_REQUEST];

  const approvalOf = (purpose: string) => {
    const request = PURCHASE_REQUEST.find((row) => row.purpose === purpose);
    const approval = request?.approvals.at(-1);
    if (!request || !approval) throw new Error(purpose);

    return { request, approval };
  };

  test("disetujui di layar persetujuan → permintaan Disetujui", async () => {
    const { request, approval } = approvalOf(
      "Perlengkapan dapur persekutuan kaum ibu",
    );
    const detail = await call(
      bendahara,
      `/persetujuan/${approval.publicId}`,
      all,
    );

    expect(detail?.body.data).toMatchObject({
      documentType: "PURCHASE_REQUEST",
      document: { code: request.code },
      canSign: true,
    });

    const approved = await call(
      bendahara,
      `/persetujuan/${approval.publicId}/setujui`,
      all,
      { method: "PUT" },
    );

    expect(approved?.status).toBe(200);
    expect(request.status).toBe("APPROVED");
  });

  test("ditarik pengaju → permintaan kembali Draf", async () => {
    const { request, approval } = approvalOf(
      "Proyektor portabel untuk persekutuan pemuda",
    );
    const withdrawn = await call(
      bendahara,
      `/persetujuan/${approval.publicId}/tarik`,
      all,
      { method: "PUT" },
    );

    expect(withdrawn?.status).toBe(200);
    expect(request.status).toBe("DRAFT");
  });
});
