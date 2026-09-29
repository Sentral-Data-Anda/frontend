/**
 * Rangka handler kas-keluar (docs/design/keuangan/README.md §4 TL-4). Agent fitur
 * mengisi berkas ini; registrasinya sudah ada supaya tidak ada yang menyunting
 * handlers/index.ts. Mengembalikan null = "bukan milik handler ini".
 */
import type { MockHandler } from "../kit";

export const kasKeluarMock: MockHandler = (ctx) => {
  if (ctx.path !== "/kas-keluar" && !ctx.path.startsWith("/kas-keluar/"))
    return null;

  return null;
};
