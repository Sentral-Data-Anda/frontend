/**
 * Bagian bersama grup Pengadaan milik TL (docs/design/pengadaan/README.md §4 TL-4):
 * ddl permintaan pembelian, pesanan pembelian, mata uang, dan pratinjau kurs.
 */
import { MENU, type MenuSlug } from "../../../src/config/menu";
import { denied, json, type MockContext, type MockHandler } from "../kit";
import {
  currencyDdl,
  currencyOf,
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
    menus: [MENU.PURCHASE_ORDER],
    empty: "Permintaan Pembelian Tidak Ditemukan",
    rows: (params) =>
      purchaseRequestDdl({
        filter: params.get("filter") ?? "",
        limit: Number(params.get("limit")) || null,
      }),
  },
  "pesanan-pembelian": {
    menus: [MENU.GOODS_RECEIPT, MENU.PURCHASE_ORDER],
    empty: "Pesanan Pembelian Tidak Ditemukan",
    rows: (params) =>
      purchaseOrderDdl({
        filter: params.get("filter") ?? "",
        isOpen: params.get("terbuka") === "1",
        supplierId: Number(params.get("supplierId")) || null,
        limit: Number(params.get("limit")) || null,
      }),
  },
  currency: {
    menus: [MENU.PURCHASE_ORDER, MENU.CURRENCY],
    empty: "Mata Uang Tidak Ditemukan",
    rows: currencyDdl,
  },
};

const KURS_MENUS: MenuSlug[] = [MENU.PURCHASE_ORDER, MENU.CURRENCY];

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

const fieldFail = (status: number, path: string, message: string) =>
  json({ status, error: message, issues: [{ path, message }] }, status);

const kursQueryIssue = (code: string, date: string) => {
  if (!code)
    return { path: "currencyCode", message: "Mohon Lengkapi Mata Uang" };
  if (code.length !== 3) {
    return { path: "currencyCode", message: "Kode Mata Uang harus 3 huruf" };
  }
  if (!date) return { path: "date", message: "Mohon Lengkapi Tanggal" };

  return null;
};

const kurs = (ctx: MockContext) => {
  if (!KURS_MENUS.some((slug) => ctx.can(slug, "VIEW"))) return denied();

  const params = ctx.url.searchParams;
  const code = (params.get("currencyCode") ?? "").trim();
  const date = (params.get("date") ?? "").slice(0, 10);
  const issue = kursQueryIssue(code, date);

  if (issue) return fieldFail(400, issue.path, issue.message);
  if (!currencyOf(code)) {
    return fieldFail(404, "currencyCode", "Mata Uang Tidak Ditemukan");
  }

  const found = kursPreview(code, date);

  return found
    ? json({ status: 200, message: "Berhasil Mendapatkan Kurs", data: found })
    : fieldFail(404, "currencyCode", noRateMessage(code));
};

export const pengadaanMock: MockHandler = (ctx) => {
  if (ctx.method !== "GET") return null;
  if (ctx.path === "/ddl/kurs") return kurs(ctx);

  const match = ctx.path.match(/^\/ddl\/([a-z-]+)$/);

  return match ? ddl(ctx, match[1] ?? "") : null;
};
