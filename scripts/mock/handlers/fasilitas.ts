/**
 * Bagian bersama grup Fasilitas milik TL (docs/design/fasilitas/README.md §4):
 * cadangan `GET /loan-room` (bentuk B10/B11, untuk Beranda sebelum handler
 * Peminjaman ada) dan `GET /ddl/room` (ruang hidup + `isActive`, B19).
 * Terdaftar sesudah handler fitur, jadi handler fitur yang menang.
 */
import { MENU } from "../../../src/config/menu";
import { listLoans, roomDdl } from "../fasilitas-store";
import { denied, json, list, type MockHandler } from "../kit";

const ROOM_DDL_MENUS = [
  MENU.RUANG,
  MENU.BARANG,
  MENU.EVENT,
  MENU.PEMINJAMAN_RUANG,
  MENU.IBADAH,
] as const;

export const fasilitasMock: MockHandler = (ctx) => {
  if (ctx.method !== "GET") return null;

  if (ctx.path === "/ddl/room") {
    if (!ROOM_DDL_MENUS.some((slug) => ctx.can(slug, "VIEW"))) return denied();

    const rows = roomDdl();

    return rows.length === 0 || process.env.MOCK_DDL_EMPTY
      ? json({ status: 404, error: "Ruangan Tidak Ditemukan" }, 404)
      : json({
          status: 200,
          message: "Berhasil Mendapatkan Semua Ruangan",
          data: rows,
        });
  }

  if (ctx.path === "/loan-room") {
    if (!ctx.can(MENU.PEMINJAMAN_RUANG, "VIEW")) return denied();

    return list(
      listLoans(ctx.url.searchParams),
      ctx.url,
      "Pemakaian Ruangan",
      "Pemakaian Ruangan",
    );
  }

  return null;
};
