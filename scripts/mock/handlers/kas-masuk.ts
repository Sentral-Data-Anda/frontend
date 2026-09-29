/**
 * Rangka handler kas-masuk (docs/design/keuangan/README.md §4 TL-4). Agent fitur
 * mengisi berkas ini; registrasinya sudah ada supaya tidak ada yang menyunting
 * handlers/index.ts. Mengembalikan null = "bukan milik handler ini".
 */
import type { MockHandler } from "../kit";

export const kasMasukMock: MockHandler = (ctx) => {
  if (ctx.path !== "/kas-masuk" && !ctx.path.startsWith("/kas-masuk/"))
    return null;

  return null;
};
