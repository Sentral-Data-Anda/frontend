/**
 * Bagian bersama grup Fasilitas milik TL (docs/design/fasilitas/README.md §4):
 * `GET /ddl/room` (ruang hidup + `isActive`, B19).
 */
import { MENU } from "../../../src/config/menu";
import { roomDdl } from "../fasilitas-store";
import { denied, json, type MockHandler } from "../kit";

const ROOM_DDL_MENUS = [
  MENU.RUANG,
  MENU.ASSET_MASTER,
  MENU.EVENT,
  MENU.PEMINJAMAN_RUANG,
  MENU.IBADAH,
  MENU.STOCK_ITEM,
  MENU.STOK_OPNAME,
  MENU.ASSET_TRANSACTION,
  MENU.PURCHASE_ORDER,
] as const;

export const fasilitasMock: MockHandler = (ctx) => {
  if (ctx.method !== "GET") return null;

  if (ctx.path === "/ddl/room") {
    if (!ROOM_DDL_MENUS.some((slug) => ctx.can(slug, "VIEW"))) return denied();

    const rows = roomDdl();

    return rows.length === 0 || process.env.MOCK_DDL_EMPTY
      ? json({ status: 404, error: "Ruang Tidak Ditemukan" }, 404)
      : json({
          status: 200,
          message: "Berhasil Mendapatkan Semua Ruang",
          data: rows,
        });
  }

  return null;
};
