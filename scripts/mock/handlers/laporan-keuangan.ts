/**
 * Rangka handler laporan-keuangan (docs/design/keuangan/README.md §4 TL-4). Agent fitur
 * mengisi berkas ini; registrasinya sudah ada supaya tidak ada yang menyunting
 * handlers/index.ts. Mengembalikan null = "bukan milik handler ini".
 */
import type { MockHandler } from "../kit";

export const laporanKeuanganMock: MockHandler = (ctx) => {
  if (
    ctx.path !== "/laporan-keuangan" &&
    !ctx.path.startsWith("/laporan-keuangan/")
  )
    return null;

  return null;
};
