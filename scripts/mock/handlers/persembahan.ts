/**
 * Rangka handler persembahan (docs/design/keuangan/README.md §4 TL-4). Agent fitur
 * mengisi berkas ini; registrasinya sudah ada supaya tidak ada yang menyunting
 * handlers/index.ts. Mengembalikan null = "bukan milik handler ini".
 */
import type { MockHandler } from "../kit";

export const persembahanMock: MockHandler = (ctx) => {
  if (ctx.path !== "/persembahan" && !ctx.path.startsWith("/persembahan/"))
    return null;

  return null;
};
