/**
 * Bagian bersama grup Pengadaan milik TL (docs/design/pengadaan/README.md §4 TL-4):
 * ddl permintaan pembelian, pesanan pembelian, mata uang, dan pratinjau kurs.
 */
import { MENU, type MenuSlug } from "../../../src/config/menu";
import { denied, json, type MockContext, type MockHandler } from "../kit";
import {
  currencyDdl,
  kursPreview,
  noRateMessage,
  purchaseOrderDdl,
  purchaseRequestDdl,
} from "../pengadaan-store";

const DDL: Record<
  string,
  {
    menus: MenuSlug[];
    empty: string;
    rows: (params: URLSearchParams) => unknown[];
  }
> = {
  "permintaan-pembelian": {
    menus: [MENU.PESANAN_PEMBELIAN],
    empty: "Permintaan Pembelian Tidak Ditemukan",
    rows: (params) =>
      purchaseRequestDdl({
        filter: params.get("filter") ?? "",
        limit: Number(params.get("limit")) || null,
      }),
  },
  "pesanan-pembelian": {
    menus: [MENU.PENERIMAAN_BARANG, MENU.PESANAN_PEMBELIAN],
    empty: "Pesanan Pembelian Tidak Ditemukan",
    rows: (params) =>
      purchaseOrderDdl({
        filter: params.get("filter") ?? "",
        isOpen: params.get("terbuka") === "1",
        supplierId: Number(params.get("supplierId")) || null,
      }),
  },
  currency: {
    menus: [MENU.PESANAN_PEMBELIAN, MENU.MATA_UANG],
    empty: "Mata Uang Tidak Ditemukan",
    rows: currencyDdl,
  },
};

const KURS_MENUS: MenuSlug[] = [MENU.PESANAN_PEMBELIAN, MENU.MATA_UANG];

const ddl = (ctx: MockContext, name: string) => {
  const entry = DDL[name];
  if (!entry) return null;
  if (!entry.menus.some((slug) => ctx.can(slug, "VIEW"))) return denied();

  const rows = process.env.MOCK_DDL_EMPTY
    ? []
    : entry.rows(ctx.url.searchParams);

  return rows.length === 0
    ? json({ status: 404, error: entry.empty }, 404)
    : json({ status: 200, message: "Berhasil Mendapatkan Data", data: rows });
};

const kurs = (ctx: MockContext) => {
  if (!KURS_MENUS.some((slug) => ctx.can(slug, "VIEW"))) return denied();

  const params = ctx.url.searchParams;
  const code = params.get("currencyCode") ?? "";
  const date = params.get("date") ?? "";
  const found = code && date ? kursPreview(code, date.slice(0, 10)) : null;

  return found
    ? json({ status: 200, message: "Berhasil Mendapatkan Kurs", data: found })
    : json({ status: 404, error: noRateMessage(code || "-") }, 404);
};

export const pengadaanMock: MockHandler = (ctx) => {
  if (ctx.method !== "GET") return null;
  if (ctx.path === "/ddl/kurs") return kurs(ctx);

  const match = ctx.path.match(/^\/ddl\/([a-z-]+)$/);

  return match ? ddl(ctx, match[1] ?? "") : null;
};
