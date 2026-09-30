import { Glob } from "bun";
import { describe, expect, test } from "bun:test";

/**
 * Layar Pembayaran menampilkan nama pemberi dan nominalnya. Pemberian bernama
 * hanya boleh terlihat oleh bendahara dan pemberinya: tidak pernah di laporan,
 * widget Beranda, atau warta. Batas itu dijaga sebagai batas berkas, karena satu
 * impor lintas fitur sudah cukup untuk membocorkannya tanpa ada yang sadar.
 *
 * Nama field `donorName` sendiri bukan penanda: Inventaris memakainya untuk
 * penyumbang barang, hal yang berbeda. Yang dijaga adalah jalur impornya.
 */
const ROOT = new URL("../../../../", import.meta.url).pathname;

const OWNED = "src/features/keuangan/pembayaran/";

const ROUTES = "src/app/(app)/keuangan/pembayaran/";

/**
 * Pelanggaran yang sudah ada sebelum layar ini dan bukan milik agent Pembayaran:
 * widget "yang perlu dibayar" di Beranda membaca pembayaran gagal dan
 * kedaluwarsa, lalu menulis nama pemberinya di barisnya. Berkasnya milik
 * Beranda, jadi dicatat di sini supaya terlihat dan supaya kebocoran baru tetap
 * membuat test ini merah.
 */
const KNOWN_BERANDA_LEAK = [
  "src/features/beranda/api.ts",
  "src/features/beranda/widgets/payables/data.ts",
];

const readSources = async () => {
  const files: { path: string; text: string }[] = [];

  for await (const path of new Glob("src/**/*.{ts,tsx}").scan(ROOT)) {
    if (path.startsWith(OWNED)) continue;

    files.push({ path, text: await Bun.file(`${ROOT}${path}`).text() });
  }

  return files;
};

describe("pemberian bernama tidak keluar dari layar Pembayaran", () => {
  test("hanya rute Pembayaran yang mengimpor fiturnya", async () => {
    const files = await readSources();
    const leaked = files.filter(
      (file) =>
        /@\/features\/keuangan\/pembayaran/.test(file.text) &&
        !file.path.startsWith(ROUTES),
    );

    expect(leaked.map((file) => file.path)).toEqual([]);
  });

  test("Beranda dan Laporan Keuangan tidak membaca daftar pembayaran", async () => {
    const files = await readSources();
    const leaked = files
      .filter(
        (file) =>
          (file.path.startsWith("src/features/beranda/") ||
            file.path.startsWith("src/features/keuangan/laporan-keuangan/")) &&
          /["']pembayaran["']|\/pembayaran\?/.test(file.text),
      )
      .map((file) => file.path)
      .filter((path) => !KNOWN_BERANDA_LEAK.includes(path));

    expect(leaked).toEqual([]);
  });

  test("tidak ada komponen bersama yang menyebut pemberi pembayaran", async () => {
    const files = await readSources();
    const leaked = files.filter(
      (file) =>
        file.path.startsWith("src/components/") &&
        /giverOf|donorName|nama pemberi/i.test(file.text),
    );

    expect(leaked.map((file) => file.path)).toEqual([]);
  });

  test("tautan bayar milik jemaat tidak pernah dirender layar staf", async () => {
    const files: string[] = [];

    for await (const path of new Glob(`${OWNED}**/*.{ts,tsx}`).scan(ROOT)) {
      if (path.endsWith(".test.ts") || path.endsWith(".test.tsx")) continue;

      const text = await Bun.file(`${ROOT}${path}`).text();

      if (/invoiceUrl/.test(text)) files.push(path);
    }

    expect(files).toEqual([]);
  });
});
