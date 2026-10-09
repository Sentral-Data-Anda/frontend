/**
 * Bagian bersama grup Anggaran milik TL (docs/design/anggaran/README.md §4 TL-8):
 * ddl program. Terdaftar sesudah handler fitur.
 *
 * Guard-nya TIDAK memuat KAS_KELUAR: Program tidak ada di Kas Keluar
 * (keputusan user U4), dan atribusi program terjadi di baris LPJ.
 */
import { MENU, type MenuSlug } from "../../../src/config/menu";
import { programDdl } from "../anggaran-store";
import { denied, json, type MockContext, type MockHandler } from "../kit";

const DDL: Record<
  string,
  {
    menus: MenuSlug[];
    empty: string;
    rows: (params: URLSearchParams) => unknown[];
  }
> = {
  program: {
    menus: [MENU.PROGRAM, MENU.BUDGET_REALIZATION],
    empty: "Program Tidak Ditemukan",
    rows: programDdl,
  },
};

const ddl = (ctx: MockContext, name: string) => {
  const entry = DDL[name];

  if (!entry) return null;
  if (!entry.menus.some((slug) => ctx.can(slug, "VIEW"))) return denied();

  const rows = entry.rows(ctx.url.searchParams);

  if (rows.length === 0) {
    return json({ status: 404, error: entry.empty }, 404);
  }

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Data",
    data: rows,
  });
};

export const anggaranMock: MockHandler = (ctx) => {
  if (ctx.method !== "GET") return null;

  const match = ctx.path.match(/^\/ddl\/([a-z-]+)$/);

  return match ? ddl(ctx, match[1] ?? "") : null;
};
