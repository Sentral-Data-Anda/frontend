import { Glob } from "bun";
import { describe, expect, test } from "bun:test";

/**
 * Pemberian bernama hanya boleh terlihat oleh bendahara dan pemberinya: tidak
 * pernah di laporan, widget Beranda, atau warta. Batas itu dijaga sebagai batas
 * berkas, karena satu impor lintas fitur sudah cukup untuk membocorkannya tanpa
 * ada yang sadar.
 *
 * Nama field `donorName` sendiri bukan penanda: Inventaris memakainya untuk
 * penyumbang barang, hal yang berbeda. Yang dijaga adalah jalur impornya.
 */
const ROOT = new URL("../../../../", import.meta.url).pathname;

const OWNED = "src/features/keuangan/persembahan/";

const ROUTES = "src/app/(app)/finance/persembahan/";

const readSources = async () => {
  const files: { path: string; text: string }[] = [];

  for await (const path of new Glob("src/**/*.{ts,tsx}").scan(ROOT)) {
    if (path.startsWith(OWNED)) continue;

    files.push({ path, text: await Bun.file(`${ROOT}${path}`).text() });
  }

  return files;
};

describe("pemberian bernama tidak keluar dari layar Persembahan", () => {
  test("hanya rute Persembahan yang mengimpor fiturnya", async () => {
    const files = await readSources();
    const leaked = files.filter(
      (file) =>
        /@\/features\/keuangan\/persembahan/.test(file.text) &&
        !file.path.startsWith(ROUTES),
    );

    expect(leaked.map((file) => file.path)).toEqual([]);
  });

  test("Beranda dan Laporan Keuangan tidak membaca daftar persembahan", async () => {
    const files = await readSources();
    const leaked = files.filter(
      (file) =>
        (file.path.startsWith("src/features/beranda/") ||
          file.path.startsWith("src/features/keuangan/laporan-keuangan/")) &&
        /["']persembahan["']|\/persembahan\?/.test(file.text),
    );

    expect(leaked.map((file) => file.path)).toEqual([]);
  });

  test("tidak ada komponen bersama yang menyebut pemberi persembahan", async () => {
    const files = await readSources();
    const leaked = files.filter(
      (file) =>
        file.path.startsWith("src/components/") &&
        /giverOf|donorName|nama pemberi/i.test(file.text),
    );

    expect(leaked.map((file) => file.path)).toEqual([]);
  });
});
