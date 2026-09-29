/**
 * Bagian bersama grup Keuangan milik TL (docs/design/keuangan/README.md §4 TL-4):
 * ddl akun dan tipe persembahan. Terdaftar sesudah handler fitur.
 */
import { MENU, type MenuSlug } from "../../../src/config/menu";
import { accountDdl, typePersembahanDdl } from "../keuangan-store";
import { denied, json, type MockContext, type MockHandler } from "../kit";

const DDL: Record<
  string,
  {
    menus: MenuSlug[];
    empty: string;
    rows: (params: URLSearchParams) => unknown[];
  }
> = {
  account: {
    menus: [
      MENU.AKUN,
      MENU.JURNAL,
      MENU.SETELAN_AKUNTANSI,
      MENU.TIPE_PERSEMBAHAN,
      MENU.KAS_MASUK,
      MENU.KAS_KELUAR,
      MENU.SETORAN,
      MENU.LAPORAN_KEUANGAN,
    ],
    empty: "Akun Tidak Ditemukan",
    rows: accountDdl,
  },
  "tipe-persembahan": {
    menus: [MENU.TIPE_PERSEMBAHAN, MENU.PERSEMBAHAN, MENU.PEMBAYARAN],
    empty: "Tipe Persembahan Tidak Ditemukan",
    rows: typePersembahanDdl,
  },
};

const ddl = (ctx: MockContext, name: string) => {
  const entry = DDL[name];

  if (!entry) return null;
  if (!entry.menus.some((slug) => ctx.can(slug, "VIEW"))) return denied();

  const isBlanked = name === "account" && Boolean(process.env.MOCK_NO_ACCOUNTS);
  const rows = isBlanked ? [] : entry.rows(ctx.url.searchParams);

  if (rows.length === 0) {
    return json({ status: 404, error: entry.empty }, 404);
  }

  return json({
    status: 200,
    message: "Berhasil Mendapatkan Data",
    data: rows,
  });
};

export const keuanganMock: MockHandler = (ctx) => {
  if (ctx.method !== "GET") return null;

  const match = ctx.path.match(/^\/ddl\/([a-z-]+)$/);

  return match ? ddl(ctx, match[1] ?? "") : null;
};
