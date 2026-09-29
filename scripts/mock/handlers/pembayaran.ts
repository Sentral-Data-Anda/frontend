/**
 * Rangka handler pembayaran (docs/design/keuangan/README.md §4 TL-4). Agent fitur
 * mengisi berkas ini; registrasinya sudah ada supaya tidak ada yang menyunting
 * handlers/index.ts. Mengembalikan null = "bukan milik handler ini".
 */
import type { MockHandler } from "../kit";

export const pembayaranMock: MockHandler = (ctx) => {
  if (ctx.path !== "/pembayaran" && !ctx.path.startsWith("/pembayaran/"))
    return null;

  return null;
};
