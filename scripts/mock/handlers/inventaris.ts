/**
 * Bagian bersama grup Inventaris milik TL (docs/design/inventaris/README.md §4 TL-8):
 * ddl tipe barang, satuan, barang, barang persediaan, dan supplier.
 */
import { MENU, type MenuSlug } from "../../../src/config/menu";
import {
  assetDdl,
  stockItemDdl,
  supplierDdl,
  typeItemDdl,
  unitDdl,
} from "../inventaris-store";
import { denied, json, type MockContext, type MockHandler } from "../kit";

const DDL: Record<
  string,
  {
    menus: MenuSlug[];
    empty: string;
    rows: (params: URLSearchParams) => unknown[];
  }
> = {
  "type-item": {
    menus: [MENU.TIPE_BARANG, MENU.BARANG, MENU.BARANG_PERSEDIAAN],
    empty: "Tipe Barang Tidak Ditemukan",
    rows: typeItemDdl,
  },
  unit: {
    menus: [MENU.SATUAN, MENU.BARANG_PERSEDIAAN],
    empty: "Satuan Tidak Ditemukan",
    rows: unitDdl,
  },
  asset: {
    menus: [MENU.SIKLUS_ASET, MENU.BARANG],
    empty: "Barang Tidak Ditemukan",
    rows: (params) =>
      assetDdl({ filter: params.get("filter") ?? "", limit: limitOf(params) }),
  },
  "barang-persediaan": {
    menus: [MENU.BARANG_PERSEDIAAN, MENU.MUTASI_STOK, MENU.STOK_OPNAME],
    empty: "Barang Persediaan Tidak Ditemukan",
    rows: (params) =>
      stockItemDdl({
        filter: params.get("filter") ?? "",
        limit: limitOf(params),
        roomId: Number(params.get("roomId")) || null,
      }),
  },
  supplier: {
    menus: [MENU.SUPPLIER, MENU.SIKLUS_ASET],
    empty: "Supplier Tidak Ditemukan",
    rows: supplierDdl,
  },
};

const limitOf = (params: URLSearchParams) =>
  Number(params.get("limit")) || null;

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

export const inventarisMock: MockHandler = (ctx) => {
  if (ctx.method !== "GET") return null;

  const ddlMatch = ctx.path.match(/^\/ddl\/([a-z-]+)$/);
  if (ddlMatch) return ddl(ctx, ddlMatch[1]);

  return null;
};
