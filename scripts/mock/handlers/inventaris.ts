/**
 * Bagian bersama grup Inventaris milik TL (docs/design/inventaris/README.md §4 TL-8):
 * ddl tipe barang, satuan, barang, barang persediaan, supplier, dan cadangan baca
 * `/siklus-aset/*?assetId=` untuk riwayat di halaman Barang sampai handler Siklus
 * Aset menjawab.
 *
 *   MOCK_ASSET_HISTORY_500=1     → cadangan riwayat siklus menjawab 500
 */
import { MENU, type MenuSlug } from "../../../src/config/menu";
import {
  DISPOSAL,
  MAINTENANCE,
  TRANSFER,
  assetDdl,
  disposalView,
  isLive,
  maintenanceView,
  stockItemDdl,
  supplierDdl,
  transferView,
  typeItemDdl,
  unitDdl,
} from "../inventaris-store";
import { denied, json, list, type MockContext, type MockHandler } from "../kit";

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

const HISTORY = {
  perawatan: {
    name: "Perawatan Barang",
    rows: (assetId: number) =>
      MAINTENANCE.filter((row) => isLive(row) && row.assetId === assetId)
        .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate))
        .map(maintenanceView),
  },
  mutasi: {
    name: "Mutasi Barang",
    rows: (assetId: number) =>
      TRANSFER.filter((row) => row.assetId === assetId)
        .sort((a, b) => b.transferDate.localeCompare(a.transferDate))
        .map(transferView),
  },
  pelepasan: {
    name: "Pelepasan Barang",
    rows: (assetId: number) =>
      DISPOSAL.filter((row) => row.assetId === assetId)
        .sort((a, b) => b.disposalDate.localeCompare(a.disposalDate))
        .map(disposalView),
  },
} as const;

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

const history = (ctx: MockContext, kind: keyof typeof HISTORY) => {
  const assetId = Number(ctx.url.searchParams.get("assetId"));
  if (!assetId) return null;
  if (!ctx.can(MENU.SIKLUS_ASET, "VIEW")) return denied();
  if (process.env.MOCK_ASSET_HISTORY_500) {
    return json({ status: 500, error: "Internal Server Error" }, 500);
  }

  const { name, rows } = HISTORY[kind];

  return list(
    rows(assetId),
    ctx.url,
    name,
    name,
    `Berhasil Mendapatkan ${name}`,
  );
};

export const inventarisMock: MockHandler = (ctx) => {
  if (ctx.method !== "GET") return null;

  const ddlMatch = ctx.path.match(/^\/ddl\/([a-z-]+)$/);
  if (ddlMatch) return ddl(ctx, ddlMatch[1]);

  const historyMatch = ctx.path.match(
    /^\/siklus-aset\/(perawatan|mutasi|pelepasan)$/,
  );
  if (historyMatch) {
    return history(ctx, historyMatch[1] as keyof typeof HISTORY);
  }

  return null;
};
